export const register = async (userData) => {
    const response = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(userData)
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Une erreur est survenue")
    }

    else {
        return await response.json()
    }
}

export const login = async (userData) => {
    const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(userData)
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Une erreur est survenue")
    }

    else {
        return await response.json()
    }
}
