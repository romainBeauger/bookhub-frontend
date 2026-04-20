import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasStaffAccess } from "../../utils/auth.js";

function getCategoryOption(category) {
    return {
        id: String(category?.id ?? category?._id ?? category?.value ?? ""),
        name: category?.name || category?.label || category?.title || "Categorie",
    };
}

export default function BooksSidebar({
    categories = [],
    filters = { author: "", categoryId: "", available: "", sort: "random" },
    onFilterChange,
    onResetFilters,
    showFilters = true,
    mobileOpen = false,
    onClose,
                                         onLogout,
}) {
    const { user } = useAuth();
    const showDashboardLink = hasStaffAccess(user);

    return (
        <>
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
                    <div className="flex flex-col items-center gap-2 border-b border-slate-200 px-6 py-8">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-lime-300 via-cyan-400 to-violet-500 text-lg font-bold text-white">
                            B
                        </div>
                        <p className="text-2xl font-bold text-slate-900">BookHub</p>
                        <p className="text-sm text-slate-500">Menu User</p>
                    </div>

                    <nav className="flex flex-col items-center gap-2 px-8 py-6">
                        <NavLink
                            to="/books"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `w-full rounded-xl px-4 py-3 text-center font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                            }
                        >
                            CATALOGUE
                        </NavLink>
                        <NavLink
                            to="/my-loans"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `w-full rounded-xl px-4 py-3 text-center font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                            }
                        >
                            MES EMPRUNTS
                        </NavLink>
                        {showDashboardLink && (
                            <NavLink
                                to="/dashboard"
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `w-full rounded-xl px-4 py-3 text-center font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                                }
                            >
                                DASHBOARD
                            </NavLink>
                        )}
                        <span className="w-full px-4 py-3 text-center font-medium text-slate-400">MES RESERVATIONS</span>
                        <NavLink
                            to="/mes-avis"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `w-full rounded-xl px-4 py-3 text-center font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                            }
                        >
                            MES AVIS
                        </NavLink>
                        <span className="w-full px-4 py-3 text-center text-slate-400">(PROFIL)</span>

                        <span className="w-full px-4 py-3 text-center font-medium text-slate-400">MES RÉSERVATIONS</span>
                        <span className="w-full px-4 py-3 text-center font-medium text-slate-400">MES AVIS</span>
                        <NavLink
                            to="/profile"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `w-full rounded-xl px-4 py-3 text-center font-medium ${isActive ? 'bg-slate-200 text-blue-500' : 'text-slate-950 hover:bg-slate-100'}`
                            }
                        >
                            MON PROFIL
                        </NavLink>

                        {onLogout && (
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-100"
                            >
                                SE DÉCONNECTER
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-2 rounded-xl border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            Retour
                        </button>
                    </nav>
                </div>
            )}

            <aside className="hidden border-r border-slate-300 bg-white lg:block">
                <nav className="border-b border-slate-300 px-5 py-5">
                    <ul className="space-y-2 text-[0.98rem]">
                        <li>
                            <NavLink
                                to="/books"
                                className={({ isActive }) =>
                                    `block rounded-xl px-3 py-2 font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                                }
                            >
                                CATALOGUE
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/my-loans"
                                className={({ isActive }) =>
                                    `block rounded-xl px-3 py-2 font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                                }
                            >
                                MES EMPRUNTS
                            </NavLink>
                        </li>
                        {showDashboardLink && (
                            <li>
                                <NavLink
                                    to="/dashboard"
                                    className={({ isActive }) =>
                                        `block rounded-xl px-3 py-2 font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                                    }
                                >
                                    DASHBOARD
                                </NavLink>
                            </li>
                        )}
                        <li className="px-3 py-1 font-medium text-slate-400">MES RESERVATIONS</li>
                        <li>
                            <NavLink
                                to="/mes-avis"
                                className={({ isActive }) =>
                                    `block rounded-xl px-3 py-2 font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                                }
                            >
                                MES AVIS
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/profile"
                                className={({ isActive }) =>
                                    `block rounded-xl px-3 py-2 font-medium ${isActive ? "bg-slate-200 text-blue-500" : "text-slate-950 hover:bg-slate-100"}`
                                }
                            >
                                MON PROFIL
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                {showFilters && (
                    <div className="space-y-6 px-4 py-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-slate-950">FILTRES</h2>
                            <button type="button" onClick={onResetFilters} className="text-sm font-medium text-sky-600">
                                Reinitialiser
                            </button>
                        </div>

                        <div>
                            <label htmlFor="book-category-filter" className="mb-2 block text-sm font-semibold text-slate-950">
                                Categorie
                            </label>
                            <select
                                id="book-category-filter"
                                value={filters.categoryId}
                                onChange={(e) => onFilterChange("categoryId", e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                            >
                                <option value="">Toutes les categories</option>
                                {categories.map((category) => {
                                    const option = getCategoryOption(category);
                                    if (!option.id) return null;
                                    return <option key={option.id} value={option.id}>{option.name}</option>;
                                })}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="book-availability-filter" className="mb-2 block text-sm font-semibold text-slate-950">
                                Disponibilite
                            </label>
                            <select
                                id="book-availability-filter"
                                value={filters.available}
                                onChange={(e) => onFilterChange("available", e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                            >
                                <option value="">Tous</option>
                                <option value="true">Disponible</option>
                                <option value="false">Indisponible</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="book-sort-filter" className="mb-2 block text-sm font-semibold text-slate-950">
                                Trier par
                            </label>
                            <select
                                id="book-sort-filter"
                                value={filters.sort}
                                onChange={(e) => onFilterChange("sort", e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                            >
                                <option value="random">Aleatoire</option>
                                <option value="asc">A-Z</option>
                                <option value="desc">Z-A</option>
                            </select>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
