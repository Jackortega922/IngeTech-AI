import { Link } from '@inertiajs/react';

const PASOS = [
    { n: 1, t: 'Tu perfil' },
    { n: 2, t: 'Recomendación' },
    { n: 3, t: 'Personalización' },
] as const;

export default function FlowHeader({ pasoActual }: { pasoActual: 1 | 2 | 3 }) {
    return (
        <header className="border-b border-white/10 bg-[#07111f]/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
                <Link href="/" className="flex items-center gap-2.5 text-lg font-bold text-white">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-[#07111f]">✦</span>
                    Inge<span className="text-cyan-400">Tech</span> AI
                </Link>

                <ol className="hidden items-center gap-2 text-sm sm:flex">
                    {PASOS.map((paso, i) => (
                        <li key={paso.n} className="flex items-center gap-2">
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                    pasoActual >= paso.n ? 'bg-cyan-400 text-[#07111f]' : 'bg-white/10 text-slate-400'
                                }`}
                            >
                                {paso.n}
                            </span>
                            <span className={pasoActual >= paso.n ? 'text-white' : 'text-slate-500'}>{paso.t}</span>
                            {i < PASOS.length - 1 && <span className="mx-1 h-px w-6 bg-white/15" />}
                        </li>
                    ))}
                </ol>

                <span className="font-mono text-xs text-slate-500 sm:hidden">paso {pasoActual} de 3</span>
            </div>
        </header>
    );
}
