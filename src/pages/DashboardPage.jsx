import { useEffect, useMemo, useState } from "react";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import ReviewCard from "../components/Reviews/ReviewCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteReview, getAllReviews, moderateReview } from "../services/bookService.js";

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

function sortReviewsByNewest(reviews) {
    return [...reviews].sort((left, right) => {
        const leftDate = new Date(String(left?.createdAt || "").replace(" ", "T")).getTime();
        const rightDate = new Date(String(right?.createdAt || "").replace(" ", "T")).getTime();

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

function ReviewStatCard({ label, value, tone = "default" }) {
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

export default function DashboardPage() {
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        let ignore = false;

        async function loadReviews() {
            try {
                setLoading(true);
                setError("");

                const response = await getAllReviews();

                if (!ignore) {
                    setReviews(sortReviewsByNewest(extractReviews(response)));
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || "Impossible de recuperer les reviews staff.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadReviews();

        return () => {
            ignore = true;
        };
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
            setError(err.message || "Impossible de moderer cette review.");
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
            setError(err.message || "Impossible de supprimer cette review.");
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#f2f2f2]">
            <HeaderComponent
                subtitle="Dashboard staff - Reviews"
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
                        <h1 className="text-2xl font-bold text-slate-800">Dashboard reviews</h1>
                        <p className="text-sm text-slate-500">
                            Suivez les reviews en attente, confirmees et l&apos;ensemble des avis.
                        </p>
                    </div>

                    <section className="grid gap-4 md:grid-cols-3">
                        <ReviewStatCard label="Total reviews" value={reviews.length} />
                        <ReviewStatCard label="En attente de verification" value={pendingCount} tone="warning" />
                        <ReviewStatCard label="Reviews confirmees" value={confirmedCount} tone="success" />
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

                    {loading && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Chargement des reviews...
                        </section>
                    )}

                    {!loading && error && (
                        <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
                            {error}
                        </section>
                    )}

                    {!loading && !error && filteredReviews.length === 0 && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Aucune review a afficher pour ce filtre.
                        </section>
                    )}

                    {!loading && !error && filteredReviews.length > 0 && (
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
                </main>
            </div>
        </div>
    );
}
