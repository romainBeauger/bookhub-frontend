import { Link } from "react-router-dom";
import BookCoverImage from "./BookCoverImage.jsx";
import RatingStars from "../Reviews/RatingStars.jsx";

function getBookId(book) {
    return book?.id || book?._id || "";
}

function getTitle(book) {
    return book?.title || book?.titre || book?.name || "Livre sans titre";
}

function getAuthor(book) {
    return book?.author || book?.auteur || book?.writer || "Auteur inconnu";
}

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

function getAverageRating(book) {
    const rating = Number(
        book?.averageRating ??
        book?.average_rating ??
        book?.ratingAverage ??
        book?.rating_average ??
        book?.averageNote ??
        book?.average_note
    );

    return Number.isFinite(rating) ? rating : 0;
}

export default function BookCard({ book, onBorrow, view = "grid" }) {
    const status = getStatus(book);
    const bookId = getBookId(book);
    const isAvailable = Number(book?.availableCopies ?? 0) > 0;
    const isListView = view === "list";
    const averageRating = getAverageRating(book);

    if (isListView) {
        return (
            <article className="overflow-hidden rounded-[24px] border border-slate-300 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-shadow duration-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
                <div className="flex flex-col md:grid md:grid-cols-3">
                    <div className="relative border-b border-slate-200 bg-slate-50 p-4 md:border-b-0 md:border-r">
                        <div className="grid h-[200px] place-items-center pt-0 md:h-full md:min-h-[250px] md:pt-10">
                            <BookCoverImage
                                image={book?.image}
                                alt={getTitle(book)}
                                className="h-full max-h-[220px] w-full max-w-[160px] rounded-[16px] border border-slate-200 object-cover shadow-sm"
                                fallback="Couverture"
                            />
                        </div>
                    </div>

                    <div className="min-w-0 space-y-4 p-4 sm:p-5 md:col-span-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white">
                                {getCategoryName(book)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold ${status.badgeClass}`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <h2 className="text-[1.55rem] font-semibold leading-tight text-slate-950">
                                {getTitle(book)}
                            </h2>
                            <p className="text-base text-slate-700">
                                {getAuthor(book)}
                            </p>
                            {averageRating > 0 ? (
                                <div className="pt-1">
                                    <RatingStars rating={averageRating} allowHalf showValue />
                                </div>
                            ) : (
                                <p className="pt-1 text-sm font-medium text-slate-500">
                                    Pas encore de note
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Disponibilite
                                </p>
                                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                                    {book?.availableCopies ?? 0}/{book?.totalCopies ?? 0} exemplaires
                                </p>
                            </div>



                        </div>

                        <div className="flex  gap-2.5 rounded-[20px] border border-slate-200 bg-slate-50 p-3.5">

                            <button
                                type="button"
                                onClick={() => onBorrow?.(book)}
                                disabled={!isAvailable}
                                className="rounded-xl border border-emerald-500 bg-white px-4 py-3 text-center text-sm font-semibold text-emerald-600 transition-colors duration-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white"
                            >
                                Emprunter
                            </button>

                            <Link
                                to={bookId ? `/books/${bookId}` : "/books"}
                                className="rounded-xl border border-slate-800 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-100"
                            >
                                Detail
                            </Link>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="overflow-hidden rounded-[22px] border border-slate-500 bg-white">
            <div className="relative grid h-70 place-items-center border-b border-slate-400 bg-white px-4">
                <span className="absolute left-4 top-3 text-sm text-slate-900">
                    {getCategoryName(book)}
                </span>
                <span
                    className={`absolute right-4 top-3 rounded-full px-3 py-1 text-[0.68rem] font-medium ${status.badgeClass}`}
                >
                    {status.label}
                </span>
                <div className="text-lg text-slate-900">
                    <BookCoverImage
                        image={book?.image}
                        alt={getTitle(book)}
                        className="h-50 w-full rounded-lg object-cover"
                        fallback="Couverture"
                    />
                </div>
            </div>

            <div className="space-y-2 px-4 py-4">
                <h2 className="text-[1.7rem] font-semibold leading-none text-slate-950">
                    {getTitle(book)}
                </h2>
                <p className="text-xl text-slate-950">
                    {getAuthor(book)}
                </p>
                {averageRating > 0 ? (
                    <RatingStars rating={averageRating} allowHalf showValue />
                ) : (
                    <p className="text-sm font-medium text-slate-500">
                        Pas encore de note
                    </p>
                )}

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => onBorrow?.(book)}
                        disabled={!isAvailable}
                        className="rounded-xl border border-emerald-500 bg-white px-4 py-3 text-center text-sm font-semibold text-emerald-600 transition-colors duration-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white"
                    >
                        Emprunter
                    </button>

                    <Link
                        to={bookId ? `/books/${bookId}` : "/books"}
                        className="rounded-xl border border-slate-800 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-100"
                    >
                        Detail
                    </Link>
                </div>
            </div>
        </article>
    );
}
