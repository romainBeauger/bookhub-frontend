import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BookCoverImage from "../components/BookCoverImage.jsx";
import BooksSidebar from "../components/BooksSidebar.jsx";
import HeaderComponent from "../components/HeaderComponent.jsx";
import { getBooks, getCategories } from "../services/bookService.js";
import { useAuth } from "../context/AuthContext.jsx";

const DEFAULT_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 350;

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

function parsePositiveInteger(value, fallbackValue) {
    const parsedValue = Number.parseInt(value, 10);

    return Number.isNaN(parsedValue) || parsedValue <= 0 ? fallbackValue : parsedValue;
}

function readStateFromSearchParams(searchParams) {
    const sort = searchParams.get("sort");

    return {
        q: searchParams.get("q") || "",
        author: searchParams.get("author") || "",
        categoryId: searchParams.get("categoryId") || "",
        available: searchParams.get("available") || "",
        sort: sort === "asc" || sort === "desc" || sort === "random" ? sort : "random",
        page: parsePositiveInteger(searchParams.get("page"), 1),
        limit: DEFAULT_LIMIT,
    };
}

function buildSearchParamsFromState(state) {
    const nextSearchParams = new URLSearchParams();

    const fields = [
        "q",
        "author",
        "categoryId",
        "available",
        "sort",
    ];

    fields.forEach((field) => {
        const value = String(state[field] ?? "").trim();

        if (value) {
            nextSearchParams.set(field, value);
        }
    });

    nextSearchParams.set("page", String(state.page));
    nextSearchParams.set("limit", String(state.limit));

    return nextSearchParams;
}

function areSearchParamsEqual(currentSearchParams, nextSearchParams) {
    return currentSearchParams.toString() === nextSearchParams.toString();
}

function hasActiveFilters({ q, author, categoryId, available, sort }) {
    return [q, author, categoryId, available].some((value) =>
        String(value ?? "").trim()
    ) || sort !== "random";
}

export default function BooksPage() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialState = readStateFromSearchParams(searchParams);

    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchInput, setSearchInput] = useState(initialState.q);
    const [debouncedSearch, setDebouncedSearch] = useState(initialState.q);
    const [filters, setFilters] = useState({
        author: initialState.author,
        categoryId: initialState.categoryId,
        available: initialState.available,
        sort: initialState.sort,
    });
    const [page, setPage] = useState(initialState.page);
    const [pagination, setPagination] = useState({
        page: initialState.page,
        limit: initialState.limit,
        total: 0,
        pages: 1,
    });

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchInput]);

    useEffect(() => {
        const nextState = readStateFromSearchParams(searchParams);

        setSearchInput((currentValue) => (currentValue === nextState.q ? currentValue : nextState.q));
        setDebouncedSearch((currentValue) => (currentValue === nextState.q ? currentValue : nextState.q));
        setFilters((currentFilters) => {
            const nextFilters = {
                author: nextState.author,
                categoryId: nextState.categoryId,
                available: nextState.available,
                sort: nextState.sort,
            };

            return JSON.stringify(currentFilters) === JSON.stringify(nextFilters)
                ? currentFilters
                : nextFilters;
        });
        setPage((currentPage) => (currentPage === nextState.page ? currentPage : nextState.page));
        setPagination((currentPagination) => ({
            ...currentPagination,
            limit: nextState.limit,
        }));
    }, [searchParams]);

    useEffect(() => {
        const nextSearchParams = buildSearchParamsFromState({
            q: searchInput,
            ...filters,
            page,
            limit: pagination.limit,
        });

        if (!areSearchParamsEqual(searchParams, nextSearchParams)) {
            setSearchParams(nextSearchParams, { replace: true });
        }
    }, [searchInput, filters, page, pagination.limit, searchParams, setSearchParams]);

    useEffect(() => {
        let ignore = false;

        async function loadCategories() {
            try {
                const response = await getCategories();

                if (!ignore) {
                    setCategories(extractCategories(response));
                }
            } catch (err) {
                if (!ignore) {
                    setCategories([]);
                }
            }
        }

        loadCategories();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        let ignore = false;

        async function loadBooks() {
            try {
                setLoading(true);
                setError("");

                const response = await getBooks({
                    q: debouncedSearch,
                    author: filters.author,
                    categoryId: filters.categoryId,
                    available: filters.available,
                    sort: filters.sort,
                    page,
                    limit: pagination.limit,
                });

                if (!ignore) {
                    setBooks(extractBooks(response));
                    setPagination((currentPagination) => ({
                        ...currentPagination,
                        page: response?.pagination?.page || page,
                        limit: response?.pagination?.limit || currentPagination.limit,
                        total: response?.pagination?.total || 0,
                        pages: response?.pagination?.pages || 1,
                    }));
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
    }, [
        debouncedSearch,
        filters.author,
        filters.available,
        filters.categoryId,
        filters.sort,
        page,
        pagination.limit,
    ]);

    function updateFilter(key, value) {
        setPage(1);
        setFilters((currentFilters) => ({
            ...currentFilters,
            [key]: value,
        }));
    }

    function resetFilters() {
        setSearchInput("");
        setDebouncedSearch("");
        setFilters({
            author: "",
            categoryId: "",
            available: "",
            sort: "random",
        });
        setPage(1);
    }

    const categoryCounts = books.reduce((acc, book) => {
        const category = getCategoryName(book);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    const availableCount = books.filter(
        (book) => Number(book?.availableCopies ?? 0) > 0
    ).length;
    const unavailableCount = books.length - availableCount;
    const pageNumbers = Array.from(
        { length: pagination.pages || 1 },
        (_, index) => index + 1
    );
    const filtersAreActive = hasActiveFilters({
        q: searchInput,
        ...filters,
    });

    return (
        <main className="min-h-screen bg-[#f2f2f2]">
            <section className="w-full overflow-hidden border border-slate-300 bg-white">
                <HeaderComponent subtitle="Page d'accueil - Catalogue" user={user} />

                <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[280px_1fr]">
                    <BooksSidebar
                        availableCount={availableCount}
                        unavailableCount={unavailableCount}
                        categoryCounts={categoryCounts}
                        categories={categories}
                        filters={filters}
                        onFilterChange={updateFilter}
                        onResetFilters={resetFilters}
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
                                        value={searchInput}
                                        onChange={(event) => {
                                            setSearchInput(event.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Recherche par titre, auteur, description, ISBN..."
                                        className="h-11 flex-1 rounded-xl border border-slate-700 bg-white px-4 text-sm outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPage(1)}
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
                                {filtersAreActive
                                    ? `${pagination.total} livres trouves avec les filtres`
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

                            {!loading && !error && books.length === 0 && (
                                <div className="rounded-[24px] border border-slate-300 bg-white p-8 text-slate-600">
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Aucun livre disponible
                                    </h2>
                                    <p className="mt-2">
                                        Aucun resultat ne correspond aux filtres actuels.
                                    </p>
                                </div>
                            )}

                            {!loading && !error && books.length > 0 && (
                                <>
                                    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                                        {books.map((book, index) => {
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
                                                            <BookCoverImage
                                                                image={book?.image}
                                                                alt={getTitle(book)}
                                                                className="h-28 w-full rounded-lg object-cover"
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
                                                            Voir details
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
