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
        <div className="min-h-screen bg-[#f2f2f2]">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
                    toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}>
                    {toast.message}
                </div>
            )}
            <HeaderComponent
                subtitle="Tableau de bord"
                user={user}
                onMenuToggle={() => setNavOpen((open) => !open)}
            />
            <div className="grid lg:grid-cols-[280px_1fr]">
                <BooksSidebar
                    showFilters={false}
                    mobileOpen={navOpen}
                    onClose={() => setNavOpen(false)}
                    onLogout={handleLogout}
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

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <StatCard label="Emprunts en cours" value={activeLoans.length} />
                        <StatCard label="Retards" value={lateLoans.length} highlight={lateLoans.length > 0} />
                        <StatCard label="Reservations en attente" value={0} />
                    </div>

                    {lateLoans.length > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            Vous avez {lateLoans.length} emprunt{lateLoans.length > 1 ? "s" : ""} en retard.
                            Merci de les retourner des que possible.
                        </div>
                    )}

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-slate-700">Emprunts en cours</h2>
                            <Link
                                to="/my-loans"
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
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

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                        <h2 className="font-semibold text-slate-700">Reservations en attente</h2>
                        <p className="text-sm text-slate-400">Aucune reservation en attente.</p>
                    </section>
                </main>
            </div>
        </div>
    );
}
