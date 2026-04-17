import { useMemo, useState } from "react";

function resolveBookImageSrc(image) {
    const rawValue = String(image ?? "").trim();

    if (!rawValue) {
        return "";
    }

    if (
        rawValue.startsWith("http://") ||
        rawValue.startsWith("https://") ||
        rawValue.startsWith("data:") ||
        rawValue.startsWith("blob:")
    ) {
        return rawValue;
    }

    if (rawValue.startsWith("/")) {
        return rawValue;
    }

    return `/${rawValue}`;
}

export default function BookCoverImage({
    image,
    alt,
    className = "",
    fallback = "Couverture",
}) {
    const resolvedSrc = useMemo(() => resolveBookImageSrc(image), [image]);
    const [hasError, setHasError] = useState(false);

    if (!resolvedSrc || hasError) {
        return fallback;
    }

    return (
        <img
            src={resolvedSrc}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
}
