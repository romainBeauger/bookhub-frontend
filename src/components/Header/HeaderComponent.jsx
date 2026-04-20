import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function getUserDisplayName(user) {
    if (!user) return "Mon espace";
    const fullName = [user.firstName, user.prenom, user.lastName, user.nom]
        .filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    return user.name || user.username || user.pseudo || user.email || "Mon espace";
}

export default function HeaderComponent({ subtitle, user, onMenuToggle }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const userName = getUserDisplayName(user);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <header className="border-b-2 border-violet-500 px-6 py-4">
            <div className="flex items-center justify-between lg:justify-start lg:gap-4">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-lime-300 via-cyan-400 to-violet-500 text-lg font-bold text-white">
                        B
                    </div>
                    <div>
                        <div className="text-[2.1rem] font-semibold leading-none text-slate-950">BookHub</div>
                        <p className="hidden text-sm text-slate-500 lg:block">{subtitle}</p>
                    </div>
                </div>

                {/* Infos user — desktop uniquement */}
                <div className="ml-auto hidden items-center gap-3 lg:flex">
                    <button
                        onClick={handleLogout}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Se déconnecter
                    </button>
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800">
                        {userName}
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-700 text-slate-700">
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21a8 8 0 0 0-16 0" />
                            <circle cx="12" cy="8" r="4" />
                        </svg>
                    </div>
                </div>

                {/* Burger — mobile uniquement */}
                {onMenuToggle && (
                    <button
                        type="button"
                        onClick={onMenuToggle}
                        className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                    >
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}