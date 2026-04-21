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

export async function getMyLoans() {
    let response;

    try {
        response = await fetch("/api/loans/me", {
            method: "GET",
            headers: getAuthHeaders(),
        });
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Session expiree ou acces non autorise.");
        }

        throw new Error(getErrorMessage(responseData, "Impossible de charger les emprunts."));
    }

    return responseData || [];
}

export async function getAllLoans() {
    let response;

    try {
        response = await fetch("/api/loans", {
            method: "GET",
            headers: getAuthHeaders(),
        });
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Session expiree ou acces non autorise.");
        }

        if (response.status === 403) {
            throw new Error("Vous n'avez pas les droits pour consulter les emprunts.");
        }

        throw new Error(getErrorMessage(responseData, "Impossible de charger les emprunts."));
    }

    return responseData || [];
}

export async function borrowBook(bookId) {
    let response;

    try {
        response = await fetch("/api/loans", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ bookId }),
        });
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Session expiree ou acces non autorise.");
        }

        throw new Error(getErrorMessage(responseData, "Impossible d'emprunter ce livre."));
    }

    return responseData;
}

export async function returnBook(loanId) {
    let response;

    try {
        response = await fetch(`/api/loans/${loanId}/return`, {
            method: "PATCH",
            headers: getAuthHeaders(),
        });
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Session expiree ou acces non autorise.");
        }

        throw new Error(getErrorMessage(responseData, "Impossible de rendre ce livre."));
    }

    return responseData;
}

export async function validateReturn(loanId) {
    let response;

    try {
        response = await fetch(`/api/loans/${loanId}/validate-return`, {
            method: "PATCH",
            headers: getAuthHeaders(),
        });
    } catch {
        throw new Error("Impossible de contacter le serveur.");
    }

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Session expiree ou acces non autorise.");
        }

        throw new Error(getErrorMessage(responseData, "Impossible de valider ce retour."));
    }

    return responseData;
}
