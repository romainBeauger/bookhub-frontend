import {useState} from "react";
import {login as loginApi} from "../../services/authService.js";
import {Link, useNavigate} from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"


export default function LoginForm() {

    const { login } = useAuth()

    const [dataForm, setDataForm] = useState({
        email: "",
        mot_de_passe: ""
    })

    const[errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)

    const navigate = useNavigate();

    function validate() {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const newErrors = {}

        // console.log("dataForm au moment de validate :", dataForm)

        if(dataForm.email.length === 0){
            newErrors.email = "Le mail est obligatoire"
        }

        else if(emailRegex.test(dataForm.email) === false ){
            newErrors.email = "Le format d'email est incorrect"
        }

        if(dataForm.mot_de_passe.length < 8 ){
            newErrors.mot_de_passe = "Le mot de passe doit faire plus de 8 caractères"
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
                const data = await loginApi(dataForm)
                // console.log("data reçu de l'API :", data)
                login(data)
                setToast({ message: "Connecté avec succès !", type: "success" })
                setTimeout(() => navigate('/books'), 2000)
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
                <div className={`fixed top-5 right-5 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                    {toast.message}
                </div>
            )}

            <form
                className="flex flex-col gap-4 mt-5"
                onSubmit={handleSubmit}>

                <div className="w-full">
                    <input
                        className={"border border-gray-500 rounded-lg px-3 py-2 w-full"}
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Entrez votre email"
                        value={dataForm.email}
                        onChange={handleChange}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="w-full mt-3">
                    <input
                        className={"border border-gray-500 rounded-lg px-3 py-2 w-full"}
                        type="password"
                        name="mot_de_passe"
                        id="mot_de_passe"
                        placeholder="Entrez votre mot de passe"
                        value={dataForm.mot_de_passe}
                        onChange={handleChange}
                    />
                    <Link to="/forgot-password" className="flex justify-end text-sm mt-3 cursor-pointer text-sky-400 font-semibold hover:text-sky-500">Mot de passe oublié ?</Link>
                    {errors.mot_de_passe && <p className="text-red-500 text-sm mt-1">{errors.mot_de_passe}</p>}
                </div>

                <button
                    className="mt-3 border border-gray-500 px-3 py-2 w-full rounded-lg p-2 cursor-pointer hover:bg-(--color-primary) transition-colors duration-300"
                    type="submit"
                    disabled={loading}
                >
                            <span className="flex items-center justify-center gap-2">
                                {loading && <img src="/spinner.svg" alt="chargement" className="w-5 h-5" />}
                                Se connecter
                            </span>
                </button>

                {errors.api && <p className="text-red-500 text-sm text-center">{errors.api}</p>}

                <div className="flex items-center gap-4 mt-3">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-black text-sm">ou</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <p className="mt-3">Pas encore de compte ? <Link to="/register" className=" cursor-pointer text-sky-400 hover:text-sky-500 font-semibold">S'inscrire</Link> </p>

            </form>

        </>
    )
};
