import { Head, Link } from '@inertiajs/react';

const features = [
    { icon: '✦', title: 'Recomendaciones inteligentes', text: 'Encuentra el equipo ideal según tu carrera, actividades y software.' },
    { icon: '◈', title: 'Compatibilidad precisa', text: 'Obtén un porcentaje claro de compatibilidad para cada laptop.' },
    { icon: '⌘', title: 'Personalización total', text: 'Configura RAM, SSD, mochila, accesorios y kits.' },
];

export default function Welcome() {
    return (
        <>
            <Head title="Inicio" />

            <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
                    <Link href="/" className="flex items-center gap-3 text-xl font-bold">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-lg text-[#07111f]">✦</span>
                        Inge<span className="text-cyan-400">Tech</span> AI
                    </Link>

                    <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
                        <a href="#como-funciona" className="transition hover:text-cyan-400">
                            Cómo funciona
                        </a>
                        <a href="#beneficios" className="transition hover:text-cyan-400">
                            Beneficios
                        </a>
                        <Link href="/login" className="rounded-lg border border-slate-600 px-5 py-2.5 hover:border-cyan-400">
                            Ingresar
                        </Link>
                    </div>
                </nav>

                <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-32">
                    <div className="absolute top-20 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="relative">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" /> Tecnología que se adapta a ti
                        </div>
                        <h1 className="max-w-2xl text-5xl leading-[1.05] font-black tracking-tight sm:text-7xl">
                            Tu próximo equipo, <span className="text-cyan-400">elegido con inteligencia.</span>
                        </h1>
                        <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
                            IngeTech AI analiza tu perfil y te recomienda la laptop perfecta para estudiar, crear y trabajar.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                href="/register"
                                className="rounded-xl bg-cyan-400 px-7 py-4 font-bold text-[#07111f] shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
                            >
                                Comenzar recomendación →
                            </Link>
                            <a
                                href="#como-funciona"
                                className="rounded-xl border border-slate-600 px-7 py-4 font-semibold text-slate-200 transition hover:border-cyan-400"
                            >
                                Conocer más
                            </a>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
                            <div className="rounded-2xl bg-[#0d1d31] p-6">
                                <div className="mb-8 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">Tu recomendación</p>
                                        <h2 className="mt-1 text-2xl font-bold">MacBook Pro 14”</h2>
                                    </div>
                                    <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-cyan-400 text-xl font-bold text-cyan-400">
                                        96%
                                    </div>
                                </div>
                                <div className="mb-6 h-40 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 p-8 text-center text-7xl">💻</div>
                                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                                    <div className="rounded-lg bg-white/5 p-3">
                                        <b className="block text-cyan-300">16 GB</b>
                                        <span className="text-slate-500">RAM</span>
                                    </div>
                                    <div className="rounded-lg bg-white/5 p-3">
                                        <b className="block text-cyan-300">512 GB</b>
                                        <span className="text-slate-500">SSD</span>
                                    </div>
                                    <div className="rounded-lg bg-white/5 p-3">
                                        <b className="block text-cyan-300">M3</b>
                                        <span className="text-slate-500">Chip</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="beneficios" className="border-t border-white/10 bg-[#091827] px-6 py-20 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-sm font-bold tracking-[0.25em] text-cyan-400 uppercase">Una mejor decisión</p>
                        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Tecnología pensada para tu futuro</h2>
                        <div className="mt-12 grid gap-5 md:grid-cols-3">
                            {features.map((feature) => (
                                <article
                                    key={feature.title}
                                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:border-cyan-400/50"
                                >
                                    <div className="mb-5 text-3xl text-cyan-400">{feature.icon}</div>
                                    <h3 className="text-xl font-bold">{feature.title}</h3>
                                    <p className="mt-3 leading-7 text-slate-400">{feature.text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="como-funciona" className="px-6 py-20 text-center lg:px-10">
                    <h2 className="text-3xl font-bold">Empieza en menos de 3 minutos</h2>
                    <p className="mx-auto mt-4 max-w-xl text-slate-400">
                        Cuéntanos quién eres, qué haces y cuánto quieres invertir. Nosotros hacemos el análisis.
                    </p>
                    <Link href="/register" className="mt-8 inline-block rounded-xl bg-cyan-400 px-8 py-4 font-bold text-[#07111f] hover:bg-cyan-300">
                        Crear mi recomendación
                    </Link>
                </section>

                <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-slate-500">
                    © 2026 IngeTech AI · UNHEVAL · Grupo 12 ·{' '}
                    <Link href="/derecho" className="underline decoration-white/20 hover:text-slate-300">
                        Términos y Garantía
                    </Link>
                </footer>
            </main>
        </>
    );
}
