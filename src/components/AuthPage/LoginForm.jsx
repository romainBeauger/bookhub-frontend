import { useState } from "react";
import { login as loginApi } from "../../services/authService.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasStaffAccess } from "../../utils/auth.js";

const inputClass = [
    "w-full rounded-xl px-4 py-3 text-sm text-slate-800",
    "placeholder:text-slate-400 outline-none transition-colors",
    "border border-slate-200 focus:border-slate-400 bg-white",
].join(" ");

const inputStyle = {};

const labelClass = "block text-sm font-medium text-white/75 mb-2";

export default function LoginForm() {

    const { login } = useAuth()

    const [dataForm, setDataForm] = useState({
        email: "",
        mot_de_passe: ""
    })

    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)

    const navigate = useNavigate();

    function validate() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const newErrors = {}

        if (dataForm.email.length === 0) {
            newErrors.email = "Le mail est obligatoire"
        } else if (!emailRegex.test(dataForm.email)) {
            newErrors.email = "Le format d'email est incorrect"
        }

        if (dataForm.mot_de_passe.length < 8) {
            newErrors.mot_de_passe = "Le mot de passe doit faire plus de 8 caractères"
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
                const data = await loginApi(dataForm)
                const isStaff = hasStaffAccess(data.user)
                login(data)
                navigate(isStaff ? '/dashboard' : '/my-dashboard', {
                    state: { toast: { message: "Connecté avec succès !", type: "success" } }
                })
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
                <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-white text-sm shadow-lg ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                    {toast.message}
                </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

                {/* Email */}
                <div>
                    <label className={labelClass}>Email ou identifiant</label>
                    <input
                        className={inputClass}
                        style={inputStyle}
                        type="email"
                        name="email"
                        placeholder="votre@email.com"
                        value={dataForm.email}
                        onChange={handleChange}
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-2">{errors.email}</p>}
                </div>

                {/* Mot de passe */}
                <div>
                    <label className={labelClass}>Mot de passe</label>
                    <input
                        className={inputClass}
                        style={inputStyle}
                        type="password"
                        name="mot_de_passe"
                        placeholder="••••••••"
                        value={dataForm.mot_de_passe}
                        onChange={handleChange}
                    />
                    <div className="flex justify-end mt-2">
                        <Link
                            to="/forgot-password"
                            className="text-xs font-medium transition-colors"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                            onMouseEnter={e => e.target.style.color = "white"}
                            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>
                    {errors.mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.mot_de_passe}</p>}
                </div>

                {/* Bouton */}
                <button
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--tangerine)" }}
                    type="submit"
                    disabled={loading}
                >
                    <span className="flex items-center justify-center gap-2">
                        {loading && <img src="/spinner.svg" alt="chargement" className="w-4 h-4" />}
                        Se connecter
                    </span>
                </button>

                {errors.api && <p className="text-red-400 text-sm text-center">{errors.api}</p>}

                <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Pas encore de compte ?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-white hover:opacity-75 transition-opacity"
                    >
                        S'inscrire
                    </Link>
                </p>

            </form>
        </>
    )
}
