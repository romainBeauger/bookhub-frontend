export default function StatCard({ label, value, highlight = false }) {
    return (
        <div
            className="rounded-2xl p-5 text-center"
            style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-soft)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p
                className="text-3xl font-semibold"
                style={{ color: highlight ? "var(--danger-fg)" : "var(--tangerine)" }}
            >
                {value}
            </p>
        </div>
    )
}
