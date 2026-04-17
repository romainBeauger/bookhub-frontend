import { Link } from "react-router-dom";
import BookCoverImage from "./BookCoverImage.jsx";

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

export default function BookCard({ book, onBorrow, view = "grid" }) {
    const status = getStatus(book);
    const bookId = getBookId(book);
    const isAvailable = Number(book?.availableCopies ?? 0) > 0;
    const isListView = view === "list";

    return (
        <article
            className={`overflow-hidden rounded-[22px] border border-slate-500 bg-white ${
                isListView ? "lg:grid lg:grid-cols-[220px_1fr]" : ""
            }`}
        >
            <div
                className={`relative place-items-center bg-white px-4 ${
                    isListView
                        ? "grid h-full min-h-[220px] border-b border-slate-400 py-6 lg:border-b-0 lg:border-r"
                        : "grid h-70 border-b border-slate-400"
                }`}
            >
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
                        className={`rounded-lg object-cover ${
                            isListView ? "h-52 w-full max-w-[160px]" : "h-50 w-full"
                        }`}
                        fallback="Couverture"
                    />
                </div>
            </div>

            <div className={`px-4 py-4 ${isListView ? "flex flex-col justify-between gap-6 lg:px-6 lg:py-6" : "space-y-2"}`}>
                <h2 className="text-[1.7rem] font-semibold leading-none text-slate-950">
                    {getTitle(book)}
                </h2>
                <p className="text-xl text-slate-950">
                    {getAuthor(book)}
                </p>
                <p className="text-sm text-slate-500">
                    {book?.availableCopies ?? 0}/{book?.totalCopies ?? 0} exemplaires disponibles
                </p>

                <div className={`grid gap-3 ${isListView ? "sm:grid-cols-2 lg:max-w-[320px]" : "mt-3 sm:grid-cols-2"}`}>
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
