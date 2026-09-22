import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Catalogos, Kit } from '@/types/flujo';
import { Head } from '@inertiajs/react';
import { Percent, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Promociones', href: '/marketing' }];

/**
 * Aporte de Marketing: presenta los kits existentes (accesorios agrupados)
 * como promociones, calculando el ahorro real frente a comprar cada
 * accesorio por separado. No agrega datos nuevos — reusa Kit/Accesorio del
 * catálogo. Ver docs/contexto-proyecto.md §5.1.
 */
function ahorroDeKit(kit: Kit) {
    const precioSuelto = kit.accesorios.reduce((sum, a) => sum + Number(a.precio_soles), 0);
    const precioKit = Number(kit.precio_soles);
    const ahorro = Math.max(0, precioSuelto - precioKit);
    const porcentaje = precioSuelto > 0 ? Math.round((ahorro / precioSuelto) * 100) : 0;

    return { precioSuelto, precioKit, ahorro, porcentaje };
}

export default function MarketingIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);

    useEffect(() => {
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos)
            .catch(() => setCatalogos({ carreras: [], software: [], hardware: [], actividades: [], accesorios: [], kits: [] }));
    }, []);

    const kits = catalogos?.kits ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promociones" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Promociones</h1>
                    <p className="text-muted-foreground">Kits de accesorios con descuento frente a comprarlos por separado.</p>
                </div>

                {kits.length === 0 ? (
                    <div className="bg-card max-w-lg rounded-2xl border p-8 text-center shadow-sm">
                        <p className="text-muted-foreground text-sm">Todavía no hay kits promocionales cargados en el catálogo.</p>
                    </div>
                ) : (
                    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
                        {kits.map((kit) => {
                            const { precioSuelto, precioKit, ahorro, porcentaje } = ahorroDeKit(kit);

                            return (
                                <div key={kit.id} className="bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm">
                                    {porcentaje > 0 && (
                                        <span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                                            <Percent className="h-3 w-3" /> {porcentaje}% de ahorro
                                        </span>
                                    )}

                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
                                        <Tag className="h-5 w-5" />
                                    </div>

                                    <h3 className="pr-24 font-bold">{kit.nombre}</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">{kit.accesorios.map((a) => a.nombre).join(' · ')}</p>

                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="text-2xl font-bold">S/ {precioKit.toLocaleString('es-PE')}</span>
                                        {ahorro > 0 && (
                                            <span className="text-muted-foreground text-sm line-through">
                                                S/ {precioSuelto.toLocaleString('es-PE')}
                                            </span>
                                        )}
                                    </div>
                                    {ahorro > 0 && <p className="mt-1 text-xs text-emerald-600">Ahorras S/ {ahorro.toLocaleString('es-PE')}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
