import { Link } from '@inertiajs/react';

// Dos caminos llegan a la compra: con la IA (perfil -> recomendación -> personalizar -> pago)
// o directo desde la tienda (personalizar -> pago).
const PASOS = {
    ia: ['Tu perfil', 'Recomendación', 'Personalización', 'Pago'],
    tienda: ['Personalización', 'Pago'],
} as const;

export type Flujo = keyof typeof PASOS;

// En el flujo "tienda", paso 1 = Personalización. pasoActual siempre se da en la numeración
// del flujo IA (3 = personalizar, 4 = pago) y aquí se traduce.
export default function FlowHeader({ pasoActual, flujo = 'ia' }: { pasoActual: 1 | 2 | 3 | 4; flujo?: Flujo }) {
    const pasos = PASOS[flujo];
    const actual = flujo === 'tienda' ? pasoActual - 2 : pasoActual;

    return (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-[#07111f]/80">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
                <Link href="/" className="flex items-center gap-2.5 text-lg font-bold text-[#0c2340] dark:text-white">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-[#07111f]">✦</span>
                    Inge<span className="text-sky-600 dark:text-cyan-400">Tech</span> AI
                </Link>

                <ol className="hidden items-center gap-2 text-sm sm:flex">
                    {pasos.map((titulo, i) => (
                        <li key={titulo} className="flex items-center gap-2">
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                    actual >= i + 1
                                        ? 'bg-cyan-400 text-[#07111f]'
                                        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                                }`}
                            >
                                {i + 1}
                            </span>
                            <span className={actual >= i + 1 ? 'text-[#0c2340] dark:text-white' : 'text-slate-500'}>{titulo}</span>
                            {i < pasos.length - 1 && <span className="mx-1 h-px w-6 bg-slate-200 dark:bg-white/15" />}
                        </li>
                    ))}
                </ol>

                <span className="font-mono text-xs text-slate-500 sm:hidden">
                    paso {actual} de {pasos.length}
                </span>
            </div>
        </header>
    );
}
