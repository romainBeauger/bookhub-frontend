import { useEffect, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import BookCard from "../components/BooksPage/BookCard.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import { getBooks, getCategories } from "../services/bookService.js";
import { borrowBook } from "../services/loanService.js";
import { createReservation } from "../services/reservationService.js";
import { useAuth } from "../context/AuthContext.jsx";

const DEFAULT_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_VIEW = "grid";

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

function getCategoryName(book) {
    if (typeof book?.category === "string") {
        return book.category;
    }

    return book?.category?.name || book?.categorie?.name || "General";
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
        view: searchParams.get("view") === "list" ? "list" : DEFAULT_VIEW,
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
        "view",
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
    const location = useLocation();
    const [navOpen, setNavOpen] = useState(false);
    const [toast, setToast] = useState(location.state?.toast || null);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialState = readStateFromSearchParams(searchParams);

    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [borrowingId, setBorrowingId] = useState(null);
    const [reservingId, setReservingId] = useState(null);
    const [searchInput, setSearchInput] = useState(initialState.q);
    const [debouncedSearch, setDebouncedSearch] = useState(initialState.q);
    const [filters, setFilters] = useState({
        author: initialState.author,
        categoryId: initialState.categoryId,
        available: initialState.available,
        sort: initialState.sort,
        view: initialState.view,
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
                view: nextState.view,
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
                throw new Error(err.message);
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
            view: DEFAULT_VIEW,
        });
        setPage(1);
    }

    async function handleBorrow(book) {
        const bookId = book?.id || book?._id;

        if (!bookId || borrowingId) {
            return;
        }

        try {
            setBorrowingId(bookId);
            await borrowBook(bookId);
            setBooks((currentBooks) =>
                currentBooks.map((currentBook) => {
                    const currentBookId = currentBook?.id || currentBook?._id;

                    if (currentBookId !== bookId) {
                        return currentBook;
                    }

                    const availableCopies = Number(currentBook?.availableCopies ?? 0);

                    return {
                        ...currentBook,
                        availableCopies: Math.max(0, availableCopies - 1),
                    };
                })
            );
            setToast({
                type: "success",
                message: `"${book?.title || book?.titre || "Livre"}" a ete emprunte avec succes.`,
            });
        } catch (err) {
            setToast({
                type: "error",
                message: err.message || "Impossible d'emprunter ce livre.",
            });
        } finally {
            setBorrowingId(null);
        }
    }

    async function handleReserve(book) {
        const bookId = book?.id || book?._id;

        if (!bookId || reservingId) {
            return;
        }

        try {
            setReservingId(bookId);
            await createReservation(bookId);
            setToast({
                type: "success",
                message: "Reservation creee avec succes.",
            });
        } catch (err) {
            setToast({
                type: "error",
                message: err.message || "Impossible de creer la reservation.",
            });
        } finally {
            setReservingId(null);
        }
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
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                    {toast.message}
                </div>
            )}
            <section className="w-full overflow-hidden border border-slate-300 bg-white">
                <HeaderComponent
                    subtitle="Page d'accueil - Catalogue"
                    user={user}
                    onMenuToggle={() => setNavOpen(o => !o)}
                />

                <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[280px_1fr]">
                    <BooksSidebar
                        availableCount={availableCount}
                        unavailableCount={unavailableCount}
                        categoryCounts={categoryCounts}
                        categories={categories}
                        filters={filters}
                        onFilterChange={updateFilter}
                        onResetFilters={resetFilters}
                        mobileOpen={navOpen}
                        onClose={() => setNavOpen(false)}
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
                                <div className="flex w-full max-w-140 flex-col gap-3 sm:flex-row">
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
                                        onClick={() => updateFilter("view", "grid")}
                                        className={`rounded-xl border px-5 py-2 text-sm font-medium transition-colors ${
                                            filters.view === "grid"
                                                ? "border-slate-800 bg-slate-900 text-white"
                                                : "border-slate-800 bg-white text-slate-950"
                                        }`}
                                    >
                                        Grille
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateFilter("view", "list")}
                                        className={`rounded-xl border px-5 py-2 text-sm font-medium transition-colors ${
                                            filters.view === "list"
                                                ? "border-blue-500 bg-blue-500 text-white"
                                                : "border-blue-400 bg-white text-blue-500"
                                        }`}
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
                                <div className="flex min-h-60 items-center justify-center rounded-3xl border border-slate-300 bg-white">
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
                                <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
                                    <h2 className="text-xl font-semibold">Erreur de chargement</h2>
                                    <p className="mt-2">{error}</p>
                                </div>
                            )}

                            {!loading && !error && books.length === 0 && (
                                <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-600">
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
                                    <div
                                        className={
                                            filters.view === "list"
                                                ? "grid gap-6"
                                                : "grid gap-6 md:grid-cols-2 2xl:grid-cols-3"
                                        }
                                    >
                                        {books.map((book, index) => {
                                            return (
                                                <BookCard
                                                    key={book?.id || book?._id || `book-${index}`}
                                                    book={book}
                                                    onBorrow={handleBorrow}
                                                    borrowing={borrowingId === (book?.id || book?._id)}
                                                    onReserve={handleReserve}
                                                    reserving={reservingId === (book?.id || book?._id)}
                                                    view={filters.view}
                                                />
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-slate-300 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
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
