import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasStaffAccess } from '../utils/auth.js';
import HeaderComponent from '../components/Header/HeaderComponent.jsx';
import BooksSidebar from '../components/BooksPage/BooksSidebar.jsx';
import StatCard from "../components/LoanPage/StatCard.jsx";
import { getMyLoans, borrowBook, returnBook, validateReturn } from '../services/loanService';
import LoanCard from "../components/LoanPage/LoanCard.jsx";
import HistoryCard from "../components/LoanPage/HistoryCard.jsx";


export default function MyLoanPage() {

    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [borrowingId, setBorrowingId] = useState(null);
    const [processingLoanId, setProcessingLoanId] = useState(null);
    const [toast, setToast] = useState(null);
    const isStaff = hasStaffAccess(user);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = setTimeout(() => setToast(null), 3000);

        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        getMyLoans()
            .then(setLoans)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const activeLoans = loans.filter(l => ['ACTIVE', 'OVERDUE', 'RETURN_REQUESTED'].includes(l.status))
    const history = loans.filter(l => l.status === 'RETURNED')
    const lateCount = loans.filter(l => l.isLate).length
    const pendingReturnCount = loans.filter(l => l.status === 'RETURN_REQUESTED').length

    async function handleReborrow(bookId) {
        setBorrowingId(bookId);
        try {
            await borrowBook(bookId);
            const updated = await getMyLoans();
            setLoans(updated);
            setToast({ type: 'success', message: 'Livre reemprunte avec succes.' });
        } catch (e) {
            setToast({ type: 'error', message: e.message });
        } finally {
            setBorrowingId(null);
        }
    }

    async function handleReturn(loan) {
        const loanId = loan?.id;

        if (!loanId || processingLoanId) {
            return;
        }

        setProcessingLoanId(loanId);

        try {
            await returnBook(loanId);
            setLoans((currentLoans) =>
                currentLoans.map((currentLoan) =>
                    currentLoan.id === loanId
                        ? { ...currentLoan, status: 'RETURN_REQUESTED' }
                        : currentLoan
                )
            );
            setToast({ type: 'success', message: 'Demande de retour envoyee.' });
        } catch (e) {
            setToast({ type: 'error', message: e.message });
        } finally {
            setProcessingLoanId(null);
        }
    }

    async function handleValidateReturn(loan) {
        const loanId = loan?.id;

        if (!loanId || processingLoanId) {
            return;
        }

        setProcessingLoanId(loanId);

        try {
            await validateReturn(loanId);
            const updated = await getMyLoans();
            setLoans(updated);
            setToast({ type: 'success', message: 'Retour valide avec succes.' });
        } catch (e) {
            setToast({ type: 'error', message: e.message });
        } finally {
            setProcessingLoanId(null);
        }
    }

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
            {toast && (
                <div className={`fixed right-5 bottom-5 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
                    onMenuToggle={() => setNavOpen(o => !o)}
                />
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
                        <StatCard label="Retours en attente" value={pendingReturnCount} />
                    </div>

                    {/* Alerte retard */}
                    {lateCount > 0 && (
                        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "var(--danger-bg)", color: "var(--danger-fg)", border: "1px solid #fecaca" }}>
                            Vous avez {lateCount} emprunt{lateCount > 1 ? 's' : ''} en retard. Vous ne pouvez pas emprunter de nouveaux livres tant que vous ne les avez pas rendus.
                        </div>
                    )}

                    {/* Chargement / Erreur */}
                    {loading && <p className="text-slate-500 text-sm">Chargement...</p>}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* Emprunts en cours */}
                    {!loading && (
                        <section className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" }}>
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold" style={{ color: "var(--text-main)" }}>Emprunts en cours</h2>
                                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--bg-accent)", color: "var(--tangerine)" }}>
                                    {activeLoans.length} actif{activeLoans.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            {activeLoans.length === 0 && (
                                <p className="text-sm text-slate-400">Aucun emprunt en cours.</p>
                            )}
                            {activeLoans.map(loan => (
                                <LoanCard
                                    key={loan.id}
                                    loan={loan}
                                    onReturn={handleReturn}
                                    onValidateReturn={isStaff ? handleValidateReturn : undefined}
                                    loading={processingLoanId === loan.id}
                                />
                            ))}
                        </section>
                    )}

                    {/* Historique */}
                    {!loading && history.length > 0 && (
                        <section className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" }}>
                            <h2 className="font-semibold" style={{ color: "var(--text-main)" }}>Historique</h2>
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
}
