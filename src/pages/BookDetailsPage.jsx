import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BooksSidebar from "../components/BooksSidebar.jsx";
import HeaderComponent from "../components/HeaderComponent.jsx";
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
    const navigate = useNavigate();
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
                <HeaderComponent subtitle="Catalogue - Details du livre" user={user} />

                <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[220px_1fr]">
                    <BooksSidebar
                        availableCount={0}
                        unavailableCount={0}
                        categoryCounts={{}}
                        showFilters={false}
                    />

                    <section className="bg-[#efefef] p-6 md:p-8">
                    {loading && (
                        <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-slate-300 bg-[#f8f8f8]">
                            <div className="flex items-center gap-3 text-slate-600">
                                <img src="/spinner.svg" alt="Chargement" className="h-6 w-6" />
                                <span>Chargement du livre...</span>
                            </div>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-red-700">
                            <h2 className="text-xl font-semibold">Erreur</h2>
                            <p className="mt-2">{error}</p>
                        </div>
                    )}

                    {!loading && !error && book && (
                        <>
                            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Catalogue / Details</p>
                                    <h1 className="text-3xl font-semibold text-slate-950">
                                        Details du livre
                                    </h1>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="rounded-xl border border-slate-700 bg-white px-5 py-2 text-sm font-medium text-slate-900"
                                    >
                                        Retour
                                    </button>
                                    <Link
                                        to="/books"
                                        className="rounded-xl border border-sky-500 bg-sky-500 px-5 py-2 text-sm font-medium text-white"
                                    >
                                        Catalogue
                                    </Link>
                                </div>
                            </div>

                            <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
                                <div className="rounded-[28px] border border-slate-300 bg-[#f8f8f8] p-5">
                                    <div className="relative grid h-[420px] place-items-center rounded-[22px] border border-slate-300 bg-white px-4">
                                        <span className="absolute left-4 top-4 text-sm text-slate-400">
                                            {getCategoryName(book)}
                                        </span>
                                        <span
                                            className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-medium ${status.badgeClass}`}
                                        >
                                            {status.label}
                                        </span>
                                        {book?.image ? (
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="h-[320px] w-full rounded-xl object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg text-slate-900">Couverture</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.2em] text-sky-500">
                                            Livre #{book.id}
                                        </p>
                                        <h2 className="mt-2 text-4xl font-semibold text-slate-950">
                                            {book.title}
                                        </h2>
                                        <p className="mt-3 text-2xl text-slate-700">{book.author}</p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-[22px] border border-slate-300 bg-white p-5">
                                            <p className="text-sm text-slate-500">ISBN</p>
                                            <p className="mt-2 text-lg font-medium text-slate-950">
                                                {book?.isbn || "Non renseigne"}
                                            </p>
                                        </div>
                                        <div className="rounded-[22px] border border-slate-300 bg-white p-5">
                                            <p className="text-sm text-slate-500">Publication</p>
                                            <p className="mt-2 text-lg font-medium text-slate-950">
                                                {book?.publishedAt || "Non renseignee"}
                                            </p>
                                        </div>
                                        <div className="rounded-[22px] border border-slate-300 bg-white p-5">
                                            <p className="text-sm text-slate-500">Copies disponibles</p>
                                            <p className="mt-2 text-lg font-medium text-slate-950">
                                                {book?.availableCopies ?? 0}
                                            </p>
                                        </div>
                                        <div className="rounded-[22px] border border-slate-300 bg-white p-5">
                                            <p className="text-sm text-slate-500">Total exemplaires</p>
                                            <p className="mt-2 text-lg font-medium text-slate-950">
                                                {book?.totalCopies ?? 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-slate-300 bg-white p-6">
                                        <h3 className="text-lg font-semibold text-slate-950">
                                            Description
                                        </h3>
                                        <p className="mt-3 leading-7 text-slate-600">
                                            {book?.description || "Aucune description disponible pour ce livre."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    </section>
                </div>
            </section>
        </main>
    );
}
