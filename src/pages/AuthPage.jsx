import { useState } from "react";
import RegisterForm from '../components/RegisterForm'
import LoginForm from '../components/LoginForm'

export default function AuthPage({ defaultTab = 'login' }) {

    const [activeTab, setActiveTab] = useState(defaultTab)

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
            <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-gray-100 min-h-screen">

                {/* Titre mobile uniquement */}
                <div className="md:hidden text-center mb-8">
                    <h1 className="text-3xl font-bold">Bienvenue sur BookHub</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Lorem ipsum dolor sit amet, consectetur Aelit.
                        Nullam id posuere sem.
                    </p>
                </div>

                {/* Onglets */}
                <div className="flex border-b border-gray-300 mb-8">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 pb-3 text-sm font-medium transition-colors cursor-pointer ${
                            activeTab === 'login'
                                ? 'border-b-2 border-sky-400 text-sky-400'
                                : 'text-gray-500'
                        }`}
                    >
                        Connexion
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
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
                {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}

            </div>

        </div>
    )
};
