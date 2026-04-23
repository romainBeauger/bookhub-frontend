function getProgressPercent(dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    const daysRemaining = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.max(0, (daysRemaining / 14) * 100));
}

function getLoanPresentation(loan) {
    if (loan?.status === "RETURN_REQUESTED") {
        return {
            label: "Retour en attente de validation",
            badgeClass: "bg-amber-100 text-amber-700",
        };
    }

    if (loan?.status === "RETURNED") {
        return {
            label: "Rendu",
            badgeClass: "bg-emerald-100 text-emerald-700",
        };
    }

    if (loan?.status === "OVERDUE" || loan?.isLate) {
        return {
            label: "En retard",
            badgeClass: "bg-red-100 text-red-600",
        };
    }

    return {
        label: "En cours",
        badgeClass: "bg-sky-100 text-sky-700",
    };
}

export default function LoanCard({ loan, onReturn, onValidateReturn, loading = false, showActions = true }) {
    const percent = getProgressPercent(loan.dueDate);
    const isLate = loan.isLate || loan.status === "OVERDUE";
    const dueFormatted = new Date(loan.dueDate).toLocaleDateString("fr-FR");
    const loanPresentation = getLoanPresentation(loan);
    const canRequestReturn = loan?.status === "ACTIVE" || loan?.status === "OVERDUE";
    const canValidateReturn = loan?.status === "RETURN_REQUESTED" && typeof onValidateReturn === "function";

    return (
        <div className={`rounded-lg border p-3 ${isLate ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{loan.bookTitle}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{loan.user.firstName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Emprunte le {new Date(loan.loanDate).toLocaleDateString("fr-FR")}
                    </p>
                    <p className={`mt-0.5 text-xs font-medium ${isLate ? "text-red-600" : "text-slate-600"}`}>
                        A rendre avant le {dueFormatted}
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${loanPresentation.badgeClass}`}>
                        {loanPresentation.label}
                    </span>
                </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                    className={`h-full rounded-full transition-all ${isLate ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${percent}%` }}
                />
            </div>

            {showActions && (canRequestReturn || canValidateReturn) && (
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={() => (canValidateReturn ? onValidateReturn?.(loan) : onReturn?.(loan))}
                        disabled={loading}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Traitement..." : canValidateReturn ? "Valider le retour" : "Demander le retour"}
                    </button>
                </div>
            )}
        </div>
    );
}
