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

export async function createReservation(bookId) {
    return request(
        "/api/reservations",
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ bookId }),
        },
        "Impossible de creer la reservation.",
        {
            400: "Le livre a reserver est manquant.",
            401: "Session expiree ou acces non autorise.",
            404: "Livre introuvable.",
            409: "Impossible de creer la reservation pour ce livre.",
        }
    );
}

export async function getMyReservations() {
    return request(
        "/api/reservations/me",
        {
            method: "GET",
            headers: getAuthHeaders(),
        },
        "Impossible de charger vos reservations.",
        {
            401: "Session expiree ou acces non autorise.",
        }
    );
}

export async function getAllReservations(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.status) {
        searchParams.set("status", params.status);
    }

    if (params.bookId) {
        searchParams.set("bookId", String(params.bookId));
    }

    if (params.userName) {
        searchParams.set("userName", params.userName);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/api/reservations?${queryString}` : "/api/reservations";

    return request(
        url,
        {
            method: "GET",
            headers: getAuthHeaders(),
        },
        "Impossible de charger les reservations.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour consulter les reservations.",
        }
    );
}

export async function markReservationReady(id) {
    return request(
        `/api/reservations/${id}/ready`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
        },
        "Impossible de marquer cette reservation comme prete.",
        {
            401: "Session expiree ou acces non autorise.",
            404: "Reservation introuvable.",
            409: "Transition de reservation invalide.",
        }
    );
}

export async function validateReservation(id) {
    return request(
        `/api/reservations/${id}/validate`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
        },
        "Impossible de valider cette reservation.",
        {
            401: "Session expiree ou acces non autorise.",
            404: "Reservation introuvable.",
            409: "Validation de reservation invalide.",
        }
    );
}

export async function cancelReservation(id) {
    return request(
        `/api/reservations/${id}/cancel`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
        },
        "Impossible d'annuler cette reservation.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour annuler cette reservation.",
            404: "Reservation introuvable.",
            409: "Annulation de reservation invalide.",
        }
    );
}
