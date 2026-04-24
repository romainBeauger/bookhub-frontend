function getAuthHeaders() {
    const token = sessionStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function parseJsonResponse(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function getErrorMessage(errorData, fallbackMessage) {
    return errorData?.message || errorData?.error || fallbackMessage;
}

async function request(url, options, fallbackMessage, errorMessages = {}) {
    let response;

    try {
        response = await fetch(url, options);
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        if (errorMessages[response.status]) {
            throw new Error(getErrorMessage(responseData, errorMessages[response.status]));
        }

        throw new Error(getErrorMessage(responseData, fallbackMessage));
    }

    return responseData;
}

export async function getAdminUsers() {
    return request(
        "/api/admin/users",
        {
            method: "GET",
            headers: getAuthHeaders(),
        },
        "Impossible de charger les utilisateurs.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour consulter les utilisateurs.",
        }
    );
}

export async function createAdminUser(payload) {
    return request(
        "/api/admin/users",
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        },
        "Impossible de creer cet utilisateur.",
        {
            400: "Les informations de creation sont invalides.",
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour creer un utilisateur.",
        }
    );
}

export async function updateAdminUser(userId, payload) {
    return request(
        `/api/admin/users/${userId}`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        },
        "Impossible de modifier cet utilisateur.",
        {
            400: "Les informations de mise a jour sont invalides.",
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour modifier cet utilisateur.",
            404: "Utilisateur introuvable.",
        }
    );
}

export async function suspendAdminUser(userId, duration) {
    return request(
        `/api/admin/users/${userId}/suspend`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                duree_jours: duration,
                duration,
                durationDays: duration,
            }),
        },
        "Impossible de suspendre cet utilisateur.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour suspendre cet utilisateur.",
            404: "Utilisateur introuvable.",
            409: "Cette suspension est impossible dans l'etat actuel.",
        }
    );
}

export async function unsuspendAdminUser(userId) {
    return request(
        `/api/admin/users/${userId}/unsuspend`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
        },
        "Impossible de retirer la suspension de cet utilisateur.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour modifier cet utilisateur.",
            404: "Utilisateur introuvable.",
            409: "Cette operation est impossible dans l'etat actuel.",
        }
    );
}

export async function deleteAdminUser(userId) {
    return request(
        `/api/admin/users/${userId}`,
        {
            method: "DELETE",
            headers: getAuthHeaders(),
        },
        "Impossible de supprimer cet utilisateur.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour supprimer cet utilisateur.",
            404: "Utilisateur introuvable.",
            409: "Cette suppression est impossible dans l'etat actuel.",
        }
    );
}
