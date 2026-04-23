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

async function request(url, fallbackMessage, errorMessages = {}) {
    let response;

    try {
        response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });
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

export async function getLoanStats() {
    return request(
        "/api/stats/loans",
        "Impossible de charger les statistiques d'emprunts.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour consulter les statistiques d'emprunts.",
        }
    );
}

export async function getCatalogueStats() {
    return request(
        "/api/stats/catalogue",
        "Impossible de charger les statistiques du catalogue.",
        {
            401: "Session expiree ou acces non autorise.",
            403: "Vous n'avez pas les droits pour consulter les statistiques du catalogue.",
        }
    );
}
