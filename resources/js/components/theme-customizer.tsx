import { useEffect, useState } from 'react';
import { Check, Moon, Palette, RotateCcw, Sun, X } from 'lucide-react';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';

type Accent = 'blue' | 'cyan' | 'violet' | 'emerald';
const ACCENTS: { key: Accent; label: string; value: string; description: string }[] = [
    { key: 'blue', label: 'Azul marino', value: '#173a63', description: 'Identidad principal de IngeTech' },
    { key: 'cyan', label: 'Cian', value: '#0891b2', description: 'Tecnológico y fresco' },
    { key: 'violet', label: 'Violeta', value: '#6d5dfc', description: 'Creativo y moderno' },
    { key: 'emerald', label: 'Esmeralda', value: '#0f9f75', description: 'Natural y sostenible' },
];

export default function ThemeCustomizer() {
    const [open, setOpen] = useState(false);
    const [accent, setAccent] = useState<Accent>('blue');
    const { appearance, updateAppearance } = useAppearance();

    useEffect(() => {
        const saved = localStorage.getItem('ingetech:accent') as Accent | null;
        if (saved && ACCENTS.some((a) => a.key === saved)) setAccent(saved);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.accent = accent;
        localStorage.setItem('ingetech:accent', accent);
    }, [accent]);

    function setPanel(mode: Appearance) {
        updateAppearance(mode);
        window.setTimeout(() => setOpen(false), 120);
    }

    return (
        <>
            <button type="button" aria-label="Personalizar apariencia" onClick={() => setOpen(true)} className="it-theme-trigger">
                <Palette className="h-4 w-4" />
            </button>
            {open && (
                <div className="fixed inset-0 z-[140] bg-slate-950/45 backdrop-blur-sm" onClick={() => setOpen(false)}>
                    <aside onClick={(e) => e.stopPropagation()} className="it-theme-panel">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="it-eyebrow">Personalización</p>
                                <h2 className="mt-1 text-2xl font-black">Haz IngeTech tuyo</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Elige si quieres un panel blanco o azul marino y después selecciona tu color de acento.</p>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="it-icon-btn shrink-0"><X className="h-4 w-4" /></button>
                        </div>

                        <div className="mt-7">
                            <p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-slate-500">Estilo del panel</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button type="button" onClick={() => setPanel('light')} className={`it-theme-mode ${appearance === 'light' ? 'is-active' : ''}`}>
                                    <span className="it-theme-preview it-theme-preview-light"><Sun className="h-5 w-5" /></span>
                                    <span><b>Blanco</b><small>Claro, limpio y profesional</small></span>
                                    {appearance === 'light' && <Check className="ml-auto h-4 w-4 text-[var(--it-primary)]" />}
                                </button>
                                <button type="button" onClick={() => setPanel('dark')} className={`it-theme-mode ${appearance === 'dark' ? 'is-active' : ''}`}>
                                    <span className="it-theme-preview it-theme-preview-dark"><Moon className="h-5 w-5" /></span>
                                    <span><b>Azul marino</b><small>Elegante, técnico y nocturno</small></span>
                                    {appearance === 'dark' && <Check className="ml-auto h-4 w-4 text-sky-300" />}
                                </button>
                            </div>
                        </div>

                        <div className="mt-7">
                            <p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-slate-500">Color de acento</p>
                            <div className="grid gap-3">
                                {ACCENTS.map((item) => (
                                    <button key={item.key} type="button" onClick={() => setAccent(item.key)} className={`it-theme-option ${accent === item.key ? 'is-active' : ''}`}>
                                        <span className="h-10 w-10 rounded-xl shadow-inner ring-1 ring-black/5" style={{ background: item.value }} />
                                        <span className="flex-1 text-left"><strong>{item.label}</strong><small>{item.description}</small></span>
                                        {accent === item.key && <span className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: item.value }}><Check className="h-3.5 w-3.5" /></span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="button" onClick={() => { setAccent('blue'); setPanel('light'); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"><RotateCcw className="h-4 w-4" /> Restaurar blanco + azul marino</button>
                    </aside>
                </div>
            )}
        </>
    );
}
