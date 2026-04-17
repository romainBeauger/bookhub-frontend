function getCategoryOption(category) {
    return {
        id: String(category?.id ?? category?._id ?? category?.value ?? ""),
        name: category?.name || category?.label || category?.title || "Categorie",
    };
}

export default function BooksSidebar({
    availableCount = 0,
    unavailableCount = 0,
    categories = [],
    filters = {
        author: "",
        categoryId: "",
        available: "",
        sort: "random",
    },
    onFilterChange,
    onResetFilters,
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
                <div className="space-y-6 px-4 py-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-slate-950">
                            FILTRES
                        </h2>
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="text-sm font-medium text-sky-600"
                        >
                            Reinitialiser
                        </button>
                    </div>

                    <div>
                        <label
                            htmlFor="book-author-filter"
                            className="mb-2 block text-sm font-semibold text-slate-950"
                        >
                            Auteur
                        </label>
                        <input
                            id="book-author-filter"
                            type="text"
                            value={filters.author}
                            onChange={(event) => onFilterChange("author", event.target.value)}
                            placeholder="Nom de l'auteur"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="book-category-filter"
                            className="mb-2 block text-sm font-semibold text-slate-950"
                        >
                            Categorie
                        </label>
                        <select
                            id="book-category-filter"
                            value={filters.categoryId}
                            onChange={(event) => onFilterChange("categoryId", event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">Toutes les categories</option>
                            {categories.map((category) => {
                                const option = getCategoryOption(category);

                                if (!option.id) {
                                    return null;
                                }

                                return (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="book-availability-filter"
                            className="mb-2 block text-sm font-semibold text-slate-950"
                        >
                            Disponibilite
                        </label>
                        <select
                            id="book-availability-filter"
                            value={filters.available}
                            onChange={(event) => onFilterChange("available", event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">Tous</option>
                            <option value="true">Disponible</option>
                            <option value="false">Indisponible</option>
                        </select>

                        <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-500 bg-blue-400" />
                                    Disponibles
                                </span>
                                <span className="text-slate-500">{availableCount}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-400 bg-white" />
                                    Indisponibles
                                </span>
                                <span className="text-slate-500">{unavailableCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div>
                            <label
                                htmlFor="book-sort-filter"
                                className="mb-2 block text-sm font-semibold text-slate-950"
                            >
                                Trier par
                            </label>
                            <select
                                id="book-sort-filter"
                                value={filters.sort}
                                onChange={(event) => onFilterChange("sort", event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                            >
                                <option value="random">Aleatoire</option>
                                <option value="asc">A-Z</option>
                                <option value="desc">Z-A</option>
                            </select>
                        </div>
                    </div>
                </div>
            ) : null}
        </aside>
    );
}
