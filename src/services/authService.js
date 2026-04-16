const API_URL = import.meta.env.VITE_API_URL

export const register = async (userData) => {

    // faire un POST sur ${API_URL}/api/auth/register
    const response = await fetch(`${API_URL}/api/auth/register`, {
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