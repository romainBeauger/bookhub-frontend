import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import StatCard from "../components/LoanPage/StatCard.jsx";
import LoanCard from "../components/LoanPage/LoanCard.jsx";
import { getMyLoans } from "../services/loanService.js";

export default function UserDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [navOpen, setNavOpen] = useState(false);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(location.state?.toast || null);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    useEffect(() => {
        getMyLoans()
            .then(setLoans)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const activeLoans = loans.filter((loan) =>
        ["ACTIVE", "OVERDUE", "RETURN_REQUESTED"].includes(loan.status)
    );
    const lateLoans = loans.filter((loan) => loan.isLate);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
            {toast && (
                <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
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
                    onMenuToggle={() => setNavOpen((open) => !open)}
                />
                <main className="space-y-6 p-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Bonjour, {user?.prenom ?? user?.email}
                        </h1>
                        <p className="text-sm text-slate-500">
                            Voici un resume de votre activite
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <StatCard label="Emprunts en cours" value={activeLoans.length} />
                        <StatCard label="Retards" value={lateLoans.length} highlight={lateLoans.length > 0} />
                        <StatCard label="Reservations en attente" value={0} />
                    </div>

                    {lateLoans.length > 0 && (
                        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "var(--danger-bg)", color: "var(--danger-fg)", border: "1px solid #fecaca" }}>
                            Vous avez {lateLoans.length} emprunt{lateLoans.length > 1 ? "s" : ""} en retard.
                            Merci de les retourner dès que possible.
                        </div>
                    )}

                    <section
                        className="space-y-3 rounded-2xl p-5"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" }}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold" style={{ color: "var(--text-main)" }}>Emprunts en cours</h2>
                            <Link
                                to="/my-loans"
                                className="rounded-xl px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                                style={{ background: "var(--tangerine)" }}
                            >
                                Voir tout
                            </Link>
                        </div>

                        {loading && <p className="text-sm text-slate-400">Chargement...</p>}

                        {!loading && activeLoans.length === 0 && (
                            <p className="text-sm text-slate-400">Aucun emprunt en cours.</p>
                        )}

                        {!loading && activeLoans.slice(0, 3).map((loan) => (
                            <LoanCard key={loan.id} loan={loan} showActions={false} />
                        ))}

                        {!loading && activeLoans.length > 3 && (
                            <p className="text-center text-xs text-slate-400">
                                + {activeLoans.length - 3} autre{activeLoans.length - 3 > 1 ? "s" : ""}{" "}
                                <Link
                                    to="/my-loans"
                                    className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                                >
                                    voir tout
                                </Link>
                            </p>
                        )}
                    </section>

                    <section
                        className="space-y-3 rounded-2xl p-5"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" }}
                    >
                        <h2 className="font-semibold" style={{ color: "var(--text-main)" }}>Réservations en attente</h2>
                        <p className="text-sm" style={{ color: "var(--text-soft)" }}>Aucune réservation en attente.</p>
                    </section>
                </main>
            </div>
        </div>
    );
}
