import { useEffect, useState } from "react";
import { getBooks } from "../services/bookService.js";

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
            buttonLabel: "Reserver",
            buttonClass: "bg-slate-700 text-white",
        };
    }

    return {
        label: "Disponible",
        badgeClass: "bg-emerald-100 text-emerald-500",
        buttonLabel: "Emprunter",
        buttonClass: "bg-sky-500 text-white",
    };
}

function readStoredUser() {
    if (typeof window === "undefined") {
        return null;
    }

    const candidateKeys = ["user", "authUser", "currentUser", "profile"];

    for (const key of candidateKeys) {
        const rawValue = window.localStorage.getItem(key);

        if (!rawValue) {
            continue;
        }

        try {
            const parsed = JSON.parse(rawValue);

            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        } catch {
            // Ignore invalid storage values and continue scanning.
        }
    }

    return null;
}

function getUserDisplayName(user) {
    if (!user) {
        return "Mon espace";
    }

    const fullName = [user.firstName, user.prenom, user.lastName, user.nom]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (fullName) {
        return fullName;
    }

    return (
        user.name ||
        user.username ||
        user.pseudo ||
        user.email ||
        "Mon espace"
    );
}

function getUserInitials(name) {
    const parts = name
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2);

    if (parts.length === 0) {
        return "ME";
    }

    return parts.map((part) => part[0].toUpperCase()).join("");
}

export default function BooksPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [userName, setUserName] = useState("Mon espace");

    useEffect(() => {
        let ignore = false;

        async function loadBooks() {
            try {
                setLoading(true);
                setError("");

                const response = await getBooks();

                if (!ignore) {
                    setBooks(extractBooks(response));
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
    }, []);

    useEffect(() => {
        const storedUser = readStoredUser();
        setUserName(getUserDisplayName(storedUser));
    }, []);

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

    return (
        <main className="min-h-screen bg-[#f2f2f2] p-3 md:p-6">
            <section className="mx-auto max-w-[1280px] overflow-hidden rounded-[32px] border border-slate-300 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
                <header className="border-b-2 border-violet-500 px-6 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-lime-300 via-cyan-400 to-violet-500 text-lg font-bold text-white">
                                B
                            </div>
                            <div>
                                <div className="text-[2.1rem] font-semibold leading-none text-slate-950">
                                    BookHub
                                </div>
                                <p className="text-sm text-slate-500">
                                    Page d&apos;accueil - Catalogue
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-start lg:self-auto">
                            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800">
                                {userName}
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-600 text-sm font-semibold text-white ring-4 ring-white">
                                {getUserInitials(userName)}
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-700 text-slate-700">
                                <span className="text-xs font-semibold">UI</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[220px_1fr]">
                    <aside className="border-b border-slate-300 bg-white lg:border-r lg:border-b-0">
                        <nav className="border-b border-slate-300 px-5 py-5">
                            <ul className="space-y-2 text-[0.98rem]">
                                <li className="rounded-xl bg-slate-200 px-3 py-2 font-medium text-blue-500">
                                    CATALOGUE
                                </li>
                                <li className="px-3 py-1 font-medium text-slate-950">
                                    MES EMPRUNTS
                                </li>
                                <li className="px-3 py-1 font-medium text-slate-950">
                                    MES RESERVATIONS
                                </li>
                                <li className="px-3 py-1 font-medium text-slate-950">
                                    MES AVIS
                                </li>
                                <li className="px-3 py-1 text-slate-400">(PROFIL)</li>
                            </ul>
                        </nav>

                        <div className="px-4 py-5">
                            <h2 className="mb-4 text-lg font-semibold text-slate-950">
                                FILTRES
                            </h2>

                            <div className="mb-6">
                                <h3 className="mb-3 text-sm font-semibold text-slate-950">
                                    Disponibilite
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <label className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2">
                                            <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-500 bg-blue-400" />
                                            Reservables
                                        </span>
                                        <span className="text-slate-500">{availableCount}</span>
                                    </label>
                                    <label className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2">
                                            <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-400 bg-white" />
                                            Indisponibles
                                        </span>
                                        <span className="text-slate-500">{unavailableCount}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="mb-3 text-sm font-semibold text-slate-950">
                                    Categories
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {Object.entries(categoryCounts).slice(0, 6).map(([category, count]) => (
                                        <div
                                            key={category}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-400 bg-white" />
                                                {category}
                                            </span>
                                            <span className="text-slate-500">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-slate-950">
                                    Trier par
                                </h3>
                                <div className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-700">
                                    Titre A-Z
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section className="bg-[#efefef]">
                        <div className="border-b border-slate-300 px-6 py-6 md:px-8">
                            <h1 className="text-[2rem] font-semibold leading-tight text-slate-950">
                                Catalogue de livres
                            </h1>
                            <p className="text-[1.05rem] text-slate-500">
                                Consultez et empruntez parmi nos {books.length} ouvrages disponibles
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
                                {filteredBooks.length} livres trouves
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
                                                    <button
                                                        type="button"
                                                        className={`mt-3 w-full rounded-xl border border-slate-800 px-4 py-3 text-sm font-semibold ${status.buttonClass}`}
                                                    >
                                                        {status.buttonLabel}
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
}
