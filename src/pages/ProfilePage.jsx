import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import HeaderComponent from "../components/Header/HeaderComponent.jsx"
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx"
import { getMyProfile, updateMyProfile, updateMyPassword, deleteMyProfile } from "../services/userService.js"
import { getMyLoans } from "../services/loanService.js"

function getRoleLabel(roles = []) {
    if (roles.includes('ROLE_ADMIN')) return 'Administrateur'
    if (roles.includes('ROLE_LIBRARIAN')) return 'Bibliothécaire'
    return 'Lecteur'
}

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [navOpen, setNavOpen] = useState(false)

    const [profile, setProfile] = useState(null)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [loansCount, setLoansCount] = useState(0)

    const [profileForm, setProfileForm] = useState({ prenom: '', nom: '', email: '' })
    const [profileError, setProfileError] = useState(null)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)

    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [passwordError, setPasswordError] = useState(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)

    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        getMyProfile()
            .then(data => {
                setProfile(data)
                setProfileForm({ prenom: data.prenom ?? '', nom: data.nom ?? '', email: data.email ?? '' })
            })
            .catch(e => setProfileError(e.message))
            .finally(() => setLoadingProfile(false))

        getMyLoans()
            .then(loans => setLoansCount(loans.length))
            .catch(() => {})
    }, [])

    async function handleProfileSubmit(e) {
        e.preventDefault()
        setSavingProfile(true)
        setProfileError(null)
        setProfileSuccess(false)
        try {
            await updateMyProfile(profileForm)
            setProfileSuccess(true)
        } catch (e) {
            setProfileError(e.message)
        } finally {
            setSavingProfile(false)
        }
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault()
        setPasswordError(null)
        setPasswordSuccess(false)
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas.')
            return
        }
        setSavingPassword(true)
        try {
            await updateMyPassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
            setPasswordSuccess(true)
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (e) {
            setPasswordError(e.message)
        } finally {
            setSavingPassword(false)
        }
    }

    async function handleDelete() {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) return
        setDeleting(true)
        try {
            await deleteMyProfile()
            logout()
            navigate('/login')
        } catch (e) {
            alert(e.message)
            setDeleting(false)
        }
    }

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-[#f2f2f2]">
            <HeaderComponent
                subtitle="Mon profil"
                user={user}
                onMenuToggle={() => setNavOpen(o => !o)}
            />
            <div className="grid lg:grid-cols-[280px_1fr]">
                <BooksSidebar
                    showFilters={false}
                    mobileOpen={navOpen}
                    onClose={() => setNavOpen(false)}
                    onLogout={handleLogout}
                />
                <main className="p-6 space-y-6">

                    {/* Titre + bouton supprimer desktop */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>
                            <p className="text-sm text-slate-500">Vous pouvez modifier les informations de votre profil ici</p>
                        </div>
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-xl border border-red-400 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                                {deleting ? 'Suppression...' : 'Supprimer le profil'}
                            </button>
                        </div>
                    </div>

                    {loadingProfile && <p className="text-slate-500 text-sm">Chargement...</p>}

                    {/* Encart profil */}
                    {!loadingProfile && profile && (
                        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A9 9 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{profile.prenom} {profile.nom}</p>
                                        <p className="text-sm text-slate-500">{profile.email}</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                                      {getRoleLabel(profile.roles)}
                                  </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
                                    <p className="text-xl font-bold text-slate-800">0</p>
                                    <p className="text-xs text-slate-500">réservations</p>
                                </div>
                                <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
                                    <p className="text-xl font-bold text-slate-800">{loansCount}</p>
                                    <p className="text-xs text-slate-500">emprunts</p>
                                </div>
                                <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
                                    <p className="text-xl font-bold text-slate-800">0</p>
                                    <p className="text-xs text-slate-500">avis publiés</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Informations personnelles */}
                    {!loadingProfile && (
                        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                            <h2 className="font-semibold text-slate-700">Informations personnelles</h2>

                            {profileError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{profileError}</p>
                            )}
                            {profileSuccess && (
                                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Profil mis à jour avec succès.</p>
                            )}

                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                                        <input
                                            type="text"
                                            value={profileForm.prenom}
                                            onChange={e => setProfileForm({ ...profileForm, prenom: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                                        <input
                                            type="text"
                                            value={profileForm.nom}
                                            onChange={e => setProfileForm({ ...profileForm, nom: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Mail</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        {savingProfile ? 'Enregistrement...' : 'Modifier'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {/* Mot de passe */}
                    {!loadingProfile && (
                        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                            <h2 className="font-semibold text-slate-700">Modifier votre mot de passe</h2>

                            {passwordError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</p>
                            )}
                            {passwordSuccess && (
                                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Mot de passe modifié avec succès.</p>
                            )}

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        {savingPassword ? 'Enregistrement...' : 'Mettre à jour'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {/* Bouton supprimer mobile */}
                    {!loadingProfile && (
                        <div className="flex flex-col gap-3 md:hidden pb-4">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="w-full rounded-xl border border-red-400 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                                {deleting ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    )}

                </main>
            </div>
        </div>
    )
}