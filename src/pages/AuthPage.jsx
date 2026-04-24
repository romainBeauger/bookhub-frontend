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
        <div className="min-h-screen flex">

            {/* Partie gauche - visible uniquement desktop */}
            <div className="hidden md:flex md:w-1/2 flex-col justify-center px-16 bg-white">
                <h1 className="text-4xl font-bold mb-4">Bienvenue sur BookHub</h1>
                <p className="text-gray-500">
                    Lorem ipsum dolor sit amet, consectetur Aelit.
                    Nullam id posuere sem.
                </p>
            </div>

            {/* Partie droite - formulaire */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-gray-100 min-h-screen max-h-105 rounded-l-[75px]">

                {/* Titre mobile uniquement */}
                <div className="md:hidden text-center mb-8">
                    <h1 className="text-3xl font-bold">Bienvenue sur BookHub</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Lorem ipsum dolor sit amet, consectetur Aelit.
                        Nullam id posuere sem.
                    </p>
                </div>

                {/* Onglets + Formulaire dans un bloc de hauteur fixe */}
                <div className="h-[420px]">

                    {/* Onglets */}
                    <div className="flex border-b border-gray-300 mb-8">
                        <button
                            onClick={() => navigate('/login')}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors cursor-pointer ${
                                activeTab === 'login'
                                    ? 'border-b-2 border-sky-400 text-sky-400'
                                    : 'text-gray-500'
                            }`}
                        >
                            Connexion
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors cursor-pointer ${
                                activeTab === 'register'
                                    ? 'border-b-2 border-sky-400 text-sky-400'
                                    : 'text-gray-500'
                            }`}
                        >
                            Inscription
                        </button>
                    </div>

                    {/* Formulaire actif */}
                    <div>
                        {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
                    </div>

                </div>

            </div>

        </div>
    )
};
