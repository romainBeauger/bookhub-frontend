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

    const [profileForm, setProfileForm] = useState({ prenom: '', nom: '', email: '', phone: '' })
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
                setProfileForm({ prenom: data.prenom ?? '', nom: data.nom ?? '', email: data.email ?? '', phone: data.phone ?? '' })
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
        <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
            <BooksSidebar
                showFilters={false}
                mobileOpen={navOpen}
                onClose={() => setNavOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <HeaderComponent
                    user={user}
                    onMenuToggle={() => setNavOpen(o => !o)}
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
                        <section className="rounded-2xl p-5 space-y-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white text-sm" style={{ background: "var(--tangerine)" }}>
                                        {(profile.prenom?.[0] || "").toUpperCase()}{(profile.nom?.[0] || "").toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{profile.prenom} {profile.nom}</p>
                                        <p className="text-sm text-slate-500">{profile.email}</p>
                                    </div>
                                </div>
                                <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: "var(--bg-accent)", color: "var(--tangerine)" }}>
                                    {getRoleLabel(profile.roles)}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl px-4 py-3 text-center" style={{ background: "var(--bg-accent)" }}>
                                    <p className="text-xl font-bold" style={{ color: "var(--tangerine)" }}>0</p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>réservations</p>
                                </div>
                                <div className="rounded-xl px-4 py-3 text-center" style={{ background: "var(--bg-accent)" }}>
                                    <p className="text-xl font-bold" style={{ color: "var(--tangerine)" }}>{loansCount}</p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>emprunts</p>
                                </div>
                                <div className="rounded-xl px-4 py-3 text-center" style={{ background: "var(--bg-accent)" }}>
                                    <p className="text-xl font-bold" style={{ color: "var(--tangerine)" }}>0</p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>avis publiés</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Informations personnelles */}
                    {!loadingProfile && (
                        <section className="rounded-2xl p-6 space-y-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" }}>
                            <h2 className="font-semibold" style={{ color: "var(--text-main)" }}>Informations personnelles</h2>

                            {profileError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{profileError}</p>
                            )}
                            {profileSuccess && (
                                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Profil mis à jour avec succès.</p>
                            )}

                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                        <input
                                            type="tel"
                                            value={profileForm.phone}
                                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            placeholder="Optionnel"
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
                        <section className="rounded-2xl p-6 space-y-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" }}>
                            <h2 className="font-semibold" style={{ color: "var(--text-main)" }}>Modifier votre mot de passe</h2>

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