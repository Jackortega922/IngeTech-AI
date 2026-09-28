import LaptopImage from '@/components/laptop-image';
import AppLayout from '@/layouts/app-layout';
import { compararPorTarea, tareasCumplidas, type ComparacionTarea } from '@/lib/comparador';
import { flujoStorage } from '@/lib/flujo-storage';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type { Catalogos, Laptop } from '@/types/flujo';
import { Head, Link, usePage } from '@inertiajs/react';
import { Check, Sparkles, Trophy, X, Zap } from 'lucide-react';
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
    const tareas = useMemo(() => compararPorTarea(equipos, catalogos?.actividades ?? []), [equipos, catalogos]);

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
                                        <th className="text-muted-foreground px-4 py-3 text-left">Criterio</th>
                                        {equipos.map((e) => (
                                            <th key={e.id} className="px-4 py-3 text-left font-bold">
                                                <LaptopImage
                                                    imagenUrl={e.imagen_url}
                                                    marca={e.marca}
                                                    tipo={e.tipo}
                                                    className="mb-2 h-16 w-24 rounded-lg"
                                                />
                                                {e.marca} {e.modelo}
                                                <p className="text-muted-foreground mt-1 text-xs font-normal">
                                                    Sirve para {tareasCumplidas(tareas, e.id)} de {tareas.length} tareas
                                                </p>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {FILAS.map((fila) => {
                                        const ganadores = ganadoresDe(fila, equipos);
                                        return (
                                            <tr key={fila.label} className="border-t">
                                                <td className="text-muted-foreground px-4 py-3">{fila.label}</td>
                                                {equipos.map((e) => (
                                                    <td
                                                        key={e.id}
                                                        className={`px-4 py-3 font-mono ${
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
                        <p className="text-muted-foreground text-xs">En verde, el mejor valor de cada fila.</p>

                        <GuiaPorTarea tareas={tareas} equipos={equipos} />

                        <div className="flex flex-col items-start gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm">
                                Esta guía usa reglas fijas por tarea. Si combinas varias tareas, tu carrera y tu presupuesto, la{' '}
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

function GuiaPorTarea({ tareas, equipos }: { tareas: ComparacionTarea[]; equipos: Laptop[] }) {
    const nombre = (id: number | null) => {
        const e = equipos.find((x) => x.id === id);
        return e ? `${e.marca} ${e.modelo}` : '';
    };

    return (
        <section className="mt-4">
            <h2 className="text-xl font-bold">¿Cuál conviene para cada tarea?</h2>
            <p className="text-muted-foreground mt-1 text-sm">
                Según lo que pide cada tarea en RAM, procesador y tarjeta gráfica. "Te conviene" es la más barata que cumple: pagar más potencia de la
                que la tarea usa no la hace mejor. Busca la tarea que vas a hacer más seguido.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                {tareas.map((t) => (
                    <article key={t.clave} className="bg-card rounded-xl border p-4">
                        <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-semibold">{t.nombre}</h3>
                            <span className="text-muted-foreground shrink-0 text-xs">
                                pide {t.requisito.ram_gb} GB · CPU {t.requisito.cpu_score}
                                {t.requisito.gpu_dedicada ? ' · GPU dedicada' : ''}
                            </span>
                        </div>

                        {t.conviene_id === null ? (
                            <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                                Ninguna de las que elegiste llega a lo que pide esta tarea.
                            </p>
                        ) : (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
                                    <Trophy className="h-3.5 w-3.5" /> Te conviene: {nombre(t.conviene_id)}
                                </span>
                                {t.potente_id !== null && (
                                    <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-violet-700 dark:text-violet-300">
                                        <Zap className="h-3.5 w-3.5" /> Más potencia: {nombre(t.potente_id)}
                                    </span>
                                )}
                            </div>
                        )}

                        <ul className="mt-3 space-y-1.5 text-sm">
                            {t.veredictos.map((v) => (
                                <li key={v.laptop_id} className="flex items-start gap-2">
                                    {v.cumple ? (
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    ) : (
                                        <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                    )}
                                    <span>
                                        <span className="font-medium">{nombre(v.laptop_id)}</span>
                                        <span className="text-muted-foreground">
                                            {v.cumple ? ' — cumple' : ` — se queda corta: ${v.faltas.join(', ')}`}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}
