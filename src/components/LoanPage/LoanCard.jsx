function getProgressPercent(dueDate) {
    const due = new Date(dueDate)
    const today = new Date()
    const daysRemaining = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    return Math.min(100, Math.max(0, (daysRemaining / 14) * 100))
}

export default function LoanCard({loan}) {

    const percent = getProgressPercent(loan.dueDate);
    const isLate = loan.isLate || loan.status === 'OVERDUE';
    const dueFormatted = new Date(loan.dueDate).toLocaleDateString('fr-FR');


    return (
        <div className={`rounded-lg border p-3 ${isLate ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{loan.bookTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Emprunté le {new Date(loan.loanDate).toLocaleDateString('fr-FR')}
                    </p>
                    <p className={`text-xs mt-0.5 font-medium ${isLate ? 'text-red-600' : 'text-slate-600'}`}>
                        À rendre avant le {dueFormatted}
                    </p>
                </div>
                {isLate && (
                    <span className="shrink-0 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
              En retard
            </span>
                )}
            </div>
            {/* Barre de progression */}
            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isLate ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
};
