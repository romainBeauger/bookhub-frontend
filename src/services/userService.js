const API_BASE = "/api"

function getAuthHeaders() {
    const token = sessionStorage.getItem("token");
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers;
}

export async function getMyProfile() {
    const res = await fetch(`${API_BASE}/users/me`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Impossible de charger le profil');
    return res.json();
}

export async function updateMyProfile(data) {
    const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Impossible de mettre à jour le profil');
    return res.json();
}

export async function updateMyPassword(data) {
    const res = await fetch(`${API_BASE}/users/me/password`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            current_password: data.currentPassword,
            new_password: data.newPassword,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Impossible de changer le mot de passe');
    }
    return res.json();
}