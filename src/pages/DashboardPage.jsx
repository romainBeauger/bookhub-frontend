import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminUsersSection from "../components/AdminUsers/AdminUsersSection.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import ReviewCard from "../components/Reviews/ReviewCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
    createBook,
    deleteBook,
    deleteReview,
    getAllReviews,
    getBooks,
    getCategories,
    moderateReview,
    updateBook,
} from "../services/bookService.js";
import { getAllLoans, validateReturn } from "../services/loanService.js";
import {
    cancelReservation,
    getAllReservations,
    markReservationReady,
    validateReservation,
} from "../services/reservationService.js";
import { getCatalogueStats, getLoanStats } from "../services/statsService.js";
import { hasLibrarianAccess, hasRole } from "../utils/auth.js";
import {
    extractReservations,
    formatReservationDate,
    getReservationStatusClass,
    getReservationStatusLabel,
    sortReservationsByNewest,
} from "../utils/reservations.js";

function getDashboardTabs(isAdmin) {
    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "books", label: "Gestion livres" },
        { id: "loan-returns", label: "Retours d'emprunt" },
        { id: "reservations", label: "Reservations" },
        { id: "reviews", label: "Avis" },
    ];

    if (isAdmin) {
        tabs.push({ id: "users", label: "Gestion utilisateurs" });
    }

    return tabs;
}

const RESERVATION_STATUS_OPTIONS = [
    { value: "", label: "Tous les statuts" },
    { value: "PENDING", label: "En attente" },
    { value: "READY", label: "Pret a recuperer" },
    { value: "VALIDATED", label: "Validee" },
    { value: "CANCELLED", label: "Annulee" },
];

function readActiveTab(searchParams, tabs) {
    const requestedTab = searchParams.get("tab");
    const exists = tabs.some((tab) => tab.id === requestedTab);

    return exists ? requestedTab : "dashboard";
}

function extractReviews(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.reviews)) {
        return payload.reviews;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

function extractLoans(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.loans)) {
        return payload.loans;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

function sortReviewsByNewest(reviews) {
    return [...reviews].sort((left, right) => {
        const leftDate = new Date(String(left?.createdAt || "").replace(" ", "T")).getTime();
        const rightDate = new Date(String(right?.createdAt || "").replace(" ", "T")).getTime();

        return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
    });
}

function sortLoansByNewest(loans) {
    return [...loans].sort((left, right) => {
        const leftDate = new Date(String(left?.loanDate || "").replace(" ", "T")).getTime();
        const rightDate = new Date(String(right?.loanDate || "").replace(" ", "T")).getTime();

        return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
    });
}

function getFilteredReviews(reviews, filter) {
    if (filter === "pending") {
        return reviews.filter((review) => review?.isModerated === false);
    }

    if (filter === "confirmed") {
        return reviews.filter((review) => review?.isModerated === true);
    }

    return reviews;
}

function getLoanStatusLabel(status, isLate) {
    if (status === "RETURN_REQUESTED") {
        return "Retour a valider";
    }

    if (status === "RETURNED") {
        return "Rendu";
    }

    if (status === "OVERDUE" || isLate) {
        return "En retard";
    }

    return "En cours";
}

function getLoanStatusClass(status, isLate) {
    if (status === "RETURN_REQUESTED") {
        return "bg-amber-100 text-amber-700";
    }

    if (status === "RETURNED") {
        return "bg-emerald-100 text-emerald-700";
    }

    if (status === "OVERDUE" || isLate) {
        return "bg-red-100 text-red-600";
    }

    return "bg-sky-100 text-sky-700";
}

function getLoanUserDisplayName(loan) {
    return [loan?.user?.firstName, loan?.user?.lastName].filter(Boolean).join(" ").trim();
}

function getReservationUserDisplayName(reservation) {
    return [reservation?.user?.firstName, reservation?.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "Utilisateur inconnu";
}

function getReservationBookTitle(reservation) {
    return reservation?.book?.title || "Livre inconnu";
}

function getReservationAvailableCopies(reservation) {
    return Number(reservation?.book?.availableCopies ?? 0);
}

function formatDate(value) {
    if (!value) {
        return "Non renseignee";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Non renseignee";
    }

    return date.toLocaleDateString("fr-FR");
}

function StatCard({ label, value, tone = "default" }) {
    const toneStyle = tone === "warning"
        ? { background: "var(--warning-bg)", color: "var(--warning-fg)", border: "1px solid #fed7aa" }
        : tone === "success"
            ? { background: "var(--success-bg)", color: "var(--success-fg)", border: "1px solid #bbf7d0" }
            : tone === "danger"
                ? { background: "var(--danger-bg)", color: "var(--danger-fg)", border: "1px solid #fecaca" }
                : { background: "var(--bg-surface)", color: "var(--text-main)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" };

    return (
        <article className="rounded-2xl p-5" style={toneStyle}>
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-3 text-3xl font-semibold" style={tone === "default" ? { color: "var(--tangerine)" } : {}}>{value}</p>
        </article>
    );
}

function TabButton({ active, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition-all"
            style={active
                ? { background: "var(--navy)", borderColor: "var(--navy)", color: "white" }
                : { background: "var(--bg-surface)", borderColor: "var(--border-soft)", color: "var(--text-main)" }
            }
        >
            {label}
        </button>
    );
}

function QuickActionButton({ label, onClick, tone = "default" }) {
    const toneClassName = tone === "dark"
        ? "border-slate-900 bg-slate-900 text-white"
        : tone === "success"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : tone === "warning"
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-slate-300 bg-white text-slate-700";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${toneClassName}`}
        >
            {label}
        </button>
    );
}

function LoanRow({ loan, loading, onValidate }) {
    const statusLabel = getLoanStatusLabel(loan?.status, loan?.isLate);
    const statusClassName = getLoanStatusClass(loan?.status, loan?.isLate);
    const canValidate = loan?.status === "RETURN_REQUESTED";

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div>
                        <p className="text-lg font-semibold text-slate-900">{loan?.bookTitle || "Livre inconnu"}</p>
                        <p className="mt-1 text-sm text-slate-500">{getLoanUserDisplayName(loan)}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Date d'emprunt</p>
                            <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(loan?.loanDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Date limite</p>
                            <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(loan?.dueDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Retour valide</p>
                            <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(loan?.returnedAt)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Statut</p>
                            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>
                                {statusLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {canValidate && (
                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() => onValidate(loan)}
                            disabled={loading}
                            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Validation..." : "Valider le retour"}
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

function OverdueLoansTable({ rows }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                        <th className="px-4 py-3 font-semibold">Lecteur</th>
                        <th className="px-4 py-3 font-semibold">Livre</th>
                        <th className="px-4 py-3 font-semibold">Date d'emprunt</th>
                        <th className="px-4 py-3 font-semibold">Date limite</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((loan) => (
                        <tr key={loan.id} className="text-slate-700">
                            <td className="px-4 py-3">
                                <p className="font-medium text-slate-900">{loan.userName}</p>
                                <p className="text-xs text-slate-500">User ID: {loan.userId}</p>
                            </td>
                            <td className="px-4 py-3">
                                <p className="font-medium text-slate-900">{loan.bookTitle}</p>
                                <p className="text-xs text-slate-500">Book ID: {loan.bookId}</p>
                            </td>
                            <td className="px-4 py-3">{formatDate(loan.loanDate)}</td>
                            <td className="px-4 py-3 font-medium text-red-600">{formatDate(loan.dueDate)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TopBorrowedBooksTable({ rows }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                        <th className="px-4 py-3 font-semibold">Livre</th>
                        <th className="px-4 py-3 font-semibold">Auteur</th>
                        <th className="px-4 py-3 font-semibold">Emprunts</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((book) => (
                        <tr key={book.id} className="text-slate-700">
                            <td className="px-4 py-3 font-medium text-slate-900">{book.title}</td>
                            <td className="px-4 py-3">{book.author}</td>
                            <td className="px-4 py-3">{book.loanCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
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

function extractBooks(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.books)) {
        return payload.books;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

function extractCategories(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.categories)) {
        return payload.categories;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

function buildBookFormState(book = null) {
    return {
        title: book?.title || "",
        author: book?.author || "",
        description: book?.description || "",
        isbn: book?.isbn || "",
        publishedAt: book?.publishedAt || "",
        totalCopies: String(book?.totalCopies ?? 1),
        availableCopies: String(book?.availableCopies ?? 1),
        image: book?.image || "",
        categoryId: String(book?.category?.id ?? book?.categoryId ?? ""),
    };
}

function BookManagementModal({
    open,
    mode,
    form,
    categories,
    error,
    saving,
    onChange,
    onClose,
    onSubmit,
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Gestion livres
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            {mode === "create" ? "Ajouter un livre" : "Modifier un livre"}
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
                            <label htmlFor="book-title" className="mb-2 block text-sm font-semibold text-slate-900">
                                Titre
                            </label>
                            <input
                                id="book-title"
                                type="text"
                                value={form.title}
                                onChange={(event) => onChange("title", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="book-author" className="mb-2 block text-sm font-semibold text-slate-900">
                                Auteur
                            </label>
                            <input
                                id="book-author"
                                type="text"
                                value={form.author}
                                onChange={(event) => onChange("author", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="book-isbn" className="mb-2 block text-sm font-semibold text-slate-900">
                                ISBN
                            </label>
                            <input
                                id="book-isbn"
                                type="text"
                                value={form.isbn}
                                onChange={(event) => onChange("isbn", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="book-published-at" className="mb-2 block text-sm font-semibold text-slate-900">
                                Date de publication
                            </label>
                            <input
                                id="book-published-at"
                                type="text"
                                value={form.publishedAt}
                                onChange={(event) => onChange("publishedAt", event.target.value)}
                                placeholder="YYYY-MM-DD"
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="book-total-copies" className="mb-2 block text-sm font-semibold text-slate-900">
                                Nombre total
                            </label>
                            <input
                                id="book-total-copies"
                                type="number"
                                min="1"
                                value={form.totalCopies}
                                onChange={(event) => onChange("totalCopies", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="book-available-copies" className="mb-2 block text-sm font-semibold text-slate-900">
                                Nombre disponible
                            </label>
                            <input
                                id="book-available-copies"
                                type="number"
                                min="0"
                                value={form.availableCopies}
                                onChange={(event) => onChange("availableCopies", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="book-image" className="mb-2 block text-sm font-semibold text-slate-900">
                                Image
                            </label>
                            <input
                                id="book-image"
                                type="text"
                                value={form.image}
                                onChange={(event) => onChange("image", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="book-category" className="mb-2 block text-sm font-semibold text-slate-900">
                                Categorie
                            </label>
                            <select
                                id="book-category"
                                value={form.categoryId}
                                onChange={(event) => onChange("categoryId", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
                            >
                                <option value="">Sans categorie</option>
                                {categories.map((category) => (
                                    <option key={String(category?.id ?? category?._id)} value={String(category?.id ?? category?._id)}>
                                        {category?.name || category?.label || category?.title || "Categorie"}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="book-description" className="mb-2 block text-sm font-semibold text-slate-900">
                                Description
                            </label>
                            <textarea
                                id="book-description"
                                value={form.description}
                                onChange={(event) => onChange("description", event.target.value)}
                                rows="5"
                                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none"
                            />
                        </div>
                    </div>

                    {error && <ErrorState message={error} />}

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Enregistrement..." : mode === "create" ? "Ajouter le livre" : "Enregistrer les modifications"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [reviews, setReviews] = useState([]);
    const [loans, setLoans] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loanStats, setLoanStats] = useState(null);
    const [catalogueStats, setCatalogueStats] = useState(null);
    const [managedBooks, setManagedBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [loansLoading, setLoansLoading] = useState(true);
    const [reservationsLoading, setReservationsLoading] = useState(true);
    const [loanStatsLoading, setLoanStatsLoading] = useState(false);
    const [catalogueStatsLoading, setCatalogueStatsLoading] = useState(false);
    const [booksLoading, setBooksLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");
    const [loansError, setLoansError] = useState("");
    const [reservationsError, setReservationsError] = useState("");
    const [loanStatsError, setLoanStatsError] = useState("");
    const [catalogueStatsError, setCatalogueStatsError] = useState("");
    const [booksError, setBooksError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [processingId, setProcessingId] = useState(null);
    const [bookModalOpen, setBookModalOpen] = useState(false);
    const [bookModalMode, setBookModalMode] = useState("create");
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookForm, setBookForm] = useState(buildBookFormState());
    const [bookFormError, setBookFormError] = useState("");
    const [bookSaving, setBookSaving] = useState(false);
    const [reservationFilters, setReservationFilters] = useState({
        status: "",
        bookId: "",
        userName: "",
    });

    const isAdmin = hasRole(user, "ROLE_ADMIN");
    const isLibrarian = hasLibrarianAccess(user);
    const canSeeCatalogueStats = isLibrarian;
    const dashboardTitle = isAdmin ? "Gestion admin" : "Gestion librairie";
    const dashboardTabs = useMemo(() => getDashboardTabs(isAdmin), [isAdmin]);
    const activeTab = readActiveTab(searchParams, dashboardTabs);

    function setActiveTab(nextTab) {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set("tab", nextTab);
        setSearchParams(nextSearchParams, { replace: true });
    }

    async function loadReviews() {
        setReviewsLoading(true);
        setReviewsError("");

        try {
            const response = await getAllReviews();
            setReviews(sortReviewsByNewest(extractReviews(response)));
        } catch (err) {
            setReviewsError(err.message || "Impossible de recuperer les avis staff.");
        } finally {
            setReviewsLoading(false);
        }
    }

    async function loadLoans() {
        setLoansLoading(true);
        setLoansError("");

        try {
            const response = await getAllLoans();
            setLoans(sortLoansByNewest(extractLoans(response)));
        } catch (err) {
            setLoansError(err.message || "Impossible de recuperer les emprunts.");
        } finally {
            setLoansLoading(false);
        }
    }

    async function loadReservations(nextFilters = reservationFilters) {
        setReservationsLoading(true);
        setReservationsError("");

        try {
            const response = await getAllReservations({
                status: nextFilters.status || undefined,
                bookId: nextFilters.bookId ? Number(nextFilters.bookId) : undefined,
                userName: nextFilters.userName?.trim() || undefined,
            });
            setReservations(sortReservationsByNewest(extractReservations(response)));
        } catch (err) {
            setReservationsError(err.message || "Impossible de recuperer les reservations.");
            setReservations([]);
        } finally {
            setReservationsLoading(false);
        }
    }

    async function loadLoanStats() {
        if (!isLibrarian) {
            setLoanStats(null);
            setLoanStatsError("");
            setLoanStatsLoading(false);
            return;
        }

        setLoanStatsLoading(true);
        setLoanStatsError("");

        try {
            const response = await getLoanStats();
            setLoanStats(response || null);
        } catch (err) {
            setLoanStats(null);
            setLoanStatsError(err.message || "Impossible de recuperer les statistiques d'emprunts.");
        } finally {
            setLoanStatsLoading(false);
        }
    }

    async function loadCatalogueStats() {
        if (!canSeeCatalogueStats) {
            setCatalogueStats(null);
            setCatalogueStatsError("");
            setCatalogueStatsLoading(false);
            return;
        }

        setCatalogueStatsLoading(true);
        setCatalogueStatsError("");

        try {
            const response = await getCatalogueStats();
            setCatalogueStats(response || null);
        } catch (err) {
            setCatalogueStats(null);
            setCatalogueStatsError(err.message || "Impossible de recuperer les statistiques du catalogue.");
        } finally {
            setCatalogueStatsLoading(false);
        }
    }

    async function loadManagedBooks() {
        setBooksLoading(true);
        setBooksError("");

        try {
            const categoriesPromise = getCategories();
            const firstBooksResponse = await getBooks({ page: 1, limit: 100, sort: "asc" });
            const firstPageBooks = extractBooks(firstBooksResponse);
            const totalPages = Math.max(1, Number(firstBooksResponse?.pages ?? firstBooksResponse?.pagination?.pages ?? 1));
            let allBooks = [...firstPageBooks];

            if (totalPages > 1) {
                const remainingResponses = await Promise.all(
                    Array.from({ length: totalPages - 1 }, (_, index) =>
                        getBooks({ page: index + 2, limit: 100, sort: "asc" })
                    )
                );

                allBooks = [
                    ...allBooks,
                    ...remainingResponses.flatMap((response) => extractBooks(response)),
                ];
            }

            const categoriesResponse = await categoriesPromise;

            setManagedBooks(allBooks);
            setCategories(extractCategories(categoriesResponse));
        } catch (err) {
            setManagedBooks([]);
            setBooksError(err.message || "Impossible de charger la gestion des livres.");
        } finally {
            setBooksLoading(false);
        }
    }

    useEffect(() => {
        const requestedTab = searchParams.get("tab");
        const hasValidTab = dashboardTabs.some((tab) => tab.id === requestedTab);

        if (!requestedTab || !hasValidTab) {
            const nextSearchParams = new URLSearchParams(searchParams);
            nextSearchParams.set("tab", "dashboard");
            setSearchParams(nextSearchParams, { replace: true });
        }
    }, [dashboardTabs, searchParams, setSearchParams]);

    useEffect(() => {
        loadReviews();
        loadLoans();
        loadReservations();
        loadLoanStats();
        loadCatalogueStats();
        loadManagedBooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLibrarian, canSeeCatalogueStats]);

    const pendingCount = useMemo(
        () => reviews.filter((review) => review?.isModerated === false).length,
        [reviews]
    );
    const confirmedCount = useMemo(
        () => reviews.filter((review) => review?.isModerated === true).length,
        [reviews]
    );
    const filteredReviews = useMemo(
        () => getFilteredReviews(reviews, activeFilter),
        [reviews, activeFilter]
    );
    const returnRequests = useMemo(
        () => loans.filter((loan) => loan?.status === "RETURN_REQUESTED"),
        [loans]
    );
    const activeLoans = useMemo(
        () => loans.filter((loan) => ["ACTIVE", "OVERDUE", "RETURN_REQUESTED"].includes(loan?.status)),
        [loans]
    );
    const pendingReservations = useMemo(
        () => reservations.filter((reservation) => reservation?.status === "PENDING"),
        [reservations]
    );
    const readyReservations = useMemo(
        () => reservations.filter((reservation) => reservation?.status === "READY"),
        [reservations]
    );
    const overdueList = useMemo(() => loanStats?.overdueList || [], [loanStats]);
    const topBorrowedBooks = useMemo(() => catalogueStats?.topBorrowedBooks || [], [catalogueStats]);

    async function handleModerate(reviewId) {
        setProcessingId(reviewId);

        try {
            const updatedReview = await moderateReview(reviewId, true);
            setReviews((currentReviews) =>
                sortReviewsByNewest(
                    currentReviews.map((review) =>
                        review.id === reviewId ? { ...review, ...updatedReview, isModerated: true } : review
                    )
                )
            );
        } catch (err) {
            setReviewsError(err.message || "Impossible de moderer cet avis.");
        } finally {
            setProcessingId(null);
        }
    }

    async function handleDelete(reviewId) {
        setProcessingId(reviewId);

        try {
            await deleteReview(reviewId);
            setReviews((currentReviews) => currentReviews.filter((review) => review.id !== reviewId));
        } catch (err) {
            setReviewsError(err.message || "Impossible de supprimer cet avis.");
        } finally {
            setProcessingId(null);
        }
    }

    async function handleValidateReturn(loan) {
        const loanId = loan?.id;

        if (!loanId) {
            return;
        }

        setProcessingId(`loan-${loanId}`);
        setLoansError("");

        try {
            await validateReturn(loanId);
            await Promise.all([loadLoans(), loadLoanStats()]);
        } catch (err) {
            setLoansError(err.message || "Impossible de valider ce retour.");
        } finally {
            setProcessingId(null);
        }
    }

    async function handleReservationFilterSubmit(event) {
        event.preventDefault();
        await loadReservations(reservationFilters);
    }

    async function handleReservationAction(reservation, action) {
        const reservationId = reservation?.id;

        if (!reservationId) {
            return;
        }

        setProcessingId(`reservation-${reservationId}`);
        setReservationsError("");

        try {
            if (action === "ready") {
                await markReservationReady(reservationId);
            }

            if (action === "validate") {
                await validateReservation(reservationId);
            }

            if (action === "cancel") {
                await cancelReservation(reservationId);
            }

            await Promise.all([loadReservations(reservationFilters), loadCatalogueStats()]);
        } catch (err) {
            setReservationsError(err.message || "Impossible de mettre a jour cette reservation.");
        } finally {
            setProcessingId(null);
        }
    }

    function openCreateBookModal() {
        setBookModalMode("create");
        setSelectedBook(null);
        setBookForm(buildBookFormState());
        setBookFormError("");
        setBookModalOpen(true);
    }

    function openEditBookModal(book) {
        setBookModalMode("edit");
        setSelectedBook(book);
        setBookForm(buildBookFormState(book));
        setBookFormError("");
        setBookModalOpen(true);
    }

    function closeBookModal() {
        setBookModalOpen(false);
        setSelectedBook(null);
        setBookForm(buildBookFormState());
        setBookFormError("");
        setBookSaving(false);
    }

    function updateBookFormField(field, value) {
        setBookForm((current) => ({ ...current, [field]: value }));
    }

    function buildBookPayload(form) {
        return {
            title: form.title.trim(),
            author: form.author.trim(),
            description: form.description.trim(),
            isbn: form.isbn.trim(),
            publishedAt: form.publishedAt.trim(),
            totalCopies: Number(form.totalCopies),
            availableCopies: Number(form.availableCopies),
            image: form.image.trim(),
            ...(form.categoryId ? { categoryId: Number(form.categoryId) } : {}),
        };
    }

    async function handleBookSubmit(event) {
        event.preventDefault();

        const payload = buildBookPayload(bookForm);

        if (!payload.title || !payload.author) {
            setBookFormError("Le titre et l'auteur sont obligatoires.");
            return;
        }

        if (!Number.isFinite(payload.totalCopies) || payload.totalCopies < 1) {
            setBookFormError("Le nombre total doit etre superieur ou egal a 1.");
            return;
        }

        if (!Number.isFinite(payload.availableCopies) || payload.availableCopies < 0) {
            setBookFormError("Le nombre disponible doit etre superieur ou egal a 0.");
            return;
        }

        setBookSaving(true);
        setBookFormError("");
        setBooksError("");

        try {
            if (bookModalMode === "create") {
                await createBook(payload);
            } else if (selectedBook?.id || selectedBook?._id) {
                await updateBook(selectedBook.id || selectedBook._id, payload);
            }

            closeBookModal();
            await Promise.all([loadManagedBooks(), loadCatalogueStats()]);
        } catch (err) {
            setBookFormError(err.message || "Impossible d'enregistrer ce livre.");
            setBookSaving(false);
        }
    }

    async function handleDeleteBook(book) {
        const bookId = book?.id || book?._id;

        if (!bookId) {
            return;
        }

        setProcessingId(`book-${bookId}`);
        setBooksError("");

        try {
            await deleteBook(bookId);
            await Promise.all([loadManagedBooks(), loadCatalogueStats()]);
        } catch (err) {
            setBooksError(err.message || "Impossible de supprimer ce livre.");
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
            <BookManagementModal
                open={bookModalOpen}
                mode={bookModalMode}
                form={bookForm}
                categories={categories}
                error={bookFormError}
                saving={bookSaving}
                onChange={updateBookFormField}
                onClose={closeBookModal}
                onSubmit={handleBookSubmit}
            />

            <BooksSidebar
                showFilters={false}
                mobileOpen={navOpen}
                onClose={() => setNavOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <HeaderComponent
                    user={user}
                    onMenuToggle={() => setNavOpen((currentValue) => !currentValue)}
                />

                <main className="space-y-6 p-6">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>{dashboardTitle}</h1>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            Dashboard staff, suivi du catalogue, des emprunts, des réservations et des avis.
                        </p>
                    </div>

                    <section className="flex flex-wrap gap-3">
                        {dashboardTabs.map((tab) => (
                            <TabButton
                                key={tab.id}
                                active={activeTab === tab.id}
                                label={tab.label}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        ))}
                    </section>

                    {activeTab === "dashboard" && (
                        <>
                            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <StatCard
                                    label="Emprunts actifs"
                                    value={loanStatsLoading ? "..." : loanStats?.activeLoans ?? "-"}
                                />
                                <StatCard
                                    label="Emprunts en retard"
                                    value={loanStatsLoading ? "..." : loanStats?.lateLoans ?? "-"}
                                    tone="danger"
                                />
                                <StatCard
                                    label="Total livres"
                                    value={catalogueStatsLoading ? "..." : catalogueStats?.totalBooks ?? "-"}
                                />
                                <StatCard
                                    label="Total reservations"
                                    value={catalogueStatsLoading ? "..." : catalogueStats?.totalReservations ?? "-"}
                                />
                                <StatCard
                                    label="Reservations en cours"
                                    value={catalogueStatsLoading ? "..." : catalogueStats?.currentReservations ?? "-"}
                                    tone="warning"
                                />
                                <StatCard
                                    label="Reservations passees"
                                    value={catalogueStatsLoading ? "..." : catalogueStats?.pastReservations ?? "-"}
                                    tone="success"
                                />
                            </section>

                            {loanStatsError && <ErrorState message={loanStatsError} />}
                            {catalogueStatsError && <ErrorState message={catalogueStatsError} />}

                            <section className="grid gap-6 xl:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-slate-800">Emprunts en retard</h2>
                                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                            {loanStatsLoading ? "..." : overdueList.length}
                                        </span>
                                    </div>

                                    {!isLibrarian && (
                                        <EmptyState message="Cette section est reservee aux bibliothecaires." />
                                    )}

                                    {isLibrarian && loanStatsLoading && (
                                        <EmptyState message="Chargement des emprunts en retard..." />
                                    )}

                                    {isLibrarian && !loanStatsLoading && !loanStatsError && overdueList.length === 0 && (
                                        <EmptyState message="Aucun emprunt en retard pour le moment." />
                                    )}

                                    {isLibrarian && !loanStatsLoading && !loanStatsError && overdueList.length > 0 && (
                                        <OverdueLoansTable rows={overdueList} />
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-slate-800">Livres les plus empruntes</h2>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            {catalogueStatsLoading ? "..." : topBorrowedBooks.length}
                                        </span>
                                    </div>

                                    {catalogueStatsLoading && (
                                        <EmptyState message="Chargement des livres les plus empruntes..." />
                                    )}

                                    {!catalogueStatsLoading && !catalogueStatsError && topBorrowedBooks.length === 0 && (
                                        <EmptyState message="Aucune statistique de top emprunts disponible." />
                                    )}

                                    {!catalogueStatsLoading && !catalogueStatsError && topBorrowedBooks.length > 0 && (
                                        <TopBorrowedBooksTable rows={topBorrowedBooks} />
                                    )}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === "books" && (
                        <>
                            <section className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={openCreateBookModal}
                                    className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
                                >
                                    Ajouter un livre
                                </button>
                                <Link
                                    to="/books"
                                    className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                                >
                                    Aller au catalogue
                                </Link>
                                <QuickActionButton label="Retour dashboard" onClick={() => setActiveTab("dashboard")} />
                            </section>

                            {booksError && <ErrorState message={booksError} />}

                            {booksLoading && (
                                <EmptyState message="Chargement des livres a gerer..." />
                            )}

                            {!booksLoading && managedBooks.length === 0 && (
                                <EmptyState message="Aucun livre a gerer pour le moment." />
                            )}

                            {!booksLoading && managedBooks.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-slate-800">Liste des livres</h2>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            {managedBooks.length}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        {managedBooks.map((book) => {
                                            const bookId = book?.id || book?._id;
                                            const isDeleting = processingId === `book-${bookId}`;

                                            return (
                                                <article key={bookId} className="rounded-2xl border border-slate-200 bg-white p-5">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="space-y-2">
                                                            <p className="text-lg font-semibold text-slate-900">{book?.title || "Livre sans titre"}</p>
                                                            <p className="text-sm text-slate-600">{book?.author || "Auteur inconnu"}</p>
                                                            <div className="grid gap-2 sm:grid-cols-2">
                                                                <p className="text-sm text-slate-500">ISBN: {book?.isbn || "Non renseigne"}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    Disponibles: {book?.availableCopies ?? 0}/{book?.totalCopies ?? 0}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditBookModal(book)}
                                                                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700"
                                                            >
                                                                Modifier
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBook(book)}
                                                                disabled={isDeleting}
                                                                className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {isDeleting ? "Suppression..." : "Supprimer"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {activeTab === "loan-returns" && (
                        <>
                            <section className="grid gap-4 md:grid-cols-3">
                                <StatCard label="Retours a valider" value={returnRequests.length} tone="warning" />
                                <StatCard label="Emprunts en cours" value={activeLoans.length} />
                                <StatCard
                                    label="En retard"
                                    value={loanStatsLoading ? "..." : loanStats?.lateLoans ?? overdueList.length}
                                    tone="danger"
                                />
                            </section>

                            {loansLoading && <EmptyState message="Chargement des emprunts..." />}
                            {!loansLoading && loansError && <ErrorState message={loansError} />}

                            {!loansLoading && !loansError && (
                                <>
                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-slate-800">Retours a valider</h2>
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                                {returnRequests.length}
                                            </span>
                                        </div>

                                        {returnRequests.length === 0 && (
                                            <EmptyState message="Aucune demande de retour en attente." />
                                        )}

                                        {returnRequests.length > 0 && returnRequests.map((loan) => (
                                            <LoanRow
                                                key={loan.id}
                                                loan={loan}
                                                loading={processingId === `loan-${loan.id}`}
                                                onValidate={handleValidateReturn}
                                            />
                                        ))}
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-slate-800">Tous les emprunts en cours</h2>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                {activeLoans.length}
                                            </span>
                                        </div>

                                        {activeLoans.length === 0 && (
                                            <EmptyState message="Aucun emprunt actif a afficher." />
                                        )}

                                        {activeLoans.length > 0 && activeLoans.map((loan) => (
                                            <LoanRow
                                                key={`active-${loan.id}`}
                                                loan={loan}
                                                loading={processingId === `loan-${loan.id}`}
                                                onValidate={handleValidateReturn}
                                            />
                                        ))}
                                    </section>
                                </>
                            )}
                        </>
                    )}

                    {activeTab === "reservations" && (
                        <>
                            <section className="grid gap-4 md:grid-cols-3">
                                <StatCard label="Reservations listees" value={reservations.length} />
                                <StatCard label="En attente" value={pendingReservations.length} tone="warning" />
                                <StatCard label="Pret a recuperer" value={readyReservations.length} tone="success" />
                            </section>

                            <form
                                onSubmit={handleReservationFilterSubmit}
                                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_1fr_1fr_auto]"
                            >
                                <div>
                                    <label htmlFor="reservation-status" className="mb-2 block text-sm font-semibold text-slate-900">
                                        Statut
                                    </label>
                                    <select
                                        id="reservation-status"
                                        value={reservationFilters.status}
                                        onChange={(event) =>
                                            setReservationFilters((current) => ({ ...current, status: event.target.value }))
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                                    >
                                        {RESERVATION_STATUS_OPTIONS.map((option) => (
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
                                        value={reservationFilters.userName}
                                        onChange={(event) =>
                                            setReservationFilters((current) => ({ ...current, userName: event.target.value }))
                                        }
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
                                        value={reservationFilters.bookId}
                                        onChange={(event) =>
                                            setReservationFilters((current) => ({ ...current, bookId: event.target.value }))
                                        }
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
                                            setReservationFilters(resetFilters);
                                            await loadReservations(resetFilters);
                                        }}
                                        className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700"
                                    >
                                        Reinitialiser
                                    </button>
                                </div>
                            </form>

                            {reservationsLoading && <EmptyState message="Chargement des reservations..." />}
                            {!reservationsLoading && reservationsError && <ErrorState message={reservationsError} />}
                            {!reservationsLoading && !reservationsError && reservations.length === 0 && (
                                <EmptyState message="Aucune reservation ne correspond a ces filtres." />
                            )}

                            {!reservationsLoading && !reservationsError && reservations.length > 0 && (
                                <section className="space-y-4">
                                    {reservations.map((reservation) => {
                                        const isPending = reservation?.status === "PENDING";
                                        const isReady = reservation?.status === "READY";
                                        const isBusy = processingId === `reservation-${reservation.id}`;

                                        return (
                                            <article
                                                key={reservation.id}
                                                className="rounded-2xl border border-slate-200 bg-white p-5"
                                            >
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-lg font-semibold text-slate-900">
                                                                {getReservationBookTitle(reservation)}
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {getReservationUserDisplayName(reservation)} - {reservation?.user?.email || "Email inconnu"}
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
                                                                    {getReservationAvailableCopies(reservation)} exemplaire(s)
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
                                                                onClick={() => handleReservationAction(reservation, "ready")}
                                                                disabled={isBusy}
                                                                className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {isBusy ? "Traitement..." : "Marquer prete"}
                                                            </button>
                                                        )}
                                                        {isReady && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReservationAction(reservation, "validate")}
                                                                disabled={isBusy}
                                                                className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {isBusy ? "Traitement..." : "Valider"}
                                                            </button>
                                                        )}
                                                        {(isPending || isReady) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReservationAction(reservation, "cancel")}
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
                        </>
                    )}

                    {activeTab === "reviews" && (
                        <>
                            <section className="grid gap-4 md:grid-cols-3">
                                <StatCard label="Total avis" value={reviews.length} />
                                <StatCard label="En attente de verification" value={pendingCount} tone="warning" />
                                <StatCard label="Avis confirmes" value={confirmedCount} tone="success" />
                            </section>

                            <section className="flex flex-wrap gap-3">
                                {[
                                    { id: "all", label: "Toutes" },
                                    { id: "pending", label: "En attente" },
                                    { id: "confirmed", label: "Confirmees" },
                                ].map((filterOption) => (
                                    <button
                                        key={filterOption.id}
                                        type="button"
                                        onClick={() => setActiveFilter(filterOption.id)}
                                        className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                                            activeFilter === filterOption.id
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-300 bg-white text-slate-700"
                                        }`}
                                    >
                                        {filterOption.label}
                                    </button>
                                ))}
                            </section>

                            {reviewsLoading && <EmptyState message="Chargement des avis..." />}
                            {!reviewsLoading && reviewsError && <ErrorState message={reviewsError} />}
                            {!reviewsLoading && !reviewsError && filteredReviews.length === 0 && (
                                <EmptyState message="Aucun avis a afficher pour ce filtre." />
                            )}

                            {!reviewsLoading && !reviewsError && filteredReviews.length > 0 && (
                                <section className="space-y-4">
                                    {filteredReviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            currentUserId={user?.id}
                                            showBookTitle
                                            showReviewerName
                                            actions={
                                                <>
                                                    {!review?.isModerated && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleModerate(review.id)}
                                                            disabled={processingId === review.id}
                                                            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            Confirmer
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(review.id)}
                                                        disabled={processingId === review.id}
                                                        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </>
                                            }
                                        />
                                    ))}
                                </section>
                            )}
                        </>
                    )}

                    {activeTab === "users" && isAdmin && (
                        <AdminUsersSection currentUser={user} />
                    )}
                </main>
            </div>
        </div>
    );
}

