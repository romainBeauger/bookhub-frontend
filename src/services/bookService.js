export const getBooks = async ({ page = 1, limit = 10 } = {}) => {
    const token = sessionStorage.getItem("token");
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    const response = await fetch(`/api/books?${params.toString()}`, {
        method: "GET",
        headers: token
            ? {
                Authorization: `Bearer ${token}`,
            }
            : undefined,
    })

    if (!response.ok) {
        let errorData = null

        try {
            errorData = await response.json()
        } catch {
            errorData = null
        }

        if (response.status === 401) {
            throw new Error("Session expirée ou accès non autorisé.")
        }

        throw new Error(errorData?.message || "Une erreur est survenue")
    }

    else {
        return await response.json()
    }
}

export const getBookById = async (bookId) => {
    const token = sessionStorage.getItem("token");
    const response = await fetch(`/api/books/${bookId}`, {
        method: "GET",
        headers: token
            ? {
                Authorization: `Bearer ${token}`,
            }
            : undefined,
    })

    if (!response.ok) {
        let errorData = null

        try {
            errorData = await response.json()
        } catch {
            errorData = null
        }

        if (response.status === 401) {
            throw new Error("Session expirée ou accès non autorisé.")
        }

        if (response.status === 404) {
            throw new Error("Livre introuvable.")
        }

        throw new Error(errorData?.message || "Une erreur est survenue")
    }

    return await response.json()
}
