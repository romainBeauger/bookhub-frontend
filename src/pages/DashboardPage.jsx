import { useEffect, useMemo, useState } from "react";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import ReviewCard from "../components/Reviews/ReviewCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteReview, getAllReviews, moderateReview } from "../services/bookService.js";
import { getAllLoans, validateReturn } from "../services/loanService.js";

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

function TabButton({ active, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700"
            }`}
        >
            {label}
        </button>
    );
}

function PlaceholderPanel({ title, description }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
        </section>
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

export default function DashboardPage() {
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loans, setLoans] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [loansLoading, setLoansLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState("");
    const [loansError, setLoansError] = useState("");
    const [activeTab, setActiveTab] = useState("reviews");
    const [activeFilter, setActiveFilter] = useState("all");
    const [processingId, setProcessingId] = useState(null);

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

    useEffect(() => {
        loadReviews();
        loadLoans();
    }, []);

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
            await loadLoans();
        } catch (err) {
            setLoansError(err.message || "Impossible de valider ce retour.");
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#f2f2f2]">
            <HeaderComponent
                subtitle="Dashboard staff - Moderations"
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
                        <h1 className="text-2xl font-bold text-slate-800">Moderations</h1>
                        <p className="text-sm text-slate-500">
                            Suivez les avis, les retours d'emprunt utilisateurs et les reservations.
                        </p>
                    </div>

                    <section className="flex flex-wrap gap-3">
                        <TabButton active={activeTab === "reviews"} label="Avis" onClick={() => setActiveTab("reviews")} />
                        <TabButton
                            active={activeTab === "loan-returns"}
                            label="Retours d'emprunt utilisateur"
                            onClick={() => setActiveTab("loan-returns")}
                        />
                        <TabButton
                            active={activeTab === "reservations"}
                            label="Reservations"
                            onClick={() => setActiveTab("reservations")}
                        />
                    </section>

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

                            {reviewsLoading && (
                                <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                                    Chargement des avis...
                                </section>
                            )}

                            {!reviewsLoading && reviewsError && (
                                <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
                                    {reviewsError}
                                </section>
                            )}

                            {!reviewsLoading && !reviewsError && filteredReviews.length === 0 && (
                                <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                                    Aucun avis a afficher pour ce filtre.
                                </section>
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

                    {activeTab === "loan-returns" && (
                        <>
                            <section className="grid gap-4 md:grid-cols-2">
                                <StatCard label="Retours a valider" value={returnRequests.length} tone="warning" />
                                <StatCard label="Emprunts en cours" value={activeLoans.length} />
                            </section>

                            {loansLoading && (
                                <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                                    Chargement des emprunts...
                                </section>
                            )}

                            {!loansLoading && loansError && (
                                <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
                                    {loansError}
                                </section>
                            )}

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
                                            <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                                                Aucune demande de retour en attente.
                                            </section>
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
                                            <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                                                Aucun emprunt actif a afficher.
                                            </section>
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
                        <PlaceholderPanel
                            title="Reservations de tous les utilisateurs"
                            description="L'onglet est pret, mais aucun service de reservations n'est encore branche dans le front. Il faut un endpoint backend pour lister et gerer ces reservations."
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
