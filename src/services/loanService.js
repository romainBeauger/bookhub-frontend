const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders() {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}

export async function getMyLoans() {
    const response = await fetch(`${API_URL}/api/loans/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
    })
    if(!response.ok) {
        throw new Error('Impossible de charger les emprunts.');
    }
    return response.json();
}

export async function borrowBook(bookId) {
    const response = await fetch(`${API_URL}/api/loans`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bookId }),
    })
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible d\'emprunter ce livre.');
    }
    return response.json();
}