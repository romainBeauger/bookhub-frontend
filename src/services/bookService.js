function getAuthHeaders() {
    const token = sessionStorage.getItem("token");

    return token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : undefined;
}

function normalizeBooleanFilter(value) {
    if (value === true || value === "true" || value === "1" || value === 1) {
        return "true";
    }

    if (value === false || value === "false" || value === "0" || value === 0) {
        return "false";
    }

    return "";
}

function appendIfPresent(params, key, value) {
    if (value === undefined || value === null) {
        return;
    }

    const normalizedValue = String(value).trim();

    if (!normalizedValue) {
        return;
    }

    params.set(key, normalizedValue);
}

export function buildBooksQueryParams({
    q = "",
    author = "",
    categoryId = "",
    available = "",
    publishedFrom = "",
    publishedTo = "",
    sort = "random",
    page = 1,
    limit = 10,
} = {}) {
    const params = new URLSearchParams();

    appendIfPresent(params, "q", q);
    appendIfPresent(params, "author", author);
    appendIfPresent(params, "categoryId", categoryId);
    appendIfPresent(params, "publishedFrom", publishedFrom);
    appendIfPresent(params, "publishedTo", publishedTo);

    const normalizedAvailable = normalizeBooleanFilter(available);

    if (normalizedAvailable) {
        params.set("available", normalizedAvailable);
    }

    if (sort === "asc" || sort === "desc" || sort === "random") {
        params.set("sort", sort);
    }

    params.set("page", String(page));
    params.set("limit", String(limit));

    return params;
}

async function parseJsonResponse(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function handleApiError(response, defaultMessage) {
    const errorData = await parseJsonResponse(response);

    if (response.status === 401) {
        throw new Error("Session expiree ou acces non autorise.");
    }

    throw new Error(errorData?.message || errorData?.error || defaultMessage);
}

export const getBooks = async (filters = {}) => {
    const params = buildBooksQueryParams(filters);
    const response = await fetch(`/api/books?${params.toString()}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleApiError(response, "Une erreur est survenue");
    }

    return await response.json();
};

export const getBookById = async (bookId) => {
    const response = await fetch(`/api/books/${bookId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Livre introuvable.");
        }

        await handleApiError(response, "Une erreur est survenue");
    }

    return await response.json();
};

export const getCategories = async () => {
    const response = await fetch("/api/categories", {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleApiError(response, "Impossible de recuperer les categories.");
    }

    return await response.json();
};

export const getMyReviews = async () => {
    const response = await fetch("/api/reviews/me", {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleApiError(response, "Impossible de recuperer vos avis.");
    }

    return await response.json();
};

export const getBookReviews = async (bookId) => {
    const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleApiError(response, "Impossible de recuperer les avis du livre.");
    }

    return await response.json();
};

export const createBookReview = async (bookId, reviewData) => {
    const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
        await handleApiError(response, "Impossible d'enregistrer votre avis.");
    }

    return await response.json();
};

export const getAllReviews = async () => {
    const response = await fetch("/api/reviews", {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleApiError(response, "Impossible de recuperer les reviews.");
    }

    return await response.json();
};

export const moderateReview = async (reviewId, isModerated = true) => {
    const response = await fetch(`/api/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ isModerated }),
    });

    if (!response.ok) {
        await handleApiError(response, "Impossible de moderer cette review.");
    }

    return await response.json();
};

export const deleteReview = async (reviewId) => {
    const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleApiError(response, "Impossible de supprimer cette review.");
    }

    return true;
};
