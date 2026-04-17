import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import HeaderComponent from '../components/Header/HeaderComponent.jsx';
import BooksSidebar from '../components/BooksPage/BooksSidebar.jsx';
import StatCard from "../components/LoanPage/StatCard.jsx";
import { getMyLoans, borrowBook } from '../services/loanService';
import LoanCard from "../components/LoanPage/LoanCard.jsx";
import HistoryCard from "../components/LoanPage/HistoryCard.jsx";


export default function MyLoanPage() {

    const { user } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [borrowingId, setBorrowingId] = useState(null);

    useEffect(() => {
        getMyLoans()
            .then(setLoans)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE')
    const history = loans.filter(l => l.status === 'RETURNED')
    const lateCount = loans.filter(l => l.isLate).length

    async function handleReborrow(bookId) {
        setBorrowingId(bookId);
        try {
            await borrowBook(bookId);
            const updated = await getMyLoans();
            setLoans(updated);
        } catch (e) {
            alert(e.message);
        } finally {
            setBorrowingId(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#f2f2f2]">
            <HeaderComponent subtitle="Page Mes emprunts - User" user={user} />
            <div className="grid lg:grid-cols-[280px_1fr]">
                <BooksSidebar showFilters={false} />
                <main className="p-6 space-y-6">

                    {/* Titre */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Mes emprunts</h1>
                        <p className="text-sm text-slate-500">Gérez vos emprunts en cours et consultez votre historique</p>
                    </div>

                    {/* Widgets stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                        <StatCard label="En cours" value={activeLoans.length} />
                        <StatCard label="Retards" value={lateCount} highlight={lateCount > 0} />
                        <StatCard label="Lectures totales" value={loans.length} />
                    </div>

                    {/* Alerte retard */}
                    {lateCount > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                            ⚠️ Vous avez {lateCount} emprunt{lateCount > 1 ? 's' : ''} en retard. Vous ne pouvez pas emprunter de nouveaux livres tant que vous ne les avez
                            pas rendus.
                        </div>
                    )}

                    {/* Chargement / Erreur */}
                    {loading && <p className="text-slate-500 text-sm">Chargement...</p>}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* Emprunts en cours */}
                    {!loading && (
                        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-slate-700">Emprunts en cours</h2>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                    {activeLoans.length} actif{activeLoans.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            {activeLoans.length === 0 && (
                                <p className="text-sm text-slate-400">Aucun emprunt en cours.</p>
                            )}
                            {activeLoans.map(loan => (
                                <LoanCard key={loan.id} loan={loan} />
                            ))}
                        </section>
                    )}

                    {/* Historique */}
                    {!loading && history.length > 0 && (
                        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                            <h2 className="font-semibold text-slate-700">Historique</h2>
                            {history.map(loan => (
                                <HistoryCard
                                    key={loan.id}
                                    loan={loan}
                                    onReborrow={() => handleReborrow(loan.bookId)}
                                    loading={borrowingId === loan.bookId}
                                />
                            ))}
                        </section>
                    )}




                </main>
            </div>

        </div>
    )
};
