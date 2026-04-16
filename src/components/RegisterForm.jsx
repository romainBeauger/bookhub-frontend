import { useState, useEffect } from "react";
import { register } from "../services/authService.js";
import { useNavigate } from 'react-router-dom'

export default function RegisterForm() {

    const navigate = useNavigate()

    const [dataForm, setDataForm] = useState({
        nom: "",
        prenom: "",
        email: "",
        mot_de_passe: "",
        confirmation: "",
    })
    
    const[errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(null), 3000)
        return () => clearTimeout(timer)
    }, [toast])

    function validate() {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const newErrors = {}

        console.log("dataForm au moment de validate :", dataForm)

        if(dataForm.nom.length === 0){
            newErrors.nom = "Le nom est obligatoire"
        }

        if(dataForm.prenom.length === 0){
            newErrors.prenom = "Le prénom est obligatoire"
        }

        if(dataForm.email.length === 0){
            newErrors.email = "Le mail est obligatoire"
        }

        else if(emailRegex.test(dataForm.email) === false ){
            newErrors.email = "Le format d'email est incorrect"
        }

        if(dataForm.mot_de_passe.length < 8 ){
            newErrors.mot_de_passe = "Le mot de passe doit faire plus de 8 caractères"
        }

        if(dataForm.confirmation !== dataForm.mot_de_passe){
            newErrors.confirmation = "Les deux mots de passe doivent être identiques"
        }

        return newErrors
    }

    function handleChange(e) {
        setDataForm({...dataForm, [e.target.name]: e.target.value})
    }

    async function handleSubmit(e) {
        e.preventDefault()

        const newErrors = validate()
        setErrors(newErrors)

        // Si l'objet est vide, pas d'erreurs on peut appeler l'api
        if(Object.keys(newErrors).length === 0) {
            setLoading(true)
            try {
                await register(dataForm)
                setToast({ message: "Compte créé avec succès !", type: "success" })
                setTimeout(() => navigate('/login'), 2000)
            }
            catch(error) {
                // erreur API -> afficher le message
                setErrors({ api: error.message })
                setToast({ message: error.message || "Une erreur est survenue", type: "error" })
            }
            finally {
                setLoading(false)
            }
        }
    }


    return (
        <>
            {toast && (
                <div className={`fixed top-6 right-6 px-5 py-3 rounded-lg text-white shadow-lg transition-all ${
                    toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}>
                    {toast.message}
                </div>
            )}

            <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit}>

                    <div className="flex justify-around items-center gap-4 ">

                        <div className="flex-1">
                            <input
                                className={"border border-gray-500 rounded-lg px-3 py-2 w-full"}
                                type="text"
                                name="nom"
                                id="nom"
                                placeholder="Saisissez votre nom"
                                value={dataForm.nom}
                                onChange={handleChange}
                            />
                            {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                        </div>

                        <div className="flex-1">
                            <input
                                className="border border-gray-500 rounded-lg px-3 py-2 w-full"
                                type="text"
                                name="prenom"
                                placeholder="Saisissez votre prénom"
                                value={dataForm.prenom}
                                onChange={handleChange}
                            />
                            {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
                        </div>
                    </div>

                    <div className="w-full">
                        <input
                            className={"border border-gray-500 rounded-lg px-3 py-2 w-full"}
                            type="email"
                            name="email"
                            id="email"
                            placeholder="email"
                            value={dataForm.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div className="w-full">
                        <input
                            className={"border border-gray-500 rounded-lg px-3 py-2 w-full"}
                            type="password"
                            name="mot_de_passe"
                            id="mot_de_passe"
                            placeholder="Entrez votre mot de passe"
                            value={dataForm.mot_de_passe}
                            onChange={handleChange}
                        />
                        {errors.mot_de_passe && <p className="text-red-500 text-sm mt-1">{errors.mot_de_passe}</p>}
                    </div>

                    <div className="w-full">
                        <input
                            className={"border border-gray-500 rounded-lg px-3 py-2 w-full"}
                            type="password"
                            name="confirmation"
                            id="confirmation"
                            placeholder="Confirmez votre mot de passe"
                            value={dataForm.confirmation}
                            onChange={handleChange}
                        />
                        {errors.confirmation && <p className="text-red-500 text-sm mt-1">{errors.confirmation}</p>}
                    </div>

                    <div className="border border-gray-500 rounded-lg px-3 py-2">
                    <h3>Règles mot de passe : </h3>
                    <p className="text-sm pl-5 mt-1">- 8 caractères minimum </p>
                </div>

                    {errors.api && (
                        <p className="text-red-500 text-sm text-center">{errors.api}</p>
                    )}

                    <button
                        className="border border-gray-500 px-3 py-2 w-full rounded-lg p-2 cursor-pointer hover:bg-(--color-primary) transition-colors duration-300"
                        type="submit"
                        disabled={loading}
                    >
                        <span className="flex items-center justify-center gap-2">
                            {loading && <img src="/spinner.svg" alt="chargement" className="w-5 h-5" />}
                            Créer mon compte
                        </span>
                    </button>
            </form>
        </>
    )
};
