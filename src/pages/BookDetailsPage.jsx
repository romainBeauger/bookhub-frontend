import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BookCoverImage from "../components/BooksPage/BookCoverImage.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getBookById } from "../services/bookService.js";

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

export default function BookDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    const status = getStatus(book);

    return (
        <main className="min-h-screen bg-[#f2f2f2]">
            <section className="w-full overflow-hidden border border-slate-300 bg-white">
                <HeaderComponent subtitle="Page Detail d'un livre" user={user} />

                <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[220px_1fr]">
                    <BooksSidebar
                        availableCount={0}
                        unavailableCount={0}
                        categoryCounts={{}}
                        showFilters={false}
                    />

                    <section className="bg-[#efefef] p-5 md:p-6">
                        {loading && (
                            <div className="flex min-h-[280px] items-center justify-center border border-slate-300 bg-[#f8f8f8]">
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
                                    <div className="shrink-0 overflow-hidden rounded-[26px] border-2 border-slate-500 bg-[#404040] lg:w-[220px]">
                                        <div className="grid h-[280px] place-items-center rounded-[22px] text-center text-lg font-semibold text-white sm:h-[320px]">
                                            <BookCoverImage
                                                image={book?.image}
                                                alt={book.title}
                                                className="h-full w-full rounded-[22px] object-cover"
                                                fallback="COUVERTURE"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex min-h-[180px] min-w-0 flex-1 flex-col justify-between space-y-5 sm:min-h-[220px]">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <h2 className="text-3xl font-medium text-slate-950 lg:text-[2.1rem]">
                                                    {book.title}
                                                </h2>
                                                <p className="mt-1 text-sm uppercase tracking-[0.16em] text-slate-500">
                                                    Auteur
                                                </p>
                                                <p className="mt-2 text-xl text-slate-700">{book.author}</p>
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

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <Link
                                            to="/books"
                                            className="rounded-xl border border-slate-700 bg-white px-5 py-2 text-sm font-medium text-slate-900"
                                        >
                                            Retour
                                        </Link>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                className="rounded-xl border border-slate-700 bg-white px-5 py-2 text-sm font-medium text-slate-900"
                                            >
                                                Noter
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-xl border border-emerald-500 bg-white px-5 py-2 text-sm font-medium text-emerald-600"
                                            >
                                                Reserver
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}
