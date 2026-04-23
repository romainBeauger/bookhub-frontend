import { useEffect, useMemo, useState } from "react";
import {
    createAdminUser,
    deleteAdminUser,
    getAdminUsers,
    suspendAdminUser,
    unsuspendAdminUser,
    updateAdminUser,
} from "../../services/adminUserService.js";
import { getUserRoles, hasRole } from "../../utils/auth.js";

const ROLE_OPTIONS = [
    { value: "ROLE_USER", label: "Lecteur" },
    { value: "ROLE_LIBRARIAN", label: "Libraire" },
    { value: "ROLE_ADMIN", label: "Admin" },
];

function extractUsers(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.users)) {
        return payload.users;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    return [];
}

function getUserDisplayName(managedUser) {
    const fullName = [
        managedUser?.firstName,
        managedUser?.prenom,
        managedUser?.lastName,
        managedUser?.nom,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || managedUser?.email || `Utilisateur #${managedUser?.id ?? "?"}`;
}

function getRoleLabel(managedUser) {
    const roles = getUserRoles(managedUser);

    if (roles.includes("ROLE_ADMIN")) {
        return "Admin";
    }

    if (roles.includes("ROLE_LIBRARIAN")) {
        return "Libraire";
    }

    return "Lecteur";
}

function isUserSuspended(managedUser) {
    return Boolean(
        managedUser?.isSuspended
        || managedUser?.suspended
        || managedUser?.suspendedAt
        || managedUser?.status === "SUSPENDED"
        || managedUser?.active === false
        || managedUser?.enabled === false
    );
}

function getUserStatusLabel(managedUser) {
    return isUserSuspended(managedUser) ? "Suspendu" : "Actif";
}

function getUserStatusClass(managedUser) {
    return isUserSuspended(managedUser)
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const normalizedValue = typeof value === "string" ? value.replace(" ", "T") : value;
    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("fr-FR");
}

function getSuspendedUntil(managedUser) {
    if (!managedUser || typeof managedUser !== "object") {
        return undefined;
    }

    const suspensionKeys = [
        "suspendedUntil",
        "suspensionUntil",
        "suspensionEndAt",
        "suspensionEndsAt",
        "suspendedUntilAt",
        "suspended_until",
        "suspension_until",
        "suspension_end_at",
        "suspension_ends_at",
    ];

    for (const key of suspensionKeys) {
        if (Object.prototype.hasOwnProperty.call(managedUser, key)) {
            return managedUser[key];
        }
    }

    return undefined;
}

function getSuspensionEndDate(duration) {
    const normalizedDuration = Number(duration);

    if (!Number.isInteger(normalizedDuration) || normalizedDuration <= 0) {
        return null;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + normalizedDuration);

    return nextDate;
}

function buildUserFormState(managedUser = null) {
    const roles = getUserRoles(managedUser);
    const selectedRole = roles.includes("ROLE_ADMIN")
        ? "ROLE_ADMIN"
        : roles.includes("ROLE_LIBRARIAN")
            ? "ROLE_LIBRARIAN"
            : "ROLE_USER";

    return {
        prenom: managedUser?.prenom || managedUser?.firstName || "",
        nom: managedUser?.nom || managedUser?.lastName || "",
        email: managedUser?.email || "",
        phone: managedUser?.phone || managedUser?.telephone || "",
        role: selectedRole,
        motDePasse: "",
    };
}

function buildUserPayload(form, mode) {
    const payload = {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        role: form.role,
    };

    if (form.phone.trim()) {
        payload.phone = form.phone.trim();
    }

    if (mode === "create") {
        payload.mot_de_passe = form.motDePasse;
    }

    return payload;
}

function StatCard({ label, value, tone = "default" }) {
    const toneClassName = tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-800";

    return (
        <article className={`rounded-2xl border p-5 ${toneClassName}`}>
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
        </article>
    );
}

function EmptyState({ message }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            {message}
        </section>
    );
}

function ErrorState({ message }) {
    return (
        <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
            {message}
        </section>
    );
}

function UserManagementModal({
    open,
    mode,
    form,
    error,
    saving,
    isSelfEdit,
    onChange,
    onClose,
    onSubmit,
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Gestion utilisateurs
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            {mode === "create" ? "Ajouter un utilisateur" : "Modifier un utilisateur"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                        Fermer
                    </button>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="managed-user-prenom" className="mb-2 block text-sm font-semibold text-slate-900">
                                Prenom
                            </label>
                            <input
                                id="managed-user-prenom"
                                type="text"
                                value={form.prenom}
                                onChange={(event) => onChange("prenom", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="managed-user-nom" className="mb-2 block text-sm font-semibold text-slate-900">
                                Nom
                            </label>
                            <input
                                id="managed-user-nom"
                                type="text"
                                value={form.nom}
                                onChange={(event) => onChange("nom", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="managed-user-email" className="mb-2 block text-sm font-semibold text-slate-900">
                                Email
                            </label>
                            <input
                                id="managed-user-email"
                                type="email"
                                value={form.email}
                                onChange={(event) => onChange("email", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="managed-user-phone" className="mb-2 block text-sm font-semibold text-slate-900">
                                Telephone
                            </label>
                            <input
                                id="managed-user-phone"
                                type="text"
                                value={form.phone}
                                onChange={(event) => onChange("phone", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="managed-user-role" className="mb-2 block text-sm font-semibold text-slate-900">
                                Role
                            </label>
                            <select
                                id="managed-user-role"
                                value={form.role}
                                onChange={(event) => onChange("role", event.target.value)}
                                disabled={isSelfEdit}
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                                {ROLE_OPTIONS.map((roleOption) => (
                                    <option key={roleOption.value} value={roleOption.value}>
                                        {roleOption.label}
                                    </option>
                                ))}
                            </select>
                            {isSelfEdit && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Votre propre role admin ne peut pas etre retire ici.
                                </p>
                            )}
                        </div>

                        {mode === "create" && (
                            <div>
                                <label htmlFor="managed-user-password" className="mb-2 block text-sm font-semibold text-slate-900">
                                    Mot de passe
                                </label>
                                <input
                                    id="managed-user-password"
                                    type="password"
                                    value={form.motDePasse}
                                    onChange={(event) => onChange("motDePasse", event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Enregistrement..." : mode === "create" ? "Creer" : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SuspendUserModal({
    open,
    managedUser,
    duration,
    error,
    saving,
    onChange,
    onClose,
    onSubmit,
}) {
    if (!open || !managedUser) {
        return null;
    }

    const presetDurations = ["1", "3", "7", "30"];
    const isCustomDuration = !presetDurations.includes(duration);
    const suspensionEndDate = getSuspensionEndDate(duration);
    const currentSuspendedUntil = getSuspendedUntil(managedUser);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
                            Suspension utilisateur
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            Suspendre {getUserDisplayName(managedUser)}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Choisissez une duree de suspension pour ce compte.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                        Fermer
                    </button>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{getUserDisplayName(managedUser)}</p>
                        <p className="mt-1 text-sm text-slate-500">{managedUser?.email || "Email non renseigne"}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                            <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                Role: {getRoleLabel(managedUser)}
                            </span>
                            <span className={`rounded-full px-3 py-1 ${getUserStatusClass(managedUser)}`}>
                                {getUserStatusLabel(managedUser)}
                            </span>
                            {currentSuspendedUntil && (
                                <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                    Suspendu jusqu'au {formatDate(currentSuspendedUntil)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 block text-sm font-semibold text-slate-900">
                            Duree de suspension
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {presetDurations.map((presetDuration) => {
                                const isActive = duration === presetDuration;

                                return (
                                    <button
                                        key={presetDuration}
                                        type="button"
                                        onClick={() => onChange(presetDuration)}
                                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "border-amber-500 bg-amber-100 text-amber-800"
                                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        {presetDuration} jour{presetDuration === "1" ? "" : "s"}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => onChange(isCustomDuration ? duration : "")}
                                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                    isCustomDuration
                                        ? "border-amber-500 bg-amber-100 text-amber-800"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                Personnalisee
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="managed-user-suspend-duration" className="mb-2 block text-sm font-semibold text-slate-900">
                            Nombre de jours
                        </label>
                        <input
                            id="managed-user-suspend-duration"
                            type="number"
                            min="1"
                            value={duration}
                            onChange={(event) => onChange(event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                            placeholder="Entrez un nombre de jours"
                            required
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Selectionnez une duree rapide ou saisissez une valeur personnalisee.
                        </p>
                    </div>

                    {suspensionEndDate && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Fin estimee de suspension: {formatDate(suspensionEndDate)}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Suspension..." : `Suspendre ${duration || "..."} jour${duration === "1" ? "" : "s"}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminUsersSection({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedUser, setSelectedUser] = useState(null);
    const [form, setForm] = useState(buildUserFormState());
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [suspendDuration, setSuspendDuration] = useState("7");
    const [suspendError, setSuspendError] = useState("");

    async function loadUsers() {
        setLoading(true);
        setError("");

        try {
            const response = await getAdminUsers();
            setUsers(extractUsers(response));
        } catch (err) {
            setUsers([]);
            setError(err.message || "Impossible de charger les utilisateurs.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    const suspendedUsersCount = useMemo(
        () => users.filter((managedUser) => isUserSuspended(managedUser)).length,
        [users]
    );
    const adminsCount = useMemo(
        () => users.filter((managedUser) => hasRole(managedUser, "ROLE_ADMIN")).length,
        [users]
    );

    function openCreateModal() {
        setSelectedUser(null);
        setModalMode("create");
        setForm(buildUserFormState());
        setFormError("");
        setModalOpen(true);
    }

    function openEditModal(managedUser) {
        setSelectedUser(managedUser);
        setModalMode("edit");
        setForm(buildUserFormState(managedUser));
        setFormError("");
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setSelectedUser(null);
        setForm(buildUserFormState());
        setFormError("");
        setSaving(false);
    }

    function openSuspendModal(managedUser) {
        setSuspendTarget(managedUser);
        setSuspendDuration("7");
        setSuspendError("");
        setSuspendModalOpen(true);
    }

    function closeSuspendModal() {
        setSuspendModalOpen(false);
        setSuspendTarget(null);
        setSuspendDuration("7");
        setSuspendError("");
        setProcessingId(null);
    }

    function updateFormField(field, value) {
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim()) {
            setFormError("Prenom, nom et email sont obligatoires.");
            return;
        }

        if (modalMode === "create" && form.motDePasse.trim().length < 8) {
            setFormError("Le mot de passe doit contenir au moins 8 caracteres.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const payload = buildUserPayload(form, modalMode);

            if (modalMode === "create") {
                await createAdminUser(payload);
            } else {
                await updateAdminUser(selectedUser?.id, payload);
            }

            await loadUsers();
            closeModal();
        } catch (err) {
            setFormError(err.message || "Impossible d'enregistrer cet utilisateur.");
            setSaving(false);
        }
    }

    async function handleSuspendSubmit(event) {
        event.preventDefault();

        if (!suspendTarget?.id || suspendTarget?.id === currentUser?.id) {
            return;
        }

        const normalizedDuration = Number(suspendDuration);

        if (!Number.isInteger(normalizedDuration) || normalizedDuration <= 0) {
            setSuspendError("La duree de suspension doit etre un nombre de jours superieur a 0.");
            return;
        }

        setProcessingId(`suspend-${suspendTarget.id}`);
        setError("");
        setSuspendError("");

        try {
            await suspendAdminUser(suspendTarget.id, normalizedDuration);
            await loadUsers();
            closeSuspendModal();
        } catch (err) {
            setSuspendError(err.message || "Impossible de suspendre cet utilisateur.");
        } finally {
            setProcessingId(null);
        }
    }

    async function handleUnsuspend(managedUser) {
        if (!managedUser?.id || managedUser?.id === currentUser?.id) {
            return;
        }

        const confirmed = window.confirm(`Retirer la suspension de ${getUserDisplayName(managedUser)} ?`);

        if (!confirmed) {
            return;
        }

        setProcessingId(`unsuspend-${managedUser.id}`);
        setError("");

        try {
            await unsuspendAdminUser(managedUser.id);
            await loadUsers();
        } catch (err) {
            setError(err.message || "Impossible de retirer la suspension de cet utilisateur.");
        } finally {
            setProcessingId(null);
        }
    }

    async function handleDelete(managedUser) {
        if (!managedUser?.id || managedUser?.id === currentUser?.id) {
            return;
        }

        const confirmed = window.confirm(`Supprimer ${getUserDisplayName(managedUser)} ?`);

        if (!confirmed) {
            return;
        }

        setProcessingId(`delete-${managedUser.id}`);
        setError("");

        try {
            await deleteAdminUser(managedUser.id);
            await loadUsers();
        } catch (err) {
            setError(err.message || "Impossible de supprimer cet utilisateur.");
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <>
            <UserManagementModal
                open={modalOpen}
                mode={modalMode}
                form={form}
                error={formError}
                saving={saving}
                isSelfEdit={selectedUser?.id === currentUser?.id}
                onChange={updateFormField}
                onClose={closeModal}
                onSubmit={handleSubmit}
            />
            <SuspendUserModal
                open={suspendModalOpen}
                managedUser={suspendTarget}
                duration={suspendDuration}
                error={suspendError}
                saving={Boolean(suspendTarget && processingId === `suspend-${suspendTarget.id}`)}
                onChange={setSuspendDuration}
                onClose={closeSuspendModal}
                onSubmit={handleSuspendSubmit}
            />

            <section className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                >
                    Ajouter un utilisateur
                </button>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <StatCard label="Utilisateurs" value={users.length} />
                <StatCard label="Admins" value={adminsCount} tone="success" />
                <StatCard label="Suspendus" value={suspendedUsersCount} tone="warning" />
            </section>

            {loading && <EmptyState message="Chargement des utilisateurs..." />}
            {!loading && error && <ErrorState message={error} />}
            {!loading && !error && users.length === 0 && (
                <EmptyState message="Aucun utilisateur a afficher." />
            )}

            {!loading && !error && users.length > 0 && (
                <section className="space-y-4">
                    {users.map((managedUser) => {
                        const isSelf = managedUser?.id === currentUser?.id;
                        const isSuspended = isUserSuspended(managedUser);
                        const suspendedUntil = getSuspendedUntil(managedUser);
                        const suspendBusy = processingId === `suspend-${managedUser.id}`;
                        const unsuspendBusy = processingId === `unsuspend-${managedUser.id}`;
                        const deleteBusy = processingId === `delete-${managedUser.id}`;

                        return (
                            <article key={managedUser.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-lg font-semibold text-slate-900">
                                                    {getUserDisplayName(managedUser)}
                                                </p>
                                                {isSelf && (
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                        Vous
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {managedUser?.email || "Email non renseigne"}
                                            </p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    Role
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-800">
                                                    {getRoleLabel(managedUser)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    Statut
                                                </p>
                                                <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getUserStatusClass(managedUser)}`}>
                                                    {getUserStatusLabel(managedUser)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    Telephone
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-800">
                                                    {managedUser?.phone || managedUser?.telephone || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    ID
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-800">
                                                    {managedUser?.id ?? "-"}
                                                </p>
                                            </div>
                                            {isSuspended && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        Suspension jusqu'au
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                                        {typeof suspendedUntil === "string" && suspendedUntil.trim()
                                                            ? formatDate(suspendedUntil)
                                                            : "Date de fin non renseignee"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(managedUser)}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => (isSuspended ? handleUnsuspend(managedUser) : openSuspendModal(managedUser))}
                                            disabled={isSelf || suspendBusy || unsuspendBusy}
                                            className={`rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                                                isSuspended
                                                    ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                                                    : "border border-amber-300 bg-amber-50 text-amber-700"
                                            }`}
                                        >
                                            {suspendBusy || unsuspendBusy
                                                ? "Traitement..."
                                                : isSuspended
                                                    ? "Reactiver"
                                                    : "Suspendre"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(managedUser)}
                                            disabled={isSelf || deleteBusy}
                                            className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {deleteBusy ? "Traitement..." : "Supprimer"}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </>
    );
}
