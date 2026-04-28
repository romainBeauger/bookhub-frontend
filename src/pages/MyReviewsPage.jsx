import { useEffect, useState } from "react";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import ReviewCard from "../components/Reviews/ReviewCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyReviews } from "../services/bookService.js";

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

export default function MyReviewsPage() {
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadReviews() {
            try {
                setLoading(true);
                setError("");

                const response = await getMyReviews();

                if (!ignore) {
                    setReviews(sortReviewsByNewest(extractReviews(response)));
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || "Impossible de recuperer vos avis.");
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

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
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
                        <h1 className="text-2xl font-bold text-slate-800">Mes avis</h1>
                        <p className="text-sm text-slate-500">
                            Retrouvez vos notes et commentaires laisses sur les livres.
                        </p>
                    </div>

                    {loading && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Chargement de vos avis...
                        </section>
                    )}

                    {!loading && error && (
                        <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
                            {error}
                        </section>
                    )}

                    {!loading && !error && reviews.length === 0 && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Vous n&apos;avez laisse aucun avis pour le moment.
                        </section>
                    )}

                    {!loading && !error && reviews.length > 0 && (
                        <section className="space-y-4">
                            {reviews.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    currentUserId={user?.id}
                                    showBookTitle
                                />
                            ))}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

