const PALETA: Record<string, string> = {
    Lenovo: '#e2231a',
    HP: '#0096d6',
    Acer: '#83b81a',
    ASUS: '#003876',
    Dell: '#007db8',
    Apple: '#555555',
    Ensamblado: '#7c3aed',
};

function colorDeMarca(marca: string): string {
    return PALETA[marca] ?? '#0891b2';
}

export default function DeviceIllustration({ marca, tipo, className }: { marca: string; tipo: 'laptop' | 'escritorio'; className?: string }) {
    const color = colorDeMarca(marca);

    return (
        <div
            className={`flex items-center justify-center rounded-xl ${className ?? 'h-32 w-full'}`}
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}05)` }}
        >
            {tipo === 'laptop' ? (
                <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none">
                    <rect x="14" y="12" width="36" height="24" rx="2" stroke={color} strokeWidth="2.5" />
                    <rect x="18" y="16" width="28" height="16" rx="1" fill={color} fillOpacity="0.15" />
                    <path d="M8 42h48l4 8H4l4-8z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
            ) : (
                <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none">
                    <rect x="10" y="10" width="28" height="34" rx="2" stroke={color} strokeWidth="2.5" />
                    <rect x="14" y="14" width="20" height="14" rx="1" fill={color} fillOpacity="0.15" />
                    <circle cx="24" cy="38" r="1.5" fill={color} />
                    <rect x="40" y="16" width="16" height="26" rx="1.5" stroke={color} strokeWidth="2.5" />
                    <rect x="12" y="48" width="24" height="3" rx="1.5" fill={color} fillOpacity="0.3" />
                </svg>
            )}
        </div>
    );
}
