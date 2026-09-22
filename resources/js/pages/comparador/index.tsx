import { flujoStorage } from '@/lib/flujo-storage';
import AppLayout from '@/layouts/app-layout';
import type { Catalogos, Laptop } from '@/types/flujo';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Comparador', href: '/comparador' }];

type Fila = [string, (e: Laptop) => string];

const FILAS: Fila[] = [
    ['Tipo', (e) => (e.tipo === 'laptop' ? 'Laptop' : 'PC de escritorio')],
    ['Procesador', (e) => e.cpu],
    ['Puntaje de rendimiento', (e) => `${e.rendimiento_score}/100`],
    ['RAM', (e) => `${e.ram_gb} GB`],
    ['Almacenamiento', (e) => `${e.almacenamiento_tipo} ${e.almacenamiento_gb} GB`],
    ['Gráficos', (e) => `${e.gpu_dedicada ? 'Dedicada — ' : 'Integrada — '}${e.gpu ?? ''}`],
    ['Batería', (e) => (e.bateria_horas ? `${e.bateria_horas} h` : '—')],
    ['Tienda de referencia', (e) => e.tienda ?? '—'],
    ['Precio', (e) => `S/ ${Number(e.precio_soles).toLocaleString('es-PE')}`],
];

export default function ComparadorIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [ids, setIds] = useState<number[]>([]);

    useEffect(() => {
        setIds(flujoStorage.leerComparar());
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos);
    }, []);

    const equipos = (catalogos?.hardware ?? []).filter((h) => ids.includes(h.id));

    function vaciar() {
        flujoStorage.guardarComparar([]);
        setIds([]);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comparador" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Comparador</h1>
                    {equipos.length > 0 && (
                        <button onClick={vaciar} className="text-sm text-muted-foreground underline hover:text-foreground">
                            Vaciar selección
                        </button>
                    )}
                </div>

                {catalogos && equipos.length < 2 ? (
                    <div className="rounded-xl border p-10 text-center text-muted-foreground">
                        <p>Selecciona al menos 2 equipos desde el catálogo de hardware para compararlos.</p>
                        <Link href="/hardware" className="mt-4 inline-block rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white hover:bg-cyan-600">
                            Ir al catálogo
                        </Link>
                    </div>
                ) : !catalogos ? (
                    <div className="h-64 animate-pulse rounded-xl bg-muted" />
                ) : (
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="px-4 py-3 text-left text-muted-foreground">Criterio</th>
                                    {equipos.map((e) => (
                                        <th key={e.id} className="px-4 py-3 text-left font-bold">
                                            {e.marca} {e.modelo}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {FILAS.map(([label, fn]) => (
                                    <tr key={label} className="border-t">
                                        <td className="px-4 py-3 text-muted-foreground">{label}</td>
                                        {equipos.map((e) => (
                                            <td key={e.id} className="px-4 py-3 font-mono">
                                                {fn(e)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
