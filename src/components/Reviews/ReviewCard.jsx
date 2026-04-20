import RatingStars from "./RatingStars.jsx";

function formatReviewDate(value) {
    if (!value) {
        return "Date inconnue";
    }

    const normalizedValue = String(value).replace(" ", "T");
    const parsedDate = new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(parsedDate);
}

function getReviewerName(review) {
    const fullName = [review?.user?.firstName, review?.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || review?.user?.email || "Lecteur BookHub";
}

function getModerationLabel(review) {
    if (review?.isModerated === true) {
        return {
            label: "Modere",
            className: "bg-emerald-100 text-emerald-700",
        };
    }

    if (review?.isModerated === false) {
        return {
            label: "En attente",
            className: "bg-amber-100 text-amber-700",
        };
    }

    return null;
}

export default function ReviewCard({
    review,
    currentUserId,
    showBookTitle = false,
    showReviewerName = false,
    actions,
}) {
    const moderation = getModerationLabel(review);
    const isCurrentUserReview = Boolean(currentUserId) && review?.user?.id === currentUserId;

    return (
        <article
            className={`rounded-2xl border p-4 shadow-sm ${
                isCurrentUserReview
                    ? "border-sky-200 bg-sky-50/60"
                    : "border-slate-200 bg-white"
            }`}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    {showBookTitle && (
                        <h3 className="text-lg font-semibold text-slate-900">
                            {review?.book?.title || "Livre indisponible"}
                        </h3>
                    )}
                    {(showReviewerName || !showBookTitle) && (
                        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                            {getReviewerName(review)}
                        </p>
                    )}
                    <RatingStars rating={review?.rating} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isCurrentUserReview && (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            Mon avis
                        </span>
                    )}
                    {moderation && (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${moderation.className}`}>
                            {moderation.label}
                        </span>
                    )}
                    <span className="text-xs font-medium text-slate-500">
                        {formatReviewDate(review?.createdAt)}
                    </span>
                </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
                {review?.comment || "Aucun commentaire pour cet avis."}
            </p>
            {actions && (
                <div className="mt-4 flex flex-wrap gap-3">
                    {actions}
                </div>
            )}
        </article>
    );
}
