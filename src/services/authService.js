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

function normalizeLoginPayload(payload) {
    const token = payload?.token || payload?.access_token || payload?.jwt;
    const user = payload?.user || payload?.utilisateur || null;

    if (!token) {
        throw new Error("La reponse de connexion ne contient pas de token.");
    }

    return {
        ...payload,
        token,
        user,
    };
}

export const register = async (userData) => {
    let response;

    try {
        response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(getErrorMessage(responseData, "Une erreur est survenue"));
    }

    return responseData;
};

export const login = async (userData) => {
    let response;

    try {
        response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(getErrorMessage(responseData, "Une erreur est survenue"));
    }

    return normalizeLoginPayload(responseData);
};
