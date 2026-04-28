import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from '../components/AuthPage/RegisterForm.jsx'
import LoginForm from '../components/AuthPage/LoginForm.jsx'

export default function AuthPage({ defaultTab = 'login' }) {

    const [activeTab, setActiveTab] = useState(defaultTab)
    const navigate = useNavigate()

    useEffect(() => {
        setActiveTab(defaultTab)
    }, [defaultTab])

    return (
        <div className="min-h-screen flex" style={{ background: "var(--bg-main)" }}>

            {/* Partie gauche — titre centré, illustration collée en bas à gauche */}
            <div
                className="hidden md:flex md:w-1/2 flex-col justify-center relative px-16 overflow-hidden"
                style={{ background: "var(--bg-main)" }}
            >
                {/* Titre centré verticalement */}
                <div>
                    <h1
                        className="text-5xl font-bold mb-4"
                        style={{ color: "var(--text-main)", fontFamily: "Poppins, sans-serif" }}
                    >
                        Bienvenue sur<br />BookHub
                    </h1>
                    <div className="h-px w-100 my-5" style={{ background: "var(--border-soft)" }} />
                    <p className="text-base my-5" style={{ color: "var(--text-muted)" }}>
                        Votre nouvelle bibliothèque communautaire digitale.
                    </p>
                </div>

                {/* Illustration — collée en bas à droite, juste avant le panneau sombre */}
                <div className="absolute bottom-15 right-15">
                    <img
                        src="/accueil.svg"
                        alt="Illustration BookHub"
                        className="w-[500px] object-contain"
                    />
                </div>
            </div>

            {/* Partie droite — formulaire */}
            <div
                className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-14 min-h-screen rounded-l-[60px]"
                style={{ background: "var(--navy)" }}
            >
                {/* Titre mobile uniquement */}
                <div className="md:hidden text-center mb-8">
                    <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Bienvenue sur BookHub
                    </h1>
                    <p className="text-white/60 mt-2 text-sm">
                        Votre bibliothèque communautaire digitale.
                    </p>
                </div>

                {/* Onglets — 20px comme Mathilde */}
                <div className="flex border-b border-white/15 mb-10">
                    <button
                        onClick={() => navigate('/login')}
                        className={`flex-1 pb-4 font-medium transition-colors cursor-pointer ${
                            activeTab === 'login' ? 'text-white' : 'text-white/45 hover:text-white/70'
                        }`}
                        style={{
                            fontSize: "20px",
                            ...(activeTab === 'login' ? { borderBottom: `2px solid var(--tangerine)` } : {}),
                        }}
                    >
                        Se connecter
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className={`flex-1 pb-4 font-medium transition-colors cursor-pointer ${
                            activeTab === 'register' ? 'text-white' : 'text-white/45 hover:text-white/70'
                        }`}
                        style={{
                            fontSize: "20px",
                            ...(activeTab === 'register' ? { borderBottom: `2px solid var(--tangerine)` } : {}),
                        }}
                    >
                        S'inscrire
                    </button>
                </div>

                {/* Formulaire */}
                <div>
                    {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
                </div>
            </div>

        </div>
    )
}
