import { useState, useEffect } from "react";
import { register } from "../../services/authService.js";
import { useNavigate } from 'react-router-dom'

const inputClass = [
    "w-full rounded-xl px-4 py-3 text-sm text-slate-800",
    "placeholder:text-slate-400 outline-none transition-colors",
    "border border-slate-200 focus:border-slate-400 bg-white",
].join(" ");

const inputStyle = {};

export default function RegisterForm() {

    const navigate = useNavigate()

    const [dataForm, setDataForm] = useState({
        nom: "",
        prenom: "",
        email: "",
        phone: "",
        mot_de_passe: "",
        confirmation: "",
    })

    const [errors, setErrors] = useState({})
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

        if (dataForm.nom.length === 0) newErrors.nom = "Le nom est obligatoire"
        if (dataForm.prenom.length === 0) newErrors.prenom = "Le prénom est obligatoire"

        if (dataForm.email.length === 0) {
            newErrors.email = "Le mail est obligatoire"
        } else if (!emailRegex.test(dataForm.email)) {
            newErrors.email = "Le format d'email est incorrect"
        }

        if (dataForm.mot_de_passe.length < 8) {
            newErrors.mot_de_passe = "Le mot de passe doit faire plus de 8 caractères"
        }

        if (dataForm.confirmation !== dataForm.mot_de_passe) {
            newErrors.confirmation = "Les deux mots de passe doivent être identiques"
        }

        return newErrors
    }

    function handleChange(e) {
        setDataForm({ ...dataForm, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()

        const newErrors = validate()
        setErrors(newErrors)

        if (Object.keys(newErrors).length === 0) {
            setLoading(true)
            try {
                await register(dataForm)
                setToast({ message: "Compte créé avec succès !", type: "success" })
                setTimeout(() => navigate('/login'), 2000)
            } catch (error) {
                setErrors({ api: error.message })
                setToast({ message: error.message || "Une erreur est survenue", type: "error" })
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <>
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white shadow-lg transition-all ${
                    toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}>
                    {toast.message}
                </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

                <input
                    className={inputClass}
                    style={inputStyle}
                    type="text"
                    name="nom"
                    placeholder="Nom"
                    value={dataForm.nom}
                    onChange={handleChange}
                />
                {errors.nom && <p className="text-red-400 text-xs -mt-3">{errors.nom}</p>}

                <input
                    className={inputClass}
                    style={inputStyle}
                    type="text"
                    name="prenom"
                    placeholder="Prénom"
                    value={dataForm.prenom}
                    onChange={handleChange}
                />
                {errors.prenom && <p className="text-red-400 text-xs -mt-3">{errors.prenom}</p>}

                <input
                    className={inputClass}
                    style={inputStyle}
                    type="tel"
                    name="phone"
                    placeholder="Téléphone (optionnel)"
                    value={dataForm.phone}
                    onChange={handleChange}
                />

                <input
                    className={inputClass}
                    style={inputStyle}
                    type="email"
                    name="email"
                    placeholder="Adresse email"
                    value={dataForm.email}
                    onChange={handleChange}
                />
                {errors.email && <p className="text-red-400 text-xs -mt-3">{errors.email}</p>}

                <input
                    className={inputClass}
                    style={inputStyle}
                    type="password"
                    name="mot_de_passe"
                    placeholder="Mot de passe"
                    value={dataForm.mot_de_passe}
                    onChange={handleChange}
                />
                {errors.mot_de_passe && <p className="text-red-400 text-xs -mt-3">{errors.mot_de_passe}</p>}

                <p className="text-xs -mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                    12 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial.
                </p>

                <input
                    className={inputClass}
                    style={inputStyle}
                    type="password"
                    name="confirmation"
                    placeholder="Confirmer le mot de passe"
                    value={dataForm.confirmation}
                    onChange={handleChange}
                />
                {errors.confirmation && <p className="text-red-400 text-xs -mt-3">{errors.confirmation}</p>}

                {errors.api && <p className="text-red-400 text-sm text-center">{errors.api}</p>}

                <button
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--tangerine)" }}
                    type="submit"
                    disabled={loading}
                >
                    <span className="flex items-center justify-center gap-2">
                        {loading && <img src="/spinner.svg" alt="chargement" className="w-4 h-4" />}
                        S'inscrire
                    </span>
                </button>

            </form>
        </>
    )
}
