export default function HistoryCard({ loan, onReborrow, loading }) {

    const canReborrow = loan.status === 'RETURNED';
    const returnedFormatted = loan.returnedAt
        ? new Date(loan.returnedAt).toLocaleDateString('fr-FR')
        : '—';

    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{loan.bookTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                    Du {new Date(loan.loanDate).toLocaleDateString('fr-FR')} au {returnedFormatted}
                </p>
                <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            Rendu
          </span>
            </div>
            <button
                onClick={onReborrow}
                disabled={!canReborrow || loading}
                className={`shrink-0 text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors
            ${canReborrow && !loading
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                    : 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'
                }`}
            >
                {loading ? '...' : 'Réemprunter'}
            </button>
        </div>
    )
};
