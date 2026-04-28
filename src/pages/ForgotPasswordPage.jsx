export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-main)" }}>
            <div
                className="p-8 rounded-3xl w-full max-w-md text-center"
                style={{
                    background: "var(--bg-surface)",
                    boxShadow: "var(--shadow-soft)",
                    border: "1px solid var(--border-soft)",
                }}
            >
                <h1
                    className="text-2xl font-bold mb-3"
                    style={{ color: "var(--text-main)", fontFamily: "Poppins, sans-serif" }}
                >
                    Mot de passe oublié
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Cette fonctionnalité arrive bientôt.
                </p>
            </div>
        </div>
    )
}
