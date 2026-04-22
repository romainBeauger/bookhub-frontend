export const RESERVATION_STATUS_LABELS = {
    PENDING: "En attente",
    READY: "Pret a recuperer",
    VALIDATED: "Validee",
    CANCELLED: "Annulee",
};

export function extractReservations(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.reservations)) {
        return payload.reservations;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

export function formatReservationDate(value) {
    if (!value) {
        return "Non renseignee";
    }

    const normalizedValue = String(value).includes("T")
        ? value
        : String(value).replace(" ", "T");
    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
        return "Non renseignee";
    }

    return date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export function sortReservationsByNewest(reservations) {
    return [...reservations].sort((left, right) => {
        const leftDate = new Date(String(left?.reservationDate || "").replace(" ", "T")).getTime();
        const rightDate = new Date(String(right?.reservationDate || "").replace(" ", "T")).getTime();

        return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
    });
}

export function getReservationStatusLabel(status) {
    return RESERVATION_STATUS_LABELS[status] || status || "Inconnu";
}

export function getReservationStatusClass(status) {
    if (status === "READY") {
        return "bg-emerald-100 text-emerald-700";
    }

    if (status === "VALIDATED") {
        return "bg-sky-100 text-sky-700";
    }

    if (status === "CANCELLED") {
        return "bg-slate-200 text-slate-600";
    }

    return "bg-amber-100 text-amber-700";
}

export function canCancelReservation(status) {
    return status === "PENDING" || status === "READY";
}
