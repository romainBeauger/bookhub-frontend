import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import UserDashboardPage from '../pages/UserDashboardPage.jsx'

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

import { getMyLoans } from '../services/loanService.js'

const renderPage = () =>
    render(<MemoryRouter><UserDashboardPage /></MemoryRouter>)

describe('UserDashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue({
            user: { prenom: 'Jean', email: 'jean@test.com' },
            token: 'fake-token',
            logout: vi.fn()
        })
        getMyLoans.mockResolvedValue([])
    })

    it('affiche le compteur d\'emprunts en cours', async () => {
        getMyLoans.mockResolvedValue([
            {
                id: 1,
                bookTitle: 'Le Hobbit',
                bookId: 1,
                user: { firstName: 'Jean' },
                loanDate: '2024-01-01',
                dueDate: '2025-12-31',
                status: 'ACTIVE',
                isLate: false,
            },
            {
                id: 2,
                bookTitle: 'Dune',
                bookId: 2,
                user: { firstName: 'Jean' },
                loanDate: '2024-01-01',
                dueDate: '2025-12-31',
                status: 'ACTIVE',
                isLate: false,
            },
        ])

        renderPage()

        const labels = await screen.findAllByText('Emprunts en cours')
        expect(labels.length).toBeGreaterThan(0)
        expect(await screen.findByText('2')).toBeInTheDocument()
    })

    it('affiche une alerte rouge si au moins un emprunt est en retard', async () => {
        getMyLoans.mockResolvedValue([{
            id: 1,
            bookTitle: 'Le Hobbit',
            bookId: 1,
            user: { firstName: 'Jean' },
            loanDate: '2024-01-01',
            dueDate: '2024-01-15',
            status: 'OVERDUE',
            isLate: true,
        }])

        renderPage()

        expect(await screen.findByText(/vous avez.*emprunt.*en retard/i)).toBeInTheDocument()
    })

    it('affiche "0 réservation" si pas de réservations', async () => {
        renderPage()

        const labels = await screen.findAllByText('Reservations en attente')
        expect(labels.length).toBeGreaterThan(0)
        expect(await screen.findByText('Aucune réservation en attente.')).toBeInTheDocument()
    })

    it('le lien vers /my-loans est présent', async () => {
        renderPage()

        const link = await screen.findByRole('link', { name: /voir tout/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/my-loans')
    })

    it('le composant se rend sans erreur avec des données vides', async () => {
        renderPage()

        expect(await screen.findByText('Aucun emprunt en cours.')).toBeInTheDocument()
    })


})