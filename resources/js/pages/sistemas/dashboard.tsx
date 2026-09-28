import LaptopImage from '@/components/laptop-image';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type { Cotizacion } from '@/types/flujo';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Cpu, Receipt, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
];

const pasos = [
    { icon: Sparkles, titulo: 'Cuéntanos de ti', texto: 'Tu carrera, actividades y software que usas.' },
    { icon: Cpu, titulo: 'Recibe tu recomendación', texto: 'Laptops con % de compatibilidad y por qué te sirven.' },
    { icon: Wand2, titulo: 'Personalízala', texto: 'Ajusta RAM, almacenamiento, kits y accesorios.' },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | null>(null);

    useEffect(() => {
        fetch('/api/mis-cotizaciones', { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : []))
            .then(setCotizaciones)
            .catch(() => setCotizaciones([]));
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-8">
                    {/* Ruta detrás de `auth` en routes/web.php: siempre hay sesión aquí. */}
                    <p className="text-muted-foreground text-sm">Hola, {auth.user!.name} 👋</p>
                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">¿Buscamos tu próxima laptop?</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Responde unas preguntas sobre tu carrera y lo que necesitas hacer, y te recomendamos la mejor opción para tu presupuesto.
                    </p>
                    <Link
                        href="/perfil"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
                    >
                        Nueva recomendación <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {pasos.map((paso, i) => (
                        <div key={paso.titulo} className="rounded-xl border p-5">
                            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                                <paso.icon className="h-5 w-5" />
                                <span className="text-xs font-bold">Paso {i + 1}</span>
                            </div>
                            <h3 className="mt-3 font-semibold">{paso.titulo}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">{paso.texto}</p>
                        </div>
                    ))}
                </div>

                <MisCotizaciones cotizaciones={cotizaciones} />
            </div>
        </AppLayout>
    );
}

function MisCotizaciones({ cotizaciones }: { cotizaciones: Cotizacion[] | null }) {
    return (
        <section id="cotizaciones" className="scroll-mt-20">
            <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-xl font-bold">Tus cotizaciones</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
                Las laptops que personalizaste y confirmaste. Un asesor te contactará a tu correo para cerrar la compra.
            </p>

            {cotizaciones === null ? (
                <div className="bg-muted mt-4 h-24 animate-pulse rounded-xl" />
            ) : cotizaciones.length === 0 ? (
                <div className="text-muted-foreground mt-4 rounded-xl border border-dashed p-8 text-center text-sm">
                    Todavía no tienes cotizaciones. Personaliza una laptop desde tu recomendación o desde el{' '}
                    <Link href="/hardware" className="text-cyan-600 underline dark:text-cyan-400">
                        catálogo
                    </Link>{' '}
                    y confírmala.
                </div>
            ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {cotizaciones.map((c) => (
                        <article key={c.id} className="flex gap-4 rounded-xl border p-4">
                            <LaptopImage
                                imagenUrl={c.laptop.imagen_url}
                                marca={c.laptop.marca}
                                tipo={c.laptop.tipo}
                                className="h-16 w-16 shrink-0 rounded-lg"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                    <h3 className="font-semibold">
                                        {c.laptop.marca} {c.laptop.modelo}
                                    </h3>
                                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                        S/ {Number(c.precio_total).toLocaleString('es-PE')}
                                    </span>
                                </div>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {c.ram_gb} GB RAM · {c.almacenamiento_gb} GB
                                    {c.items.length > 0 &&
                                        ` · ${c.items
                                            .map((i) => i.item?.nombre)
                                            .filter(Boolean)
                                            .join(', ')}`}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
                                        Enviada al asesor
                                    </span>
                                    <span className="text-muted-foreground">
                                        {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
