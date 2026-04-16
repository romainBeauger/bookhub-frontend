export const getBooks = async () => {
    const response = await fetch("/api/books", {
        method: "GET",
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Une erreur est survenue")
    }

    else {
        return await response.json()
    }
}
