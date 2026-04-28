import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RegisterForm from '../components/AuthPage/RegisterForm.jsx'

// 1) On mocke le module authService
vi.mock('../services/authService.js', () => ({
    register: vi.fn()
}))

// 2) On importe le mock APRÈS la déclaration vi.mock
import { register } from '../services/authService.js'

// 3) Fonction utilitaire : rendre le composant dans un MemoryRouter
//    (nécessaire car RegisterForm utilise useNavigate)
const renderRegisterForm = () => {
    return render(
        <MemoryRouter>
            <RegisterForm />
        </MemoryRouter>
    )
}

describe('RegisterForm', () => {

    // Avant chaque test, on remet les mocks à zéro
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // --- TEST 1 : le formulaire s'affiche ---
    it('affiche tous les champs du formulaire', () => {
        renderRegisterForm()

        expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Adresse email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Confirmer le mot de passe')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument()
    })

    // --- TEST 2 : erreurs sur formulaire vide ---
    it('affiche les erreurs si le formulaire est soumis vide', async () => {
        const user = userEvent.setup()
        renderRegisterForm()

        await user.click(screen.getByRole('button', { name: /s'inscrire/i }))

        expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument()
        expect(screen.getByText('Le prénom est obligatoire')).toBeInTheDocument()
        expect(screen.getByText('Le mail est obligatoire')).toBeInTheDocument()
        expect(screen.getByText('Le mot de passe doit faire plus de 8 caractères')).toBeInTheDocument()
    })

    // --- TEST 3 : format email invalide ---
    it('affiche une erreur si le format email est invalide', () => {
        renderRegisterForm()

        fireEvent.change(screen.getByPlaceholderText('Adresse email'), {
            target: { value: 'email-invalide' }
        })

        // On soumet le formulaire directement — bypasse la validation HTML5 native
        fireEvent.submit(screen.getByRole('button', { name: /s'inscrire/i }).closest('form'))

        expect(screen.getByText("Le format d'email est incorrect")).toBeInTheDocument()
    })

    // --- TEST 4 : mots de passe différents ---
    it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
        const user = userEvent.setup()
        renderRegisterForm()

        await user.type(screen.getByPlaceholderText('Mot de passe'), 'password123')
        await user.type(screen.getByPlaceholderText('Confirmer le mot de passe'), 'autrepassword')
        await user.click(screen.getByRole('button', { name: /s'inscrire/i }))

        expect(screen.getByText('Les deux mots de passe doivent être identiques')).toBeInTheDocument()
    })

    // --- TEST 5 : succès ---
    it("appelle register() avec les bonnes données et affiche un toast de succès", async () => {
        // On configure le mock pour qu'il simule un succès
        register.mockResolvedValue({})

        const user = userEvent.setup()
        renderRegisterForm()

        await user.type(screen.getByPlaceholderText('Nom'), 'Dupont')
        await user.type(screen.getByPlaceholderText('Prénom'), 'Jean')
        await user.type(screen.getByPlaceholderText('Adresse email'), 'jean@mail.com')
        await user.type(screen.getByPlaceholderText('Mot de passe'), 'password123')
        await user.type(screen.getByPlaceholderText('Confirmer le mot de passe'), 'password123')
        await user.click(screen.getByRole('button', { name: /s'inscrire/i }))

        // Vérif que register() a bien été appelé avec les bonnes données
        expect(register).toHaveBeenCalledWith({
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean@mail.com',
            mot_de_passe: 'password123',
            confirmation: 'password123',
            phone: ''
        })

        // findByText attend que l'élément apparaisse (async)
        expect(await screen.findByText('Compte créé avec succès !')).toBeInTheDocument()
    })

    // --- TEST 6 : erreur API ---
    it("affiche l'erreur API en cas d'échec", async () => {
        register.mockRejectedValue(new Error('Email déjà utilisé'))
        const user = userEvent.setup()
        renderRegisterForm()

        await user.type(screen.getByPlaceholderText('Nom'), 'Dupont')
        await user.type(screen.getByPlaceholderText('Prénom'), 'Jean')
        await user.type(screen.getByPlaceholderText('Adresse email'), 'jean@mail.com')
        await user.type(screen.getByPlaceholderText('Mot de passe'), 'password123')
        await user.type(screen.getByPlaceholderText('Confirmer le mot de passe'), 'password123')
        await user.click(screen.getByRole('button', { name: /s'inscrire/i }))

        // On cible le <p> spécifiquement (pas le toast <div>)
        expect(await screen.findByText('Email déjà utilisé', { selector: 'p' })).toBeInTheDocument()
    })
})