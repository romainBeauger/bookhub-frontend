function clampRating(value, max) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    return Math.min(Math.max(numericValue, 0), max);
}

function getFilledStars(rating, max, allowHalf) {
    const safeRating = clampRating(rating, max);

    if (allowHalf) {
        return Math.round(safeRating * 2) / 2;
    }

    return Math.round(safeRating);
}

function StarIcon({ variant = "empty" }) {
    const fillClass = variant === "full" ? "text-amber-400" : "text-slate-300";

    return (
        <svg viewBox="0 0 24 24" className={`h-5 w-5 ${fillClass}`} aria-hidden="true">
            <path
                fill="currentColor"
                d="M12 2.75l2.85 5.77 6.37.93-4.61 4.49 1.09 6.34L12 17.29l-5.7 2.99 1.09-6.34-4.61-4.49 6.37-.93L12 2.75z"
            />
        </svg>
    );
}

function HalfStarIcon() {
    return (
        <span className="relative inline-flex h-5 w-5" aria-hidden="true">
            <span className="absolute inset-0">
                <StarIcon variant="empty" />
            </span>
            <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <StarIcon variant="full" />
            </span>
        </span>
    );
}

export default function RatingStars({
    rating = 0,
    max = 5,
    sizeClassName = "h-5 w-5",
    showValue = false,
    allowHalf = false,
}) {
    const safeRating = clampRating(rating, max);
    const filledStars = getFilledStars(safeRating, max, allowHalf);
    const stars = Array.from({ length: max }, (_, index) => {
        const position = index + 1;

        if (position <= Math.floor(filledStars)) {
            return "full";
        }

        if (allowHalf && position - filledStars === 0.5) {
            return "half";
        }

        return "empty";
    });

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {stars.map((variant, index) => (
                    <span key={`${variant}-${index}`} className={sizeClassName}>
                        {variant === "half" ? <HalfStarIcon /> : <StarIcon variant={variant} />}
                    </span>
                ))}
            </div>
            {showValue && (
                <span className="text-sm font-medium text-slate-600">
                    {safeRating.toFixed(1)}/5
                </span>
            )}
        </div>
    );
}
