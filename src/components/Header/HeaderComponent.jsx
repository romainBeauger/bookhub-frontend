function getUserDisplayName(user) {
    if (!user) {
        return "Mon espace";
    }

    const fullName = [user.firstName, user.prenom, user.lastName, user.nom]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (fullName) {
        return fullName;
    }

    return (
        user.name ||
        user.username ||
        user.pseudo ||
        user.email ||
        "Mon espace"
    );
}

export default function HeaderComponent({ subtitle, user }) {
    const userName = getUserDisplayName(user);

    return (
        <header className="border-b-2 border-violet-500 px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-lime-300 via-cyan-400 to-violet-500 text-lg font-bold text-white">
                        B
                    </div>
                    <div>
                        <div className="text-[2.1rem] font-semibold leading-none text-slate-950">
                            BookHub
                        </div>
                        <p className="text-sm text-slate-500">{subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start lg:self-auto">
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800">
                        {userName}
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-700 text-slate-700">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21a8 8 0 0 0-16 0" />
                            <circle cx="12" cy="8" r="4" />
                        </svg>
                    </div>
                </div>
            </div>
        </header>
    );
}
