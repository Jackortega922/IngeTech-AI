import DeviceIllustration from '@/components/device-illustration';
import AppLayout from '@/layouts/app-layout';
import { flujoStorage } from '@/lib/flujo-storage';
import { type BreadcrumbItem } from '@/types';
import type { Catalogos } from '@/types/flujo';
import { Head, Link } from '@inertiajs/react';
import { BatteryFull, Cpu, HardDrive, MonitorSmartphone, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Catálogo de hardware', href: '/hardware' }];

export default function HardwareIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [seleccion, setSeleccion] = useState<number[]>([]);

    useEffect(() => {
        setSeleccion(flujoStorage.leerComparar());
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos);
    }, []);

    function toggle(id: number) {
        setSeleccion((prev) => {
            let next: number[];
            if (prev.includes(id)) next = prev.filter((x) => x !== id);
            else if (prev.length >= 3) return prev;
            else next = [...prev, id];
            flujoStorage.guardarComparar(next);
            return next;
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catálogo de hardware" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Catálogo de hardware</h1>
                        <p className="text-muted-foreground">Marca hasta 3 equipos (⚖️) para compararlos lado a lado.</p>
                    </div>
                    <Link
                        href={seleccion.length >= 2 ? '/comparador' : '#'}
                        aria-disabled={seleccion.length < 2}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${
                            seleccion.length >= 2 ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-muted text-muted-foreground pointer-events-none'
                        }`}
                    >
                        <Scale className="h-4 w-4" /> Comparar ({seleccion.length})
                    </Link>
                </div>

                {!catalogos ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-muted h-80 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {catalogos.hardware.map((h) => (
                            <div
                                key={h.id}
                                className={`flex flex-col overflow-hidden rounded-xl border transition ${
                                    seleccion.includes(h.id) ? 'border-cyan-500 ring-1 ring-cyan-500' : 'hover:border-cyan-500/40'
                                }`}
                            >
                                <DeviceIllustration marca={h.marca} tipo={h.tipo} className="h-36 w-full rounded-none" />

                                <div className="flex flex-1 flex-col p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                                {h.tipo === 'laptop' ? 'Laptop' : 'PC de escritorio'} · {h.marca}
                                            </p>
                                            <h3 className="font-bold">{h.modelo}</h3>
                                        </div>
                                        <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
                                            <input
                                                type="checkbox"
                                                checked={seleccion.includes(h.id)}
                                                onChange={() => toggle(h.id)}
                                                className="h-4 w-4 accent-cyan-500"
                                            />
                                            <Scale className="h-3.5 w-3.5" />
                                        </label>
                                    </div>

                                    {h.descripcion && <p className="text-muted-foreground mt-2 text-sm">{h.descripcion}</p>}

                                    <div className="text-muted-foreground mt-3 grid grid-cols-2 gap-1.5 text-xs">
                                        <span className="flex items-center gap-1">
                                            <Cpu className="h-3.5 w-3.5" /> {h.cpu}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="h-3.5 w-3.5" /> {h.ram_gb} GB · {h.almacenamiento_gb} GB
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MonitorSmartphone className="h-3.5 w-3.5" /> {h.gpu_dedicada ? 'GPU dedicada' : 'Integrada'}
                                        </span>
                                        {h.bateria_horas && (
                                            <span className="flex items-center gap-1">
                                                <BatteryFull className="h-3.5 w-3.5" /> ~{h.bateria_horas}h
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-baseline justify-between border-t pt-3">
                                        <span className="font-mono text-xl font-bold text-cyan-600 dark:text-cyan-400">
                                            S/ {Number(h.precio_soles).toLocaleString('es-PE')}
                                        </span>
                                        <span className="text-muted-foreground text-xs">{h.tienda}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
