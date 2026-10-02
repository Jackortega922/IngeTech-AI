import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BrainCircuit, CheckCircle2, Cpu, Sparkles, Star, Zap } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children }: AuthLayoutProps) {
    const { name } = usePage<SharedData>().props;
    return (
        <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.08fr_.92fr] dark:bg-slate-950">
            <aside className="relative hidden min-h-screen overflow-hidden bg-[#071a30] p-10 text-white lg:flex lg:flex-col">
                <div className="absolute top-20 -left-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
                <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="it-grid-bg absolute inset-0 opacity-30" />
                <Link href={route('home')} className="relative z-10 flex items-center gap-3 text-lg font-black">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#0c2340] shadow-lg">
                        <AppLogoIcon className="h-5 w-5 fill-current" />
                    </span>
                    <span>
                        Inge<span className="text-sky-300">Tech</span> AI
                    </span>
                </Link>

                <div className="relative z-10 mt-auto max-w-2xl pb-10">
                    <div className="mb-7 flex items-center gap-3">
                        <span className="it-badge border-white/10 bg-white/10 text-sky-200">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Plataforma inteligente
                        </span>
                        <span className="text-xs font-semibold text-slate-400">UNHEVAL · 2026</span>
                    </div>
                    <h1 className="max-w-xl text-6xl leading-[.98] font-black tracking-[-.04em]">
                        Tu tecnología empieza con <span className="text-sky-300">una mejor decisión.</span>
                    </h1>
                    <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                        Construye tu perfil, descubre equipos compatibles y personaliza la opción que mejor encaje con tu forma de trabajar.
                    </p>
                    <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                        {[
                            ['01', 'Perfil', 'Conoce tus necesidades'],
                            ['02', 'IA', 'Analiza compatibilidad'],
                            ['03', 'Elección', 'Personaliza tu equipo'],
                        ].map(([n, t, d]) => (
                            <div key={n} className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-xl">
                                <span className="text-[10px] font-black text-sky-300">{n}</span>
                                <p className="mt-4 text-sm font-bold">{t}</p>
                                <p className="mt-1 text-[11px] leading-4 text-slate-400">{d}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-slate-300">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Recomendaciones personalizadas
                        </span>
                        <span className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-sky-300" /> Catálogo técnico
                        </span>
                        <span className="flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4 text-violet-300" /> IA guiada
                        </span>
                    </div>
                </div>

                <div className="absolute top-28 right-12 hidden w-56 rotate-3 rounded-3xl border border-white/10 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl xl:block">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-400/15 text-sky-200">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold">Compatibilidad</p>
                            <p className="text-[10px] text-slate-400">Análisis del perfil</p>
                        </div>
                    </div>
                    <div className="mt-5 flex items-end gap-1">
                        <strong className="text-4xl font-black">94</strong>
                        <span className="mb-1 text-sm text-slate-400">%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" />
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400">Ejemplo visual de recomendación.</p>
                </div>
                <div className="absolute right-24 bottom-24 hidden -rotate-6 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-xl backdrop-blur-xl xl:block">
                    <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-700 text-[9px] font-black">
                            AI
                        </div>
                        <div>
                            <p className="text-[10px] font-bold">Asistente listo</p>
                            <p className="text-[9px] text-slate-400">Pregunta lo que necesites</p>
                        </div>
                        <Star className="h-3.5 w-3.5 fill-sky-300 text-sky-300" />
                    </div>
                </div>
            </aside>

            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
                <div className="absolute top-0 -right-32 h-72 w-72 rounded-full bg-sky-100 blur-3xl dark:bg-sky-950/20" />
                <div className="relative z-10 w-full max-w-[480px]">
                    <Link href={route('home')} className="mb-7 flex items-center justify-center gap-3 lg:hidden">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0c2340] text-white">IT</span>
                        <b className="text-xl text-[#0c2340] dark:text-white">
                            Inge<span className="text-sky-500">Tech</span> AI
                        </b>
                    </Link>
                    <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,.10)] backdrop-blur-xl sm:p-9 dark:border-slate-800 dark:bg-slate-900/95">
                        {children}
                    </div>
                    <p className="mt-5 text-center text-[10px] text-slate-400">
                        Al continuar aceptas el uso de la plataforma conforme a sus términos y condiciones.
                    </p>
                </div>
            </main>
        </div>
    );
}
