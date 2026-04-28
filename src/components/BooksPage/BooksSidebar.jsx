import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasRole, hasStaffAccess } from "../../utils/auth.js";

function getCategoryOption(category) {
    return {
        id: String(category?.id ?? category?._id ?? category?.value ?? ""),
        name: category?.name || category?.label || category?.title || "Categorie",
    };
}

const navLinkClass = ({ isActive }) =>
    `flex items-center rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors ${
        isActive
            ? "bg-white/15 text-white"
            : "text-white/65 hover:text-[#B86A4F]"
    }`;

export default function BooksSidebar({
    categories = [],
    filters = { author: "", categoryId: "", available: "", sort: "random" },
    onFilterChange,
    onResetFilters,
    showFilters = true,
    mobileOpen = false,
    onClose,
}) {
    const { user } = useAuth();
    const isAdmin = hasRole(user, "ROLE_ADMIN");
    const showDashboardLink = hasStaffAccess(user);
    const dashboardLabel = isAdmin ? "Gestion admin" : "Gestion librairie";

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col lg:hidden"
                    style={{ background: "linear-gradient(180deg, #283845 0%, #202C39 100%)" }}
                >
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                        <span className="text-xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                            BookHub
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-white/60 hover:text-white transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-2">
                        <NavLink to="/my-dashboard" onClick={onClose} className={navLinkClass}>Tableau de bord</NavLink>
                        <NavLink to="/books" onClick={onClose} className={navLinkClass}>Catalogue</NavLink>
                        <NavLink to="/my-loans" onClick={onClose} className={navLinkClass}>Emprunts</NavLink>
                        <NavLink to="/mon-compte/reservations" onClick={onClose} className={navLinkClass}>Réservations</NavLink>
                        <NavLink to="/mes-avis" onClick={onClose} className={navLinkClass}>Avis</NavLink>
                        <NavLink to="/profile" onClick={onClose} className={navLinkClass}>Mon profil</NavLink>
                        {showDashboardLink && (
                            <NavLink to="/dashboard" onClick={onClose} className={navLinkClass}>{dashboardLabel}</NavLink>
                        )}
                    </nav>

                </div>
            )}

            {/* Desktop sidebar */}
            <aside
                className="hidden lg:flex flex-col w-[260px] shrink-0 min-h-screen sticky top-0 rounded-tr-[28px] rounded-br-[28px]"
                style={{ background: "linear-gradient(180deg, #283845 0%, #202C39 100%)" }}
            >
                {/* Logo */}
                <div className="px-6 py-7 border-b border-white/10">
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                        BookHub
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                    <NavLink to="/my-dashboard" className={navLinkClass}>Tableau de bord</NavLink>
                    <NavLink to="/books" className={navLinkClass}>Catalogue</NavLink>
                    <NavLink to="/my-loans" className={navLinkClass}>Emprunts</NavLink>
                    <NavLink to="/mon-compte/reservations" className={navLinkClass}>Réservations</NavLink>
                    <NavLink to="/mes-avis" className={navLinkClass}>Avis</NavLink>
                    <NavLink to="/profile" className={navLinkClass}>Mon profil</NavLink>
                    {showDashboardLink && (
                        <NavLink to="/dashboard" className={navLinkClass}>{dashboardLabel}</NavLink>
                    )}
                </nav>

                {/* Filters (BooksPage only) */}
                {showFilters && (
                    <div className="border-t border-white/10 px-4 py-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Filtres</span>
                            <button
                                type="button"
                                onClick={onResetFilters}
                                className="text-xs text-white/40 hover:text-white transition-colors"
                            >
                                Réinitialiser
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-white/55 mb-1.5">Catégorie</label>
                            <select
                                value={filters.categoryId}
                                onChange={(e) => onFilterChange("categoryId", e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white outline-none"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                            >
                                <option value="" className="text-slate-900 bg-white">Toutes les catégories</option>
                                {categories.map((category) => {
                                    const option = getCategoryOption(category);
                                    if (!option.id) return null;
                                    return (
                                        <option key={option.id} value={option.id} className="text-slate-900 bg-white">
                                            {option.name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-white/55 mb-1.5">Disponibilité</label>
                            <select
                                value={filters.available}
                                onChange={(e) => onFilterChange("available", e.target.value)}
                                className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white outline-none"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                            >
                                <option value="" className="text-slate-900 bg-white">Tous</option>
                                <option value="true" className="text-slate-900 bg-white">Disponible</option>
                                <option value="false" className="text-slate-900 bg-white">Indisponible</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-white/55 mb-1.5">Trier par</label>
                            <select
                                value={filters.sort}
                                onChange={(e) => onFilterChange("sort", e.target.value)}
                                className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white outline-none"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                            >
                                <option value="random" className="text-slate-900 bg-white">Aléatoire</option>
                                <option value="asc" className="text-slate-900 bg-white">A-Z</option>
                                <option value="desc" className="text-slate-900 bg-white">Z-A</option>
                            </select>
                        </div>
                    </div>
                )}

            </aside>
        </>
    );
}
