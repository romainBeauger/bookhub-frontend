import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BooksSidebar from "../components/BooksSidebar.jsx";
import HeaderComponent from "../components/HeaderComponent.jsx";
import { getBooks } from "../services/bookService.js";
import { useAuth } from "../context/AuthContext.jsx";

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

export default function BooksPage() {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    });

    useEffect(() => {
        let ignore = false;

        async function loadBooks() {
            try {
                setLoading(true);
                setError("");

                const response = await getBooks({ page, limit: pagination.limit });

                if (!ignore) {
                    setBooks(extractBooks(response));
                    setPagination({
                        page: response?.pagination?.page || page,
                        limit: response?.pagination?.limit || pagination.limit,
                        total: response?.pagination?.total || 0,
                        pages: response?.pagination?.pages || 1,
                    });
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || "Impossible de recuperer les livres.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadBooks();

        return () => {
            ignore = true;
        };
    }, [page, pagination.limit]);

    const filteredBooks = books.filter((book) => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return true;
        }

        const haystack = [
            getTitle(book),
            getAuthor(book),
            book?.isbn,
            getCategoryName(book),
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return haystack.includes(query);
    });

    const categoryCounts = filteredBooks.reduce((acc, book) => {
        const category = getCategoryName(book);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    const availableCount = filteredBooks.filter(
        (book) => Number(book?.availableCopies ?? 0) > 0
    ).length;
    const unavailableCount = filteredBooks.length - availableCount;
    const pageNumbers = Array.from(
        { length: pagination.pages || 1 },
        (_, index) => index + 1
    );

    return (
        <main className="min-h-screen bg-[#f2f2f2]">
            <section className="w-full overflow-hidden border border-slate-300 bg-white">
                <HeaderComponent subtitle="Page d'accueil - Catalogue" user={user} />

                <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[220px_1fr]">
                    <BooksSidebar
                        availableCount={availableCount}
                        unavailableCount={unavailableCount}
                        categoryCounts={categoryCounts}
                    />

                    <section className="bg-[#efefef]">
                        <div className="border-b border-slate-300 px-6 py-6 md:px-8">
                            <h1 className="text-[2rem] font-semibold leading-tight text-slate-950">
                                Catalogue de livres
                            </h1>
                            <p className="text-[1.05rem] text-slate-500">
                                Consultez et empruntez parmi nos {pagination.total} ouvrages disponibles
                            </p>

                            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex w-full max-w-[560px] flex-col gap-3 sm:flex-row">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Recherche par titre, auteur, ISBN..."
                                        className="h-11 flex-1 rounded-xl border border-slate-700 bg-white px-4 text-sm outline-none"
                                    />
                                    <button
                                        type="button"
                                        className="h-11 rounded-xl border border-slate-800 bg-white px-6 text-sm font-medium text-slate-950"
                                    >
                                        Rechercher
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        className="rounded-xl border border-slate-800 bg-white px-5 py-2 text-sm font-medium text-slate-950"
                                    >
                                        Grille
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-xl border border-blue-400 bg-white px-5 py-2 text-sm font-medium text-blue-500"
                                    >
                                        Liste
                                    </button>
                                </div>
                            </div>

                            <p className="mt-5 text-lg font-semibold text-slate-950">
                                {search.trim()
                                    ? `${filteredBooks.length} livres affiches sur ${pagination.total}`
                                    : `${pagination.total} livres trouves`}
                            </p>
                        </div>

                        <div className="px-6 py-6 md:px-8">
                            {loading && (
                                <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-slate-300 bg-white">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <img
                                            src="/spinner.svg"
                                            alt="Chargement"
                                            className="h-6 w-6"
                                        />
                                        <span>Recuperation des livres en cours...</span>
                                    </div>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-red-700">
                                    <h2 className="text-xl font-semibold">Erreur de chargement</h2>
                                    <p className="mt-2">{error}</p>
                                </div>
                            )}

                            {!loading && !error && filteredBooks.length === 0 && (
                                <div className="rounded-[24px] border border-slate-300 bg-white p-8 text-slate-600">
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Aucun livre disponible
                                    </h2>
                                    <p className="mt-2">
                                        Aucun resultat ne correspond a la recherche actuelle.
                                    </p>
                                </div>
                            )}

                            {!loading && !error && filteredBooks.length > 0 && (
                                <>
                                    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                                        {filteredBooks.map((book, index) => {
                                            const status = getStatus(book);

                                            return (
                                                <article
                                                    key={book?.id || book?._id || `${getTitle(book)}-${index}`}
                                                    className="overflow-hidden rounded-[22px] border border-slate-500 bg-white"
                                                >
                                                    <div className="relative grid h-44 place-items-center border-b border-slate-400 bg-white px-4">
                                                        <span className="absolute left-4 top-3 text-sm text-slate-400">
                                                            {getCategoryName(book)}
                                                        </span>
                                                        <span
                                                            className={`absolute right-4 top-3 rounded-full px-3 py-1 text-[0.68rem] font-medium ${status.badgeClass}`}
                                                        >
                                                            {status.label}
                                                        </span>
                                                        <div className="text-lg text-slate-900">
                                                            {book?.image ? (
                                                                <img
                                                                    src={book.image}
                                                                    alt={getTitle(book)}
                                                                    className="h-28 w-full rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                "Couverture"
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 px-4 py-4">
                                                        <h2 className="text-[1.7rem] font-semibold leading-none text-slate-950">
                                                            {getTitle(book)}
                                                        </h2>
                                                        <p className="text-xl text-slate-950">
                                                            {getAuthor(book)}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            ISBN: {book?.isbn || "Non renseigne"}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {book?.availableCopies ?? 0}/{book?.totalCopies ?? 0} exemplaires disponibles
                                                        </p>
                                                        <Link
                                                            to={`/books/${book.id}`}
                                                            className="mt-3 block w-full rounded-xl border border-slate-800 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-100"
                                                        >
                                                            Voir détails
                                                        </Link>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 flex flex-col gap-4 rounded-[24px] border border-slate-300 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
                                        <p className="text-sm text-slate-500">
                                            Page {pagination.page} sur {pagination.pages} - {pagination.total} livres
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                                                disabled={pagination.page <= 1 || loading}
                                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Precedent
                                            </button>

                                            {pageNumbers.map((pageNumber) => (
                                                <button
                                                    key={pageNumber}
                                                    type="button"
                                                    onClick={() => setPage(pageNumber)}
                                                    disabled={loading}
                                                    className={`min-w-10 rounded-xl border px-3 py-2 text-sm font-medium ${
                                                        pageNumber === pagination.page
                                                            ? "border-sky-500 bg-sky-500 text-white"
                                                            : "border-slate-300 bg-white text-slate-700"
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPage((currentPage) =>
                                                        Math.min(pagination.pages, currentPage + 1)
                                                    )
                                                }
                                                disabled={pagination.page >= pagination.pages || loading}
                                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
}
