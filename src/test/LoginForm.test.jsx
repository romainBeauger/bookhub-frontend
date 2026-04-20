import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginForm from '../components/AuthPage/LoginForm.jsx'

// 1) Mock du service authService
vi.mock('../services/authService.js', () => ({
    login: vi.fn()
}))

// 2) Mock du contexte AuthContext
const mockLogin = vi.fn()
vi.mock('../context/AuthContext.jsx', () => ({
    useAuth: () => ({ login: mockLogin })
}))

// 3) Mock de useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

// 3) Import du mock APRÈS vi.mock
import { login as loginApi } from '../services/authService.js'

// 4) Fonction utilitaire
const renderLoginForm = () => {
    return render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>
    )
}

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // --- TEST 1 : le formulaire s'affiche ---
    it('affiche tous les champs du formulaire', () => {
        renderLoginForm()

        expect(screen.getByPlaceholderText('Entrez votre email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Entrez votre mot de passe')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    })

    // --- TEST 2 : erreurs sur formulaire vide ---
    it('affiche les erreurs si le formulaire est soumis vide', async () => {
        const user = userEvent.setup()
        renderLoginForm()

        await user.click(screen.getByRole('button', { name: /se connecter/i }))

        expect(screen.getByText('Le mail est obligatoire')).toBeInTheDocument()
        expect(screen.getByText('Le mot de passe doit faire plus de 8 caractères')).toBeInTheDocument()
    })

    // --- TEST 3 : format email invalide ---
    it('affiche une erreur si le format email est invalide', () => {
        renderLoginForm()

        fireEvent.change(screen.getByPlaceholderText('Entrez votre email'), {
            target: { value: 'email-invalide' }
        })

        fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form'))

        expect(screen.getByText("Le format d'email est incorrect")).toBeInTheDocument()
    })

    // --- TEST 4 : succès ---
    it("appelle loginApi() avec les bonnes données et affiche un toast de succès", async () => {
        // On simule une réponse API réussie
        loginApi.mockResolvedValue({ token: 'fake-token', user: { id: 1, nom: 'Dupont' } })

        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByPlaceholderText('Entrez votre email'), 'jean@mail.com')
        await user.type(screen.getByPlaceholderText('Entrez votre mot de passe'), 'password123')
        await user.click(screen.getByRole('button', { name: /se connecter/i }))

        // Vérif que loginApi() a bien été appelé avec les bonnes données
        expect(loginApi).toHaveBeenCalledWith({
            email: 'jean@mail.com',
            mot_de_passe: 'password123'
        })

        // Vérif que login() du contexte a bien été appelé avec la réponse API
        expect(mockLogin).toHaveBeenCalledWith({ token: 'fake-token', user: { id: 1, nom: 'Dupont' } })

        // Vérif que la navigation vers /books est déclenchée avec le toast en state
        expect(mockNavigate).toHaveBeenCalledWith('/books', {
            state: { toast: { message: 'Connecté avec succès !', type: 'success' } }
        })
    })

    // --- TEST 5 : erreur API ---
    it("affiche l'erreur API en cas d'échec", async () => {
        loginApi.mockRejectedValue(new Error('Identifiants incorrects'))

        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByPlaceholderText('Entrez votre email'), 'jean@mail.com')
        await user.type(screen.getByPlaceholderText('Entrez votre mot de passe'), 'password123')
        await user.click(screen.getByRole('button', { name: /se connecter/i }))

        expect(await screen.findByText('Identifiants incorrects', { selector: 'p' })).toBeInTheDocument()
    })

})