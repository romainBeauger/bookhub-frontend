import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import {
    cancelReservation,
    getAllReservations,
    markReservationReady,
    validateReservation,
} from "../services/reservationService.js";
import {
    extractReservations,
    formatReservationDate,
    getReservationStatusClass,
    getReservationStatusLabel,
    sortReservationsByNewest,
} from "../utils/reservations.js";

const STATUS_OPTIONS = [
    { value: "", label: "Tous les statuts" },
    { value: "PENDING", label: "En attente" },
    { value: "READY", label: "Pret a recuperer" },
    { value: "VALIDATED", label: "Validee" },
    { value: "CANCELLED", label: "Annulee" },
];

function getUserDisplayName(reservation) {
    return [reservation?.user?.firstName, reservation?.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "Utilisateur inconnu";
}

function getBookTitle(reservation) {
    return reservation?.book?.title || "Livre inconnu";
}

function getAvailableCopies(reservation) {
    return Number(reservation?.book?.availableCopies ?? 0);
}

export default function AdminReservationsPage() {
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [processingReservationId, setProcessingReservationId] = useState(null);
    const [filters, setFilters] = useState({
        status: "",
        bookId: "",
        userName: "",
    });

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        async function loadInitialReservations() {
            setLoading(true);
            setError("");

            try {
                const response = await getAllReservations();
                setReservations(sortReservationsByNewest(extractReservations(response)));
            } catch (err) {
                setError(err.message || "Impossible de charger les reservations.");
                setReservations([]);
            } finally {
                setLoading(false);
            }
        }

        loadInitialReservations();
    }, []);

    async function loadReservations(nextFilters = filters) {
        setLoading(true);
        setError("");

        try {
            const response = await getAllReservations({
                status: nextFilters.status || undefined,
                bookId: nextFilters.bookId ? Number(nextFilters.bookId) : undefined,
                userName: nextFilters.userName?.trim() || undefined,
            });
            setReservations(sortReservationsByNewest(extractReservations(response)));
        } catch (err) {
            setError(err.message || "Impossible de charger les reservations.");
            setReservations([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleFilterSubmit(event) {
        event.preventDefault();
        await loadReservations(filters);
    }

    async function handleAction(reservation, action) {
        const reservationId = reservation?.id;

        if (!reservationId || processingReservationId) {
            return;
        }

        setProcessingReservationId(reservationId);

        try {
            if (action === "ready") {
                await markReservationReady(reservationId);
                setToast({ type: "success", message: "Reservation marquee comme prete." });
            }

            if (action === "validate") {
                await validateReservation(reservationId);
                setToast({ type: "success", message: "Reservation validee avec succes." });
            }

            if (action === "cancel") {
                await cancelReservation(reservationId);
                setToast({ type: "success", message: "Reservation annulee avec succes." });
            }

            await loadReservations(filters);
        } catch (err) {
            setToast({
                type: "error",
                message: err.message || "Impossible de mettre a jour cette reservation.",
            });
        } finally {
            setProcessingReservationId(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#f2f2f2]">
            {toast && (
                <div className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
                    toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}>
                    {toast.message}
                </div>
            )}

            <HeaderComponent
                subtitle="Gestion des reservations"
                user={user}
                onMenuToggle={() => setNavOpen((currentValue) => !currentValue)}
            />

            <div className="grid lg:grid-cols-[280px_1fr]">
                <BooksSidebar
                    showFilters={false}
                    mobileOpen={navOpen}
                    onClose={() => setNavOpen(false)}
                />

                <main className="space-y-6 p-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Gestion des reservations</h1>
                        <p className="text-sm text-slate-500">
                            Filtrez les files d'attente et pilotez les changements de statut cote librarian.
                        </p>
                    </div>

                    <form
                        onSubmit={handleFilterSubmit}
                        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                        <div>
                            <label htmlFor="reservation-status" className="mb-2 block text-sm font-semibold text-slate-900">
                                Statut
                            </label>
                            <select
                                id="reservation-status"
                                value={filters.status}
                                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value || "all"} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="reservation-user-name" className="mb-2 block text-sm font-semibold text-slate-900">
                                Utilisateur
                            </label>
                            <input
                                id="reservation-user-name"
                                type="text"
                                value={filters.userName}
                                onChange={(event) => setFilters((current) => ({ ...current, userName: event.target.value }))}
                                placeholder="Prenom ou nom"
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="reservation-book-id" className="mb-2 block text-sm font-semibold text-slate-900">
                                Book ID
                            </label>
                            <input
                                id="reservation-book-id"
                                type="number"
                                min="1"
                                value={filters.bookId}
                                onChange={(event) => setFilters((current) => ({ ...current, bookId: event.target.value }))}
                                placeholder="Ex: 12"
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                            />
                        </div>

                        <div className="flex items-end gap-3">
                            <button
                                type="submit"
                                className="h-11 rounded-xl border border-slate-900 bg-slate-900 px-5 text-sm font-medium text-white"
                            >
                                Filtrer
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const resetFilters = { status: "", bookId: "", userName: "" };
                                    setFilters(resetFilters);
                                    await loadReservations(resetFilters);
                                }}
                                className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700"
                            >
                                Reinitialiser
                            </button>
                        </div>
                    </form>

                    {loading && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Chargement des reservations...
                        </section>
                    )}

                    {!loading && error && (
                        <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
                            {error}
                        </section>
                    )}

                    {!loading && !error && reservations.length === 0 && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Aucune reservation ne correspond a ces filtres.
                        </section>
                    )}

                    {!loading && !error && reservations.length > 0 && (
                        <section className="space-y-4">
                            {reservations.map((reservation) => {
                                const isPending = reservation?.status === "PENDING";
                                const isReady = reservation?.status === "READY";
                                const isBusy = processingReservationId === reservation.id;

                                return (
                                    <article
                                        key={reservation.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-5"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-lg font-semibold text-slate-900">
                                                        {getBookTitle(reservation)}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {getUserDisplayName(reservation)} - {reservation?.user?.email || "Email inconnu"}
                                                    </p>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Statut
                                                        </p>
                                                        <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                                            getReservationStatusClass(reservation?.status)
                                                        }`}>
                                                            {getReservationStatusLabel(reservation?.status)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Position
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                                            {reservation?.queuePosition ?? "-"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Date
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                                            {formatReservationDate(reservation?.reservationDate)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Disponibilite
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                                            {getAvailableCopies(reservation)} exemplaire(s)
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Book ID
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                                            {reservation?.bookId ?? "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                {isPending && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(reservation, "ready")}
                                                        disabled={isBusy}
                                                        className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isBusy ? "Traitement..." : "Marquer prete"}
                                                    </button>
                                                )}
                                                {isReady && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(reservation, "validate")}
                                                        disabled={isBusy}
                                                        className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isBusy ? "Traitement..." : "Valider"}
                                                    </button>
                                                )}
                                                {(isPending || isReady) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(reservation, "cancel")}
                                                        disabled={isBusy}
                                                        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isBusy ? "Traitement..." : "Annuler"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}
