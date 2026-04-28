import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import { cancelReservation, getMyReservations } from "../services/reservationService.js";
import {
    canCancelReservation,
    extractReservations,
    formatReservationDate,
    getReservationStatusClass,
    getReservationStatusLabel,
    sortReservationsByNewest,
} from "../utils/reservations.js";

function getReservationBookTitle(reservation) {
    return reservation?.book?.title || "Livre inconnu";
}

function getReservationBookAuthor(reservation) {
    return reservation?.book?.author || "Auteur inconnu";
}

export default function MyReservationsPage() {
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [processingReservationId, setProcessingReservationId] = useState(null);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    async function loadReservations() {
        setLoading(true);
        setError("");

        try {
            const response = await getMyReservations();
            setReservations(sortReservationsByNewest(extractReservations(response)));
        } catch (err) {
            setError(err.message || "Impossible de charger vos reservations.");
            setReservations([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReservations();
    }, []);

    async function handleCancel(reservation) {
        const reservationId = reservation?.id;

        if (!reservationId || processingReservationId) {
            return;
        }

        setProcessingReservationId(reservationId);

        try {
            await cancelReservation(reservationId);
            await loadReservations();
            setToast({
                type: "success",
                message: "Reservation annulee avec succes.",
            });
        } catch (err) {
            setToast({
                type: "error",
                message: err.message || "Impossible d'annuler cette reservation.",
            });
        } finally {
            setProcessingReservationId(null);
        }
    }

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
            {toast && (
                <div className={`fixed right-5 bottom-5 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
                    toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}>
                    {toast.message}
                </div>
            )}

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
                        <h1 className="text-2xl font-bold text-slate-800">Mes reservations</h1>
                        <p className="text-sm text-slate-500">
                            Suivez votre position dans la file et gerez les reservations en attente.
                        </p>
                    </div>

                    {loading && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Chargement des reservations...
                        </section>
                    )}

                    {!loading && error && (
                        <section className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
                            {error}
                        </section>
                    )}

                    {!loading && !error && reservations.length === 0 && (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Aucune reservation enregistree pour le moment.
                        </section>
                    )}

                    {!loading && !error && reservations.length > 0 && (
                        <section className="space-y-4">
                            {reservations.map((reservation) => {
                                const canCancel = canCancelReservation(reservation?.status);

                                return (
                                    <article
                                        key={reservation.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-5"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-lg font-semibold text-slate-900">
                                                        {getReservationBookTitle(reservation)}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {getReservationBookAuthor(reservation)}
                                                    </p>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Statut
                                                        </p>
                                                        <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                                            getReservationStatusClass(reservation?.status)
                                                        }`}>
                                                            {getReservationStatusLabel(reservation?.status)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Position
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                                            {reservation?.queuePosition ?? "-"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Date
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                                            {formatReservationDate(reservation?.reservationDate)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                            Disponibilite
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                                            {reservation?.book?.availableCopies ?? 0} exemplaire(s)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                {canCancel ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancel(reservation)}
                                                        disabled={processingReservationId === reservation.id}
                                                        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {processingReservationId === reservation.id ? "Annulation..." : "Annuler"}
                                                    </button>
                                                ) : (
                                                    <span className="text-sm font-medium text-slate-500">
                                                        {reservation?.status === "VALIDATED"
                                                            ? "Transformee en emprunt"
                                                            : "Reservation annulee"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

