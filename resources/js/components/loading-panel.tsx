export function LoadingPanel() {
    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-muted/40 h-32 animate-pulse rounded-2xl border" />
                ))}
            </div>

            <div className="bg-muted/40 h-96 animate-pulse rounded-2xl border" />
        </div>
    );
}
