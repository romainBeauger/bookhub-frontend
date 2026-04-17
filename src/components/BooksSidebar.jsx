export default function BooksSidebar({
    availableCount,
    unavailableCount,
    categoryCounts,
    showFilters = true,
}) {
    return (
        <aside className="border-b border-slate-300 bg-white lg:border-r lg:border-b-0">
            <nav className="border-b border-slate-300 px-5 py-5">
                <ul className="space-y-2 text-[0.98rem]">
                    <li className="rounded-xl bg-slate-200 px-3 py-2 font-medium text-blue-500">
                        CATALOGUE
                    </li>
                    <li className="px-3 py-1 font-medium text-slate-950">
                        MES EMPRUNTS
                    </li>
                    <li className="px-3 py-1 font-medium text-slate-950">
                        MES RESERVATIONS
                    </li>
                    <li className="px-3 py-1 font-medium text-slate-950">
                        MES AVIS
                    </li>
                    <li className="px-3 py-1 text-slate-400">(PROFIL)</li>
                </ul>
            </nav>

            {showFilters ? (
                <div className="px-4 py-5">
                    <h2 className="mb-4 text-lg font-semibold text-slate-950">
                        FILTRES
                    </h2>

                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-slate-950">
                            Disponibilite
                        </h3>
                        <div className="space-y-2 text-sm">
                            <label className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-500 bg-blue-400" />
                                    Reservables
                                </span>
                                <span className="text-slate-500">{availableCount}</span>
                            </label>
                            <label className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-400 bg-white" />
                                    Indisponibles
                                </span>
                                <span className="text-slate-500">{unavailableCount}</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-slate-950">
                            Categories
                        </h3>
                        <div className="space-y-2 text-sm">
                            {Object.entries(categoryCounts).slice(0, 6).map(([category, count]) => (
                                <div
                                    key={category}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-400 bg-white" />
                                        {category}
                                    </span>
                                    <span className="text-slate-500">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-950">
                            Trier par
                        </h3>
                        <div className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-700">
                            Titre A-Z
                        </div>
                    </div>
                </div>
            ) : null}
        </aside>
    );
}
