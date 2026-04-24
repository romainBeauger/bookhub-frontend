export default function StatCard({ label, value, highlight = false }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${highlight ? 'text-red-500' : 'text-slate-800'}`}>
                {value}
            </p>
        </div>
    )
};
