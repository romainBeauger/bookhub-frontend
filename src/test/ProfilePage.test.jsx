import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ProfilePage from '../pages/ProfilePage.jsx'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute.jsx'

vi.mock('../services/userService.js', () => ({
    getMyProfile: vi.fn(),
    updateMyProfile: vi.fn(),
    updateMyPassword: vi.fn(),
    deleteMyProfile: vi.fn(),
}))

vi.mock('../services/loanService.js', () => ({
    getMyLoans: vi.fn(),
}))

const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext.jsx', () => ({
    useAuth: () => mockUseAuth()
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

import { getMyProfile, updateMyProfile } from '../services/userService.js'
import { getMyLoans } from '../services/loanService.js'

const fakeProfile = { prenom: 'Jean', nom: 'Dupont', email: 'jean@test.com', roles: ['ROLE_USER'] }

const renderPage = () =>
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue({ user: fakeProfile, token: 'fake-token', logout: vi.fn() })
        getMyProfile.mockResolvedValue(fakeProfile)
        getMyLoans.mockResolvedValue([])
    })

    it('affiche les infos du user connecté (nom, prénom, email)', async () => {
        renderPage()

        expect(await screen.findByText('Jean Dupont')).toBeInTheDocument()
        expect(await screen.findByText('jean@test.com')).toBeInTheDocument()
    })

    it('le formulaire de modification se soumet avec les bonnes données', async () => {
        updateMyProfile.mockResolvedValue({})
        const user = userEvent.setup()

        renderPage()

        const prenomInput = await screen.findByDisplayValue('Jean')
        await user.clear(prenomInput)
        await user.type(prenomInput, 'Pierre')

        await user.click(screen.getByRole('button', { name: /modifier/i }))

        expect(updateMyProfile).toHaveBeenCalledWith({
            prenom: 'Pierre',
            nom: 'Dupont',
            email: 'jean@test.com',
            phone: '',
        })
    })

    it('affiche une erreur si email déjà utilisé (retour API 400)', async () => {
        updateMyProfile.mockRejectedValue(new Error('Cet email est déjà utilisé.'))
        const user = userEvent.setup()

        renderPage()

        await screen.findByDisplayValue('Jean')
        await user.click(screen.getByRole('button', { name: /modifier/i }))

        expect(await screen.findByText('Cet email est déjà utilisé.')).toBeInTheDocument()
    })

    it('le champ "nouveau mot de passe" est masqué par défaut', async () => {
        renderPage()

        await screen.findByText('Jean Dupont')

        const passwordInputs = screen.getAllByDisplayValue('')
        const passwordFields = passwordInputs.filter(input => input.type === 'password')

        expect(passwordFields.length).toBeGreaterThan(0)
    })

    it('affiche un message de succès après modification réussie', async () => {
        updateMyProfile.mockResolvedValue({})
        const user = userEvent.setup()

        renderPage()

        await screen.findByDisplayValue('Jean')
        await user.click(screen.getByRole('button', { name: /modifier/i }))

        expect(await screen.findByText('Profil mis à jour avec succès.')).toBeInTheDocument()
    })

    it('redirige vers /login si pas de token', () => {
        mockUseAuth.mockReturnValue({ token: null, user: null, logout: vi.fn() })

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <Routes>
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/login" element={<div>Page Login</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('Page Login')).toBeInTheDocument()
    })

})