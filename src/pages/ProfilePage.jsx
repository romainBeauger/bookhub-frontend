import { useEffect, useState }  from "react"
import {useAuth} from "../context/AuthContext.jsx";
import HeaderComponent from "../components/Header/HeaderComponent.jsx";
import BooksSidebar from "../components/BooksPage/BooksSidebar.jsx";
import { getMyProfile, updateMyPassword } from "../services/userService.js";

export default function ProfilePage() {

    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false)

    //Infos profil
    const [profile, setProfile] = useState(null)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [profileError, setProfileError] = useState(null)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [profileForm, setProfileForm] = useState({ prenom: '', nom: '', email: '' });
    const [savingProfile, setSavingProfile] = useState(false)

    // Mot de passe
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        getMyProfile()
            .then(data => {
                setProfile(data)
                setProfileForm({
                    prenom: data.prenom ?? '',
                    nom: data.nom ?? '',
                    email: data.email ?? '',
                })
            })
            .catch(e => setProfileError(e.message))
            .finally(() => setLoadingProfile(false))
    }, [])

    async function handleProfileSubmit(e) {
        e.preventDefault()
        setPasswordError(null)
        setPasswordSuccess(false)
        if(passwordForm.newPassword !== passwordForm.confirmPassword){
            setPasswordError('Les mots de passe ne correspondent pas.');
            return;
        }
        setSavingPassword(true)
        try {
            await updateMyPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            setPasswordSuccess(true)
            setPasswordError({ currentPassword: '', newPassword: '', confirmPassword: '' })
        }
        catch (e) {
            setPasswordError(e.message)
        }
        finally {
            setSavingPassword(false)
        }
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas.');
            return;
        }
        setSavingPassword(true);
        try {
            await updateMyPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordSuccess(true);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e) {
            setPasswordError(e.message);
        } finally {
            setSavingPassword(false);
        }
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
                />
                <main className="p-6 space-y-6">

                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>
                        <p className="text-sm text-slate-500">Gérez vos informations personnelles</p>
                    </div>

                    {loadingProfile && <p className="text-slate-500 text-sm">Chargement...</p>}

                    {/* Section infos personnelles */}

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
                                <div className="grid md:grid-cols-2 gap-4">

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                                        <input
                                            type="text"
                                            value={profileForm.prenom}
                                            onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                                        <input
                                            type="text"
                                            value={profileForm.nom}
                                            onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                        className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                                >
                                    {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </button>

                            </form>
                        </section>
                    )}


                    {/* Section mot de passe */}
                    {!loadingProfile && (
                        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                            <h2 className="font-semibold text-slate-700">Changer le mot de passe</h2>

                            {passwordError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</p>
                            )}
                            {passwordSuccess && (
                                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Mot de passe modifié avec succès.</p>
                            )}

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingPassword}
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                                >
                                    {savingPassword ? 'Enregistrement...' : 'Changer le mot de passe'}
                                </button>
                            </form>
                        </section>
                    )}

                </main>
            </div>
        </div>
    )
};
