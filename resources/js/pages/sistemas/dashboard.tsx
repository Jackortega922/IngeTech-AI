import LaptopImage from '@/components/laptop-image';
import AppLayout from '@/layouts/app-layout';
import { estadoPedido, soles } from '@/lib/pedidos';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type { Pedido, PreferenciasCliente } from '@/types/flujo';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bot,
    CheckCircle2,
    ChevronRight,
    Clock3,
    HeartHandshake,
    History,
    Laptop,
    MailCheck,
    Package,
    ShieldCheck,
    Sparkles,
    Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inicio', href: '/dashboard' }];

// Diseño del panel: Marco (PR #41). Se conservan de main el mensaje de confirmación, la tarjeta
// del cuestionario de bienvenida (Psicología) y "Mis pedidos".
const pasos = [
    { icon: Sparkles, n: '01', titulo: 'Cuéntanos qué haces', texto: 'Indica tu uso, los programas que usas, tu presupuesto y portabilidad.' },
    { icon: Bot, n: '02', titulo: 'La IA cruza tus datos', texto: 'Comparamos tus necesidades con las especificaciones del catálogo.' },
    { icon: Wand2, n: '03', titulo: 'Personaliza y compra', texto: 'Compara opciones, ajusta tu laptop y cómprala en línea.' },
];

const accesos = [
    { href: '/hardware', icon: Laptop, titulo: 'Explorar laptops', texto: 'Catálogo con ficha técnica y precios.' },
    { href: '/historial', icon: History, titulo: 'Mi historial', texto: 'Tus recomendaciones guardadas.' },
    { href: '/dashboard#pedidos', icon: Package, titulo: 'Mis pedidos', texto: 'Estado de tus compras y boletas.' },
];

export default function Dashboard({ preferencias, mensaje }: { preferencias: PreferenciasCliente | null; mensaje: string | null }) {
    const { auth } = usePage<SharedData>().props;
    const [pedidos, setPedidos] = useState<Pedido[] | null>(null);

    useEffect(() => {
        fetch('/api/mis-pedidos', { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : []))
            .then(setPedidos)
            .catch(() => setPedidos([]));
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio — IngeTech AI" />
            <main className="it-container space-y-7 py-7 sm:py-9">
                {mensaje && (
                    <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {mensaje}
                    </p>
                )}

                {/* Correo sin confirmar: no bloquea nada, pero sin confirmarlo no se unen las compras
                    hechas como invitado (listener UnirComprasDeInvitado). */}
                {!auth.user!.email_verified_at && (
                    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200">
                        <p className="flex items-start gap-2">
                            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                Confirma tu correo con el enlace que te enviamos. Así, las compras que hiciste sin cuenta con ese correo aparecerán en
                                Mis pedidos.
                            </span>
                        </p>
                        <Link
                            href="/email/verification-notification"
                            method="post"
                            as="button"
                            preserveScroll
                            className="shrink-0 rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/10"
                        >
                            Reenviar enlace
                        </Link>
                    </div>
                )}

                <section className="relative overflow-hidden rounded-[2rem] border border-[#173a63]/10 bg-white shadow-xl dark:bg-slate-900">
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(23,58,99,.16),transparent_65%)]" />
                    <div className="absolute top-10 right-10 h-32 w-32 rounded-full border border-slate-200/70 dark:border-slate-700" />
                    <div className="relative grid lg:grid-cols-[1fr_360px]">
                        <div className="p-7 sm:p-10 lg:p-12">
                            <span className="it-badge border-[var(--it-primary)]/15 bg-[var(--it-primary-soft)] text-[var(--it-primary)]">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> IA para elegir mejor
                            </span>
                            {/* Ruta detrás de `auth` en routes/web.php: siempre hay sesión aquí. */}
                            <p className="mt-7 text-sm font-semibold text-slate-500">Bienvenido, {auth.user!.name}</p>
                            <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight text-[#0c2340] sm:text-5xl dark:text-white">
                                Encuentra la laptop que encaja contigo.
                            </h1>
                            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                                IngeTech AI transforma tus actividades y programas en una recomendación clara, explicable y fácil de comparar.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href="/perfil" className="it-btn it-btn-primary rounded-xl">
                                    Nueva recomendación <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/hardware" className="it-btn it-btn-secondary rounded-xl">
                                    Explorar catálogo
                                </Link>
                            </div>
                        </div>
                        <div className="hidden border-l bg-[#0c2340] p-8 text-white lg:block">
                            <p className="text-xs font-bold tracking-[.2em] text-sky-300 uppercase">Tu flujo</p>
                            <div className="mt-8 space-y-6">
                                {pasos.map((paso) => (
                                    <div key={paso.n} className="flex gap-4">
                                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10">
                                            <paso.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">{paso.n}</p>
                                            <h3 className="mt-1 font-bold">{paso.titulo}</h3>
                                            <p className="mt-1 text-xs leading-5 text-slate-400">{paso.texto}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <TarjetaCuestionario preferencias={preferencias} />

                <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="it-card p-6 sm:p-7">
                        <p className="it-eyebrow">Accesos rápidos</p>
                        <h2 className="mt-1 text-2xl font-black text-[#0c2340] dark:text-white">Tu centro de compras</h2>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {accesos.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-[var(--it-primary)]/30 hover:shadow-lg"
                                >
                                    <item.icon className="h-5 w-5 text-[var(--it-primary)] dark:text-sky-300" />
                                    <h3 className="mt-4 font-bold">{item.titulo}</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.texto}</p>
                                    <ChevronRight className="mt-4 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[var(--it-primary)]" />
                                </Link>
                            ))}
                        </div>
                    </div>
                    <aside className="rounded-3xl bg-[#0c2340] p-7 text-white shadow-lg">
                        <ShieldCheck className="h-7 w-7 text-sky-300" />
                        <h2 className="mt-5 text-xl font-black">Recomendaciones con contexto</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            El resultado considera tus necesidades, cómo eres (si respondiste el cuestionario) y el catálogo de la tienda.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-sky-200">
                            <Clock3 className="h-4 w-4" /> Flujo guiado de pocos minutos
                        </div>
                    </aside>
                </section>

                <MisPedidos pedidos={pedidos} />
            </main>
        </AppLayout>
    );
}

function MisPedidos({ pedidos }: { pedidos: Pedido[] | null }) {
    return (
        <section id="pedidos" className="scroll-mt-20">
            <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-xl font-bold">Mis pedidos</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Las laptops que compraste y en qué estado va cada envío.</p>

            {pedidos === null ? (
                <div className="bg-muted mt-4 h-24 animate-pulse rounded-xl" />
            ) : pedidos.length === 0 ? (
                <div className="text-muted-foreground mt-4 rounded-xl border border-dashed p-8 text-center text-sm">
                    Todavía no tienes pedidos. Encuentra tu laptop en la{' '}
                    <Link href="/" className="text-cyan-600 underline dark:text-cyan-400">
                        tienda
                    </Link>{' '}
                    o pide una recomendación con IA.
                </div>
            ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {pedidos.map((p) => {
                        const estado = estadoPedido(p.estado);
                        const l = p.personalizacion.laptop;
                        return (
                            <Link
                                key={p.id}
                                href={`/pedido/${p.codigo}`}
                                className="flex gap-4 rounded-xl border p-4 transition hover:border-cyan-500/50"
                            >
                                <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="h-16 w-16 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                        <h3 className="font-semibold">
                                            {l.marca} {l.modelo}
                                        </h3>
                                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{soles(p.total)}</span>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {p.personalizacion.ram_gb} GB RAM · {p.personalizacion.almacenamiento_gb} GB · {p.codigo}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${estado.clase}`}>{estado.label}</span>
                                        <span className="text-muted-foreground">
                                            {new Date(p.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

// Estado del cuestionario de bienvenida (Psicología): invita a responderlo si falta, o deja
// revisarlo y borrarlo si ya está (el cliente decide sobre sus datos).
function TarjetaCuestionario({ preferencias }: { preferencias: PreferenciasCliente | null }) {
    const completo = !!preferencias?.completado_at;

    function borrar() {
        if (window.confirm('¿Borrar tus respuestas del cuestionario? Las recomendaciones dejarán de adaptarse a ti.')) {
            router.delete('/bienvenida');
        }
    }

    if (!completo) {
        return (
            <div className="flex flex-col gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <HeartHandshake className="mt-0.5 h-6 w-6 shrink-0 text-violet-500" />
                    <div>
                        <p className="font-semibold">Cuéntanos cómo eres (2 minutos)</p>
                        <p className="text-muted-foreground text-sm">
                            {preferencias?.omitido_at ? 'Lo omitiste antes. ' : ''}Con 10 preguntas rápidas adaptamos las recomendaciones a lo que
                            buscas.
                        </p>
                    </div>
                </div>
                <Link
                    href="/bienvenida"
                    className="shrink-0 rounded-xl bg-violet-500 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-violet-600"
                >
                    Responder
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <HeartHandshake className="mt-0.5 h-6 w-6 shrink-0 text-violet-500" />
                <div>
                    <p className="font-semibold">Ya te conocemos un poco mejor</p>
                    <p className="text-muted-foreground text-sm">
                        Tus recomendaciones se adaptan a tus respuestas. Puedes cambiarlas o borrarlas cuando quieras.
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
                <Link href="/bienvenida" className="rounded-xl border px-4 py-2 font-semibold hover:border-violet-500">
                    Revisar respuestas
                </Link>
                <button onClick={borrar} className="text-muted-foreground hover:text-foreground underline">
                    Borrar
                </button>
            </div>
        </div>
    );
}
