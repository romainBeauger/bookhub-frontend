import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BookCoverImage from "../components/BooksPage/BookCoverImage.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import RatingStars from "../components/Reviews/RatingStars.jsx";
import ReviewCard from "../components/Reviews/ReviewCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { createBookReview, getBookById, getBookReviews } from "../services/bookService.js";
import { borrowBook } from "../services/loanService.js";
import { createReservation, getMyReservations } from "../services/reservationService.js";
import {
    countActiveReservations,
    extractReservations,
    getReservationLimitMessage,
    RESERVATION_LIMIT,
} from "../utils/reservations.js";

function getCategoryName(book) {
    if (typeof book?.category === "string") {
        return book.category;
    }

    return book?.category?.name || book?.categorie?.name || "General";
}

function getStatus(book) {
    const availableCopies = Number(book?.availableCopies ?? 0);

    if (availableCopies <= 0) {
        return {
            label: "Indisponible",
            badgeClass: "bg-red-100 text-red-500",
        };
    }

    return {
        label: "Disponible",
        badgeClass: "bg-emerald-100 text-emerald-500",
    };
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

function sortReviewsByNewest(reviews) {
    return [...reviews].sort((left, right) => {
        const leftDate = new Date(String(left?.createdAt || "").replace(" ", "T")).getTime();
        const rightDate = new Date(String(right?.createdAt || "").replace(" ", "T")).getTime();

        return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
    });
}

function getAverageRating(reviews) {
    if (reviews.length === 0) {
        return 0;
    }

    const total = reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0);
    return total / reviews.length;
}

function buildReviewPayload(rating, comment) {
    return {
        rating,
        comment: comment.trim(),
    };
}

export default function BookDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [book, setBook] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState("");
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [ratingInput, setRatingInput] = useState(0);
    const [commentInput, setCommentInput] = useState("");
    const [reviewSubmitError, setReviewSubmitError] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [borrowSubmitting, setBorrowSubmitting] = useState(false);
    const [reserveSubmitting, setReserveSubmitting] = useState(false);
    const [reservationCount, setReservationCount] = useState(0);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        let ignore = false;

        async function loadBook() {
            try {
                setLoading(true);
                setError("");

                const response = await getBookById(id);

                if (!ignore) {
                    setBook(response);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || "Impossible de recuperer le livre.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadBook();

        return () => {
            ignore = true;
        };
    }, [id]);

    useEffect(() => {
        let ignore = false;

        async function loadMyReservations() {
            if (!user) {
                if (!ignore) {
                    setReservationCount(0);
                }
                return;
            }

            try {
                const response = await getMyReservations();

                if (!ignore) {
                    setReservationCount(countActiveReservations(extractReservations(response)));
                }
            } catch {
                if (!ignore) {
                    setReservationCount(0);
                }
            }
        }

        loadMyReservations();

        return () => {
            ignore = true;
        };
    }, [user]);

    useEffect(() => {
        let ignore = false;

        async function loadReviews() {
            try {
                setReviewsLoading(true);
                setReviewsError("");

                const response = await getBookReviews(id);

                if (!ignore) {
                    setReviews(sortReviewsByNewest(extractReviews(response)));
                }
            } catch (err) {
                if (!ignore) {
                    setReviewsError(err.message || "Impossible de recuperer les avis du livre.");
                    setReviews([]);
                }
            } finally {
                if (!ignore) {
                    setReviewsLoading(false);
                }
            }
        }

        loadReviews();

        return () => {
            ignore = true;
        };
    }, [id]);

    const status = getStatus(book);
    const averageRating = getAverageRating(reviews);
    const currentUserReview = reviews.find((review) => review?.user?.id === user?.id) || null;
    const canBorrow = Number(book?.availableCopies ?? 0) > 0;

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = setTimeout(() => setToast(null), 3000);

        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        if (!reviewFormOpen) {
            return;
        }

        setRatingInput(currentUserReview?.rating || 0);
        setCommentInput(currentUserReview?.comment || "");
        setReviewSubmitError("");
    }, [currentUserReview, reviewFormOpen]);

    async function refreshReviews() {
        setReviewsLoading(true);
        setReviewsError("");

        try {
            const response = await getBookReviews(id);
            setReviews(sortReviewsByNewest(extractReviews(response)));
        } catch (err) {
            setReviewsError(err.message || "Impossible de recuperer les avis du livre.");
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    }

    async function handleReviewSubmit(event) {
        event.preventDefault();

        if (ratingInput < 1 || ratingInput > 5) {
            setReviewSubmitError("Choisissez une note entre 1 et 5 etoiles.");
            return;
        }

        setReviewSubmitting(true);
        setReviewSubmitError("");

        try {
            await createBookReview(id, buildReviewPayload(ratingInput, commentInput));
            await refreshReviews();
            setReviewFormOpen(false);
        } catch (err) {
            setReviewSubmitError(err.message || "Impossible d'enregistrer votre avis.");
        } finally {
            setReviewSubmitting(false);
        }
    }

    async function handleBorrow() {
        if (!book?.id || borrowSubmitting || !canBorrow) {
            return;
        }

        setBorrowSubmitting(true);

        try {
            await borrowBook(book.id);
            setBook((currentBook) => {
                if (!currentBook) {
                    return currentBook;
                }

                return {
                    ...currentBook,
                    availableCopies: Math.max(0, Number(currentBook.availableCopies ?? 0) - 1),
                };
            });
            setToast({ type: "success", message: "Livre emprunte avec succes." });
        } catch (err) {
            setToast({ type: "error", message: err.message || "Impossible d'emprunter ce livre." });
        } finally {
            setBorrowSubmitting(false);
        }
    }

    async function handleReserve() {
        if (!book?.id || reserveSubmitting) {
            return;
        }

        if (reservationCount >= RESERVATION_LIMIT) {
            setToast({ type: "error", message: getReservationLimitMessage() });
            return;
        }

        setReserveSubmitting(true);

        try {
            await createReservation(book.id);
            setReservationCount((currentValue) => currentValue + 1);
            setToast({ type: "success", message: "Reservation creee avec succes." });
        } catch (err) {
            setToast({ type: "error", message: err.message || "Impossible de creer la reservation." });
        } finally {
            setReserveSubmitting(false);
        }
    }

    const reservationLimitReached = reservationCount >= RESERVATION_LIMIT;

    return (
        <main className="min-h-screen bg-[#f2f2f2]">
            {toast && (
                <div className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
                    toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}>
                    {toast.message}
                </div>
            )}
            <section className="w-full overflow-hidden border border-slate-300 bg-white">
                <HeaderComponent
                    subtitle="Page Detail d'un livre"
                    user={user}
                    onMenuToggle={() => setNavOpen((currentValue) => !currentValue)}
                />

                <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[220px_1fr]">
                    <BooksSidebar
                        availableCount={0}
                        unavailableCount={0}
                        categoryCounts={{}}
                        showFilters={false}
                        mobileOpen={navOpen}
                        onClose={() => setNavOpen(false)}
                    />

                    <section className="bg-[#efefef] p-5 md:p-6">
                        {loading && (
                            <div className="flex min-h-70 items-center justify-center border border-slate-300 bg-[#f8f8f8]">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <img src="/spinner.svg" alt="Chargement" className="h-6 w-6" />
                                    <span>Chargement du livre...</span>
                                </div>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="border border-red-200 bg-red-50 p-8 text-red-700">
                                <h2 className="text-xl font-semibold">Erreur</h2>
                                <p className="mt-2">{error}</p>
                            </div>
                        )}

                        {!loading && !error && book && (
                            <div className="overflow-hidden border-2 border-violet-500 bg-white">
                                <div className="flex flex-col gap-8 border-b border-slate-400 p-5 lg:flex-row lg:items-start lg:p-6">
                                    <div className="shrink-0 overflow-hidden rounded-[26px] border-2 border-slate-500 bg-[#404040] lg:w-55">
                                        <div className="grid h-70 place-items-center rounded-[22px] text-center text-lg font-semibold text-white sm:h-80">
                                            <BookCoverImage
                                                image={book?.image}
                                                alt={book.title}
                                                className="h-full w-full rounded-[22px] object-cover"
                                                fallback="COUVERTURE"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex min-h-45 min-w-0 flex-1 flex-col justify-between space-y-5 sm:min-h-55">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <h2 className="text-3xl font-medium text-slate-950 lg:text-[2.1rem]">
                                                    {book.title}
                                                </h2>
                                                <p className="mt-1 text-sm uppercase tracking-[0.16em] text-slate-500">
                                                    Auteur
                                                </p>
                                                <p className="mt-2 text-xl text-slate-700">{book.author}</p>
                                                <div className="mt-3">
                                                    <RatingStars rating={averageRating} allowHalf showValue />
                                                </div>
                                            </div>

                                            <div className="space-y-3 md:text-right">
                                                <div className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
                                                    {getCategoryName(book)}
                                                </div>
                                                <div
                                                    className={`block rounded-full px-4 py-2 text-sm font-medium ${status.badgeClass}`}
                                                >
                                                    {status.label}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    ISBN
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-950">
                                                    {book?.isbn || "Non renseigne"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    Annee
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-950">
                                                    {book?.publishedAt || "Non renseignee"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid  sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    Disponibilite
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-950">
                                                    {book?.availableCopies ?? 0}/{book?.totalCopies ?? 0}
                                                </p>
                                            </div>
                                        </div>
                                        {Number(book?.availableCopies ?? 0) <= 0 && (
                                            <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                                Aucun exemplaire disponible: vous pouvez reserver ce livre.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8 p-5 pt-8 lg:p-6 lg:pt-10">
                                    <div>
                                        <h3 className="text-lg font-semibold uppercase text-slate-950">
                                            Description
                                        </h3>
                                        <p className="mt-4 max-w-none text-[1.02rem] leading-8 text-slate-600">
                                            {book?.description || "Aucune description disponible pour ce livre."}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <h3 className="text-lg font-semibold uppercase text-slate-950">
                                                Tous les avis
                                            </h3>
                                            <span className="text-sm font-medium text-slate-500">
                                                {reviews.length} note{reviews.length > 1 ? "s" : ""}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-4">
                                            {reviewsLoading && (
                                                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                                                    Chargement des avis...
                                                </div>
                                            )}

                                            {!reviewsLoading && reviewsError && (
                                                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                                                    {reviewsError}
                                                </div>
                                            )}

                                            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                    <p className="text-sm font-medium text-slate-600">
                                                        Aucun avis pour le moment
                                                    </p>
                                                    <div className="mt-3">
                                                        <RatingStars rating={0} showValue />
                                                    </div>
                                                </div>
                                            )}

                                            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                                                <div className="space-y-4">
                                                    {reviews.map((review) => (
                                                        <ReviewCard
                                                            key={review.id}
                                                            review={review}
                                                            currentUserId={user?.id}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <Link
                                            to="/books"
                                            className="rounded-xl border border-slate-700 bg-white px-5 py-2 text-sm font-medium text-slate-900"
                                        >
                                            Retour
                                        </Link>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setReviewFormOpen((currentValue) => !currentValue)}
                                                className="rounded-xl border border-slate-700 bg-white px-5 py-2 text-sm font-medium text-slate-900"
                                            >
                                                {currentUserReview ? "Mon avis" : "Noter"}
                                            </button>
                                            {canBorrow ? (
                                                <button
                                                    type="button"
                                                    onClick={handleBorrow}
                                                    disabled={borrowSubmitting}
                                                    className="rounded-xl border border-emerald-500 bg-white px-5 py-2 text-sm font-medium text-emerald-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                                                >
                                                    {borrowSubmitting ? "Emprunt..." : "Emprunter"}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleReserve}
                                                    disabled={reserveSubmitting || reservationLimitReached}
                                                    className="rounded-xl border border-amber-400 bg-white px-5 py-2 text-sm font-medium text-amber-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                                                >
                                                    {reserveSubmitting ? "Reservation..." : reservationLimitReached ? "Limite atteinte" : "Reserver"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {reservationLimitReached && (
                                        <p className="text-sm font-medium text-amber-700">
                                            {getReservationLimitMessage()}
                                        </p>
                                    )}

                                    {reviewFormOpen && (
                                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900">
                                                        {currentUserReview ? "Votre avis actuel" : "Laisser un avis"}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        Notez ce livre et partagez votre retour de lecture.
                                                    </p>
                                                </div>
                                                {currentUserReview && (
                                                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                                        Mon avis
                                                    </span>
                                                )}
                                            </div>

                                            <form className="mt-5 space-y-5" onSubmit={handleReviewSubmit}>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">Votre note</p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {Array.from({ length: 5 }, (_, index) => {
                                                            const value = index + 1;
                                                            const isActive = value <= ratingInput;

                                                            return (
                                                                <button
                                                                    key={value}
                                                                    type="button"
                                                                    onClick={() => setRatingInput(value)}
                                                                    className={`rounded-xl border px-3 py-2 transition-colors ${
                                                                        isActive
                                                                            ? "border-amber-300 bg-amber-50 text-amber-500"
                                                                            : "border-slate-200 bg-white text-slate-300"
                                                                    }`}
                                                                    aria-label={`Noter ${value} sur 5`}
                                                                >
                                                                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                                                                        <path d="M12 2.75l2.85 5.77 6.37.93-4.61 4.49 1.09 6.34L12 17.29l-5.7 2.99 1.09-6.34-4.61-4.49 6.37-.93L12 2.75z" />
                                                                    </svg>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="mt-3">
                                                        <RatingStars rating={ratingInput} showValue />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label htmlFor="review-comment" className="text-sm font-medium text-slate-700">
                                                        Votre commentaire
                                                    </label>
                                                    <textarea
                                                        id="review-comment"
                                                        value={commentInput}
                                                        onChange={(event) => setCommentInput(event.target.value)}
                                                        rows={5}
                                                        className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                                                        placeholder="Partagez ce que vous avez pense du livre..."
                                                    />
                                                </div>

                                                {reviewSubmitError && (
                                                    <p className="text-sm text-red-600">{reviewSubmitError}</p>
                                                )}

                                                <div className="flex flex-col gap-3 sm:flex-row">
                                                    <button
                                                        type="submit"
                                                        disabled={reviewSubmitting}
                                                        className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {reviewSubmitting ? "Enregistrement..." : "Envoyer mon avis"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setReviewFormOpen(false)}
                                                        disabled={reviewSubmitting}
                                                        className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </form>
                                        </section>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}
