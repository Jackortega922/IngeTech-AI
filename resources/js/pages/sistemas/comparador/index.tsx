import LaptopImage from '@/components/laptop-image';
import AppLayout from '@/layouts/app-layout';
import { flujoStorage } from '@/lib/flujo-storage';
import { PUERTO_ETIQUETA } from '@/lib/guia-compra';
import GuiaCompra from '@/pages/sistemas/comparador/guia-compra';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type { Catalogos, Laptop } from '@/types/flujo';
import { Head, Link, usePage } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Comparador', href: '/comparador' }];

interface Fila {
    label: string;
    texto: (e: Laptop) => string;
    // Si la fila tiene un "mejor" claro, de dónde sale el número y si gana el mayor o el menor.
    valor?: (e: Laptop) => number;
    gana?: 'mayor' | 'menor';
}

const FILAS: Fila[] = [
    { label: 'Procesador', texto: (e) => e.cpu },
    { label: 'Puntaje de rendimiento', texto: (e) => `${e.rendimiento_score}/100`, valor: (e) => e.rendimiento_score ?? 0, gana: 'mayor' },
    { label: 'RAM', texto: (e) => `${e.ram_gb} GB`, valor: (e) => e.ram_gb, gana: 'mayor' },
    {
        label: 'RAM ampliable hasta',
        texto: (e) => (e.ram_ampliable_gb ? `${e.ram_ampliable_gb} GB` : '—'),
        valor: (e) => e.ram_ampliable_gb ?? e.ram_gb,
        gana: 'mayor',
    },
    {
        label: 'Almacenamiento',
        texto: (e) => `${e.almacenamiento_tipo} ${e.almacenamiento_gb} GB`,
        valor: (e) => e.almacenamiento_gb,
        gana: 'mayor',
    },
    { label: 'Gráficos', texto: (e) => `${e.gpu_dedicada ? 'Dedicada — ' : 'Integrada — '}${e.gpu ?? ''}` },
    { label: 'Batería', texto: (e) => (e.bateria_horas ? `${e.bateria_horas} h` : '—'), valor: (e) => e.bateria_horas ?? 0, gana: 'mayor' },
    {
        label: 'Pantalla',
        texto: (e) => (e.pantalla_pulgadas ? `${e.pantalla_pulgadas}" · ${e.pantalla_resolucion ?? '—'} · ${e.pantalla_hz ?? 60} Hz` : '—'),
    },
    // Sin dato de peso no compite: se toma como el peor valor posible.
    { label: 'Peso', texto: (e) => (e.peso_kg ? `${e.peso_kg} kg` : '—'), valor: (e) => e.peso_kg ?? 99, gana: 'menor' },
    { label: 'Puertos', texto: (e) => (e.puertos?.length ? e.puertos.map((p) => PUERTO_ETIQUETA[p] ?? p).join(', ') : '—') },
    { label: 'Tienda de referencia', texto: (e) => e.tienda ?? '—' },
    {
        label: 'Precio',
        texto: (e) => `S/ ${Number(e.precio_soles).toLocaleString('es-PE')}`,
        valor: (e) => Number(e.precio_soles),
        gana: 'menor',
    },
];

// IDs que ganan la fila. Si todas empatan, no se resalta ninguna (no ayuda a decidir).
function ganadoresDe(fila: Fila, equipos: Laptop[]): number[] {
    if (!fila.valor || !fila.gana) return [];
    const valores = equipos.map((e) => fila.valor!(e));
    const objetivo = fila.gana === 'mayor' ? Math.max(...valores) : Math.min(...valores);
    const ganadores = equipos.filter((e) => fila.valor!(e) === objetivo).map((e) => e.id);
    return ganadores.length === equipos.length ? [] : ganadores;
}

export default function ComparadorIndex() {
    const { auth } = usePage<SharedData>().props;
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [ids, setIds] = useState<number[]>([]);

    useEffect(() => {
        setIds(flujoStorage.leerComparar());
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos);
    }, []);

    const equipos = useMemo(() => (catalogos?.hardware ?? []).filter((h) => ids.includes(h.id)), [catalogos, ids]);

    function vaciar() {
        flujoStorage.guardarComparar([]);
        setIds([]);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comparador" />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Comparador</h1>
                    {equipos.length > 0 && (
                        <button onClick={vaciar} className="text-muted-foreground hover:text-foreground text-sm underline">
                            Vaciar selección
                        </button>
                    )}
                </div>

                {catalogos && equipos.length < 2 ? (
                    <div className="text-muted-foreground rounded-xl border p-10 text-center">
                        <p>Selecciona al menos 2 equipos desde el catálogo de hardware para compararlos.</p>
                        <Link href="/hardware" className="mt-4 inline-block rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white hover:bg-cyan-600">
                            Ir al catálogo
                        </Link>
                    </div>
                ) : !catalogos ? (
                    <div className="bg-muted h-64 animate-pulse rounded-xl" />
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50">
                                        <th className="text-muted-foreground bg-muted sticky left-0 z-10 px-3 py-3 text-left sm:px-4">Criterio</th>
                                        {equipos.map((e) => (
                                            <th key={e.id} className="min-w-[8.5rem] px-3 py-3 text-left align-top font-bold sm:px-4">
                                                <LaptopImage
                                                    imagenUrl={e.imagen_url}
                                                    marca={e.marca}
                                                    tipo={e.tipo}
                                                    className="mb-2 h-12 w-16 rounded-lg sm:h-16 sm:w-24"
                                                />
                                                {e.marca} {e.modelo}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {FILAS.map((fila) => {
                                        const ganadores = ganadoresDe(fila, equipos);
                                        return (
                                            <tr key={fila.label} className="border-t">
                                                <td className="text-muted-foreground bg-background sticky left-0 z-10 px-3 py-3 text-xs sm:px-4 sm:text-sm">
                                                    {fila.label}
                                                </td>
                                                {equipos.map((e) => (
                                                    <td
                                                        key={e.id}
                                                        className={`px-3 py-3 text-xs sm:px-4 sm:font-mono sm:text-sm ${
                                                            ganadores.includes(e.id) ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''
                                                        }`}
                                                    >
                                                        {fila.texto(e)}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            En verde, el mejor valor de cada fila.<span className="sm:hidden"> Desliza la tabla hacia los lados para ver todas.</span>
                        </p>

                        <GuiaCompra equipos={equipos} />

                        <div className="flex flex-col items-start gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm">
                                Esta guía usa reglas fijas. Si le cuentas tu carrera u ocupación, tus actividades y tu presupuesto, la{' '}
                                <strong>recomendación con IA</strong> calcula qué laptop te conviene a ti.
                            </p>
                            <Link
                                href={auth.user ? '/perfil' : '/register'}
                                className="flex shrink-0 items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-600"
                            >
                                <Sparkles className="h-4 w-4" />
                                {auth.user ? 'Pedir recomendación' : 'Crear cuenta y probar la IA'}
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
