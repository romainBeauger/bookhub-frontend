import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MyLoanPage from '../pages/MyLoanPage.jsx'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute.jsx'

vi.mock('../services/loanService.js', () => ({
    getMyLoans: vi.fn(),
    borrowBook: vi.fn(),
    returnBook: vi.fn(),
    validateReturn: vi.fn(),
}))

const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext.jsx', () => ({
    useAuth: () => mockUseAuth()
}))

import { getMyLoans } from '../services/loanService.js'

const renderPage = () =>
    render(<MemoryRouter><MyLoanPage /></MemoryRouter>)

describe('MyLoanPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue({
            user: { prenom: 'Jean', email: 'jean@test.com' },
            token: 'fake-token'
        })
    })

    it('renders la liste des emprunts quand l\'API répond avec des données', async () => {
        getMyLoans.mockResolvedValue([{
            id: 1,
            bookTitle: 'Le Seigneur des Anneaux',
            bookId: 1,
            user: { firstName: 'Jean' },
            loanDate: '2024-01-01',
            dueDate: '2025-12-31',
            status: 'ACTIVE',
            isLate: false,
        }])

        renderPage()

        expect(await screen.findByText('Le Seigneur des Anneaux')).toBeInTheDocument()
    })

    it('affiche un message vide si aucun emprunt', async () => {
        getMyLoans.mockResolvedValue([])

        renderPage()

        expect(await screen.findByText('Aucun emprunt en cours.')).toBeInTheDocument()
    })

    it('affiche le badge "En retard" en rouge si is_late = true', async () => {
        getMyLoans.mockResolvedValue([{
            id: 1,
            bookTitle: 'Le Hobbit',
            bookId: 2,
            user: { firstName: 'Jean' },
            loanDate: '2024-01-01',
            dueDate: '2024-01-15',
            status: 'ACTIVE',
            isLate: true,
        }])

        renderPage()

        const badge = await screen.findByText('En retard')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass('text-red-600')
    })

    it('affiche le statut ACTIVE / RETURNED correctement', async () => {
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
                dueDate: '2024-01-15',
                returnedAt: '2024-01-14',
                status: 'RETURNED',
                isLate: false,
            },
        ])

        renderPage()

        expect(await screen.findByText('En cours')).toBeInTheDocument()
        expect(await screen.findByText('Rendu')).toBeInTheDocument()
    })

    it('redirige vers /login si pas de token (ProtectedRoute)', () => {
        mockUseAuth.mockReturnValue({ token: null, user: null })

        render(
            <MemoryRouter initialEntries={['/my-loans']}>
                <Routes>
                    <Route path="/my-loans" element={<ProtectedRoute><MyLoanPage /></ProtectedRoute>} />
                    <Route path="/login" element={<div>Page Login</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('Page Login')).toBeInTheDocument()
    })

    it('affiche un état de chargement pendant le fetch', () => {
        getMyLoans.mockReturnValue(new Promise(() => {}))

        renderPage()

        expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })


})