import DeviceIllustration from '@/components/device-illustration';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { HistorialItem } from '@/types/flujo';
import { Head, Link } from '@inertiajs/react';
import { Clock, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Mis recomendaciones', href: '/historial' }];

export default function HistorialIndex() {
    const [items, setItems] = useState<HistorialItem[] | null>(null);

    useEffect(() => {
        fetch('/api/mis-recomendaciones', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setItems);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mis recomendaciones" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Mis recomendaciones</h1>
                    <p className="text-muted-foreground">Cada vez que generas una recomendación queda guardada aquí.</p>
                </div>

                {!items ? (
                    <div className="bg-muted h-64 animate-pulse rounded-xl" />
                ) : items.length === 0 ? (
                    <div className="text-muted-foreground rounded-xl border p-10 text-center">
                        <p>Todavía no has generado ninguna recomendación.</p>
                        <Link
                            href="/perfil"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white hover:bg-cyan-600"
                        >
                            <Sparkles className="h-4 w-4" /> Generar mi primera recomendación
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="rounded-xl border p-5">
                                <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="text-foreground font-semibold">{item.carrera ?? 'Carrera no especificada'}</span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(item.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Nivel {item.nivel_experiencia} · Presupuesto S/ {Number(item.presupuesto_soles).toLocaleString('es-PE')} ·{' '}
                                    {item.portabilidad === 'cualquiera' ? 'Laptop o escritorio' : item.portabilidad}
                                    {item.actividades.length > 0 && <> · {item.actividades.join(', ')}</>}
                                </p>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {item.recomendaciones.map((r) => (
                                        <div key={r.id} className="flex gap-3 rounded-lg border p-3">
                                            <DeviceIllustration marca={r.laptop.marca} tipo={r.laptop.tipo} className="h-16 w-16 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {r.laptop.marca} {r.laptop.modelo}
                                                </p>
                                                <p className="text-muted-foreground text-xs">{r.explicacion.badges.join(' · ')}</p>
                                                <p className="mt-1 font-mono text-sm text-cyan-600 dark:text-cyan-400">
                                                    S/ {Number(r.laptop.precio_soles).toLocaleString('es-PE')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
