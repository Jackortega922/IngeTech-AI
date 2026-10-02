import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Bot, ChevronRight, Clock3, Cpu, History, Laptop, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inicio', href: '/dashboard' }];
const steps = [
    { icon: Sparkles, n: '01', title: 'Cuéntanos qué haces', text: 'Indica actividades, software, presupuesto y portabilidad.' },
    { icon: Bot, n: '02', title: 'La IA cruza tus datos', text: 'Comparamos tus necesidades con las especificaciones del catálogo.' },
    { icon: Wand2, n: '03', title: 'Personaliza y decide', text: 'Compara opciones y ajusta tu equipo antes de elegir.' },
];
const shortcuts = [
    { href: '/hardware', icon: Laptop, title: 'Explorar equipos', text: 'Laptops y PCs con ficha técnica.' },
    { href: '/software', icon: Cpu, title: 'Ver software', text: 'Requisitos mínimos y recomendados.' },
    { href: '/historial', icon: History, title: 'Mi historial', text: 'Tus recomendaciones guardadas.' },
];
export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio — IngeTech AI" />
            <main className="it-container py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2rem] border border-[#173a63]/10 bg-white shadow-xl dark:bg-slate-900">
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(23,58,99,.16),transparent_65%)]" />
                    <div className="absolute top-10 right-10 h-32 w-32 rounded-full border border-slate-200/70 dark:border-slate-700" />
                    <div className="relative grid lg:grid-cols-[1fr_360px]">
                        <div className="p-7 sm:p-10 lg:p-12">
                            <span className="it-badge border-[var(--it-primary)]/15 bg-[var(--it-primary-soft)] text-[var(--it-primary)]">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> IA para elegir mejor
                            </span>
                            <p className="mt-7 text-sm font-semibold text-slate-500">Bienvenido, {auth.user.name}</p>
                            <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight text-[#0c2340] sm:text-5xl dark:text-white">
                                Encuentra el equipo que encaja contigo.
                            </h1>
                            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                                IngeTech AI transforma tus actividades y software en una recomendación clara, explicable y fácil de comparar.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href="/perfil" className="it-btn it-btn-primary rounded-xl">
                                    Crear recomendación <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/hardware" className="it-btn it-btn-secondary rounded-xl">
                                    Explorar catálogo
                                </Link>
                            </div>
                        </div>
                        <div className="hidden border-l bg-[#0c2340] p-8 text-white lg:block">
                            <p className="text-xs font-bold tracking-[.2em] text-sky-300 uppercase">Tu flujo</p>
                            <div className="mt-8 space-y-6">
                                {steps.map((step, i) => (
                                    <div key={step.n} className="flex gap-4">
                                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10">
                                            <step.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">{step.n}</p>
                                            <h3 className="mt-1 font-bold">{step.title}</h3>
                                            <p className="mt-1 text-xs leading-5 text-slate-400">{step.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                <section className="mt-7 grid gap-4 md:grid-cols-3">
                    {steps.map((step) => (
                        <article key={step.n} className="it-card it-card-hover p-5">
                            <div className="flex items-center justify-between">
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)]">
                                    <step.icon className="h-5 w-5" />
                                </span>
                                <span className="text-xs font-black text-slate-300">{step.n}</span>
                            </div>
                            <h2 className="mt-5 font-bold">{step.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{step.text}</p>
                        </article>
                    ))}
                </section>
                <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="it-card p-6 sm:p-7">
                        <div>
                            <p className="it-eyebrow">Accesos rápidos</p>
                            <h2 className="mt-1 text-2xl font-black text-[#0c2340] dark:text-white">Tu centro de trabajo</h2>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {shortcuts.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-[var(--it-primary)]/30 hover:shadow-lg"
                                >
                                    <item.icon className="h-5 w-5 text-[var(--it-primary)]" />
                                    <h3 className="mt-4 font-bold">{item.title}</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                                    <ChevronRight className="mt-4 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[var(--it-primary)]" />
                                </Link>
                            ))}
                        </div>
                    </div>
                    <aside className="rounded-3xl bg-[#0c2340] p-7 text-white shadow-lg">
                        <ShieldCheck className="h-7 w-7 text-sky-300" />
                        <h2 className="mt-5 text-xl font-black">Recomendaciones con contexto</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            El resultado considera tus necesidades y la información disponible en el catálogo administrado.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-sky-200">
                            <Clock3 className="h-4 w-4" /> Flujo guiado de pocos minutos
                        </div>
                    </aside>
                </section>
            </main>
        </AppLayout>
    );
}
