import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function getUserDisplayName(user) {
    if (!user) return "Mon espace";
    const fullName = [user.firstName, user.prenom, user.lastName, user.nom]
        .filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    return user.name || user.username || user.pseudo || user.email || "Mon espace";
}

function getRoleLabel(user) {
    const roles = user?.roles || [];
    if (roles.includes('ROLE_ADMIN')) return 'Espace administrateur(-rice)';
    if (roles.includes('ROLE_LIBRARIAN')) return 'Espace bibliothécaire';
    return 'Espace lecteur';
}

function getInitials(user) {
    const prenom = user?.prenom || user?.firstName || "";
    const nom = user?.nom || user?.lastName || "";
    const initials = `${prenom[0] || ""}${nom[0] || ""}`.toUpperCase();
    return initials || "?";
}

export default function HeaderComponent({ user, onMenuToggle }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const userName = getUserDisplayName(user);
    const roleLabel = getRoleLabel(user);
    const initials = getInitials(user);

    useEffect(() => {
        if (!menuOpen) return;
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <header
            className="flex items-center justify-between gap-4 px-6 py-3 border-b shrink-0"
            style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-soft)",
                minHeight: "64px",
            }}
        >
            {/* Burger mobile */}
            {onMenuToggle && (
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="lg:hidden rounded-lg p-2 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            )}

            <div className="flex-1" />

            {/* Right side */}
            <div className="flex items-center gap-4">

                {/* Pill rôle */}
                <span
                    className="hidden sm:inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap"
                    style={{ background: "var(--bg-accent)", color: "var(--text-main)" }}
                >
                    {roleLabel}
                </span>

                {/* Cloche de notification */}
                <button
                    type="button"
                    className="relative p-2 rounded-full transition-colors hover:bg-black/5"
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Notifications"
                >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span
                        className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: "var(--tangerine)" }}
                    >
                        1
                    </span>
                </button>

                {/* Avatar + dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen(o => !o)}
                        className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-black/5"
                    >
                        <div className="hidden sm:block text-right">
                            <p className="text-xs leading-none mb-0.5" style={{ color: "var(--text-muted)" }}>Bonjour</p>
                            <p className="text-sm font-semibold leading-none" style={{ color: "var(--text-main)" }}>{userName}</p>
                        </div>
                        <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                            style={{ background: "var(--tangerine)" }}
                        >
                            {initials}
                        </div>
                    </button>

                    {/* Menu déroulant */}
                    {menuOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-lg z-50 overflow-hidden"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-medium)" }}
                        >
                            <Link
                                to="/profile"
                                onClick={() => setMenuOpen(false)}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-black/5"
                                style={{ color: "var(--text-main)" }}
                            >
                                Gérer mon profil
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-red-50"
                                style={{ color: "var(--danger-fg)" }}
                            >
                                Se déconnecter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
