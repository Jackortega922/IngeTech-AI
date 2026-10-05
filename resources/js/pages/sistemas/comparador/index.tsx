import LaptopImage from '@/components/laptop-image';
import AppLayout from '@/layouts/app-layout';
import { flujoStorage } from '@/lib/flujo-storage';
import { PUERTO_ETIQUETA } from '@/lib/guia-compra';
import GuiaCompra from '@/pages/sistemas/comparador/guia-compra';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type { Catalogos, Laptop } from '@/types/flujo';
import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronRight, Scale, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Comparador', href: '/comparador' }];

// Hasta 3 laptops lado a lado (igual que en el catálogo).
const MAX_COMPARAR = 3;

const soles = (n: number | string) => `S/ ${Number(n).toLocaleString('es-PE')}`;

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
    { label: 'Precio', texto: (e) => soles(e.precio_soles), valor: (e) => Number(e.precio_soles), gana: 'menor' },
];

// IDs que ganan la fila. Si todas empatan, no se resalta ninguna (no ayuda a decidir).
function ganadoresDe(fila: Fila, equipos: Laptop[]): number[] {
    if (!fila.valor || !fila.gana) return [];
    const valores = equipos.map((e) => fila.valor!(e));
    const objetivo = fila.gana === 'mayor' ? Math.max(...valores) : Math.min(...valores);
    const ganadores = equipos.filter((e) => fila.valor!(e) === objetivo).map((e) => e.id);
    return ganadores.length === equipos.length ? [] : ganadores;
}

// Tailwind necesita las clases completas escritas: una plantilla por cantidad de equipos. En
// celular la etiqueta ocupa toda la fila y los valores van lado a lado debajo.
const GRID: Record<number, { fila: string; etiqueta: string }> = {
    2: { fila: 'grid grid-cols-2 md:grid-cols-[190px_1fr_1fr]', etiqueta: 'col-span-2 md:col-span-1' },
    3: { fila: 'grid grid-cols-3 md:grid-cols-[190px_1fr_1fr_1fr]', etiqueta: 'col-span-3 md:col-span-1' },
};

// Diseño: Marco (PR #41). Lógica de main: hasta 3 equipos, filas de pantalla/peso/puertos, sin
// resaltar empates, guía para decidir e invitación a la recomendación con IA.
export default function ComparadorIndex() {
    const { auth } = usePage<SharedData>().props;
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [ids, setIds] = useState<number[]>([]);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [replaceId, setReplaceId] = useState<number | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const idsGuardados = flujoStorage.leerComparar();
        setIds(idsGuardados);

        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data: Catalogos) => {
                setCatalogos(data);

                // Si administración eliminó un equipo, no dejamos su ID huérfano en el comparador.
                const validIds = idsGuardados.filter((id) => data.hardware.some((h) => h.id === id)).slice(0, MAX_COMPARAR);
                flujoStorage.guardarComparar(validIds);
                setIds(validIds);
            })
            .catch(() => setError('No se pudo cargar el catálogo. Intenta nuevamente.'));
    }, []);

    const equipos = useMemo(() => {
        if (!catalogos) return [];
        return ids.map((id) => catalogos.hardware.find((h) => h.id === id)).filter(Boolean) as Laptop[];
    }, [catalogos, ids]);

    function guardar(next: number[]) {
        flujoStorage.guardarComparar(next);
        setIds(next);
    }

    function remove(id: number) {
        guardar(ids.filter((itemId) => itemId !== id));
    }

    function openSelector(id: number | null = null) {
        setReplaceId(id);
        setSelectorOpen(true);
    }

    function selectReplacement(id: number) {
        let next: number[];
        if (replaceId !== null) next = ids.map((current) => (current === replaceId ? id : current));
        else if (ids.length < MAX_COMPARAR) next = [...ids, id];
        else return;

        guardar([...new Set(next)].slice(0, MAX_COMPARAR));
        setSelectorOpen(false);
        setReplaceId(null);
    }

    const grid = GRID[equipos.length] ?? GRID[2];
    const rendimientos = equipos.map((e) => e.rendimiento_score ?? 0);
    const precios = equipos.map((e) => Number(e.precio_soles));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comparador" />

            <main className="it-container min-w-0 py-7 sm:py-9">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <span className="it-eyebrow">COMPARADOR DE LAPTOPS</span>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Compara tus equipos</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Elige hasta {MAX_COMPARAR} laptops del catálogo y revisa sus especificaciones lado a lado.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {equipos.length >= 2 && equipos.length < MAX_COMPARAR && (
                            <button onClick={() => openSelector()} className="it-btn it-btn-secondary">
                                Agregar equipo <Scale className="h-4 w-4" />
                            </button>
                        )}
                        <Link href="/hardware" className="it-btn it-btn-secondary">
                            Catálogo <ChevronRight className="h-4 w-4" />
                        </Link>
                        {ids.length > 0 && (
                            <button onClick={() => guardar([])} className="it-btn it-btn-ghost">
                                Vaciar
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

                {!catalogos && !error ? (
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        <div className="it-skeleton h-96" />
                        <div className="it-skeleton h-96" />
                    </div>
                ) : !catalogos ? null : equipos.length < 2 ? (
                    <EmptyComparison selected={equipos[0]} onAdd={() => openSelector()} onRemove={() => equipos[0] && remove(equipos[0].id)} />
                ) : (
                    <>
                        <section className="mt-8 overflow-hidden rounded-[2rem] border bg-white shadow-sm dark:bg-slate-950">
                            <div className={grid.fila}>
                                <div className="hidden border-r bg-slate-50 p-5 md:block dark:bg-slate-900">
                                    <p className="text-xs font-black tracking-wider text-slate-400 uppercase">Equipo</p>
                                    <p className="mt-2 text-sm text-slate-500">{equipos.length} seleccionados</p>
                                </div>
                                {equipos.map((e) => (
                                    <ComparisonHeader key={e.id} equipo={e} onRemove={() => remove(e.id)} onChange={() => openSelector(e.id)} />
                                ))}
                            </div>

                            <div className="border-t">
                                {FILAS.map((fila) => (
                                    <ComparisonRow key={fila.label} fila={fila} equipos={equipos} grid={grid} />
                                ))}
                            </div>
                        </section>
                        <p className="mt-2 text-xs text-slate-500">
                            "Mejor dato" marca el valor más conveniente de cada fila; si todos empatan, no se marca.
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <MetricCard
                                label="Diferencia de precio"
                                value={soles(Math.max(...precios) - Math.min(...precios))}
                                detail="Entre la más barata y la más cara."
                            />
                            <MetricCard
                                label="Rendimiento"
                                value={rendimientos.join(' vs ')}
                                detail="Puntaje de 0 a 100 registrado en el catálogo."
                            />
                            <MetricCard
                                label="RAM"
                                value={equipos.map((e) => `${e.ram_gb} GB`).join(' vs ')}
                                detail="Memoria instalada en cada equipo."
                            />
                        </div>

                        <GuiaCompra equipos={equipos} />

                        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-[var(--it-primary)]/20 bg-[var(--it-primary-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm">
                                Esta guía usa reglas fijas. Si le cuentas tu carrera u ocupación, tus actividades y tu presupuesto, la{' '}
                                <strong>recomendación con IA</strong> calcula qué laptop te conviene a ti.
                            </p>
                            <Link href={auth.user ? '/perfil' : '/register'} className="it-btn it-btn-primary shrink-0">
                                <Sparkles className="h-4 w-4" />
                                {auth.user ? 'Pedir recomendación' : 'Crear cuenta y probar la IA'}
                            </Link>
                        </div>
                    </>
                )}
            </main>

            <SelectorModal
                open={selectorOpen}
                catalogos={catalogos}
                selectedIds={ids}
                replaceId={replaceId}
                onClose={() => setSelectorOpen(false)}
                onSelect={selectReplacement}
            />
        </AppLayout>
    );
}

function EmptyComparison({ selected, onAdd, onRemove }: { selected?: Laptop; onAdd: () => void; onRemove: () => void }) {
    return (
        <section className="mt-8 rounded-[2rem] border border-dashed bg-white p-6 shadow-sm sm:p-10 dark:bg-slate-950">
            {selected ? (
                <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="flex items-center gap-4">
                        <EquipoThumb equipo={selected} className="h-24 w-32" />
                        <div>
                            <p className="text-xs font-black tracking-wider text-[var(--it-primary)] uppercase dark:text-sky-300">Equipo 1</p>
                            <h2 className="mt-1 text-xl font-black">
                                {selected.marca} {selected.modelo}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">Falta seleccionar al menos un equipo más.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={onRemove} className="it-btn it-btn-secondary">
                            Quitar
                        </button>
                        <button onClick={onAdd} className="it-btn it-btn-primary">
                            Agregar equipo <Scale className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
                        <Scale className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-xl font-black">Aún no hay equipos para comparar</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                        Marca de 2 a {MAX_COMPARAR} laptops desde el catálogo. La selección se conserva al volver a esta pantalla.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <Link href="/hardware" className="it-btn it-btn-primary">
                            Ir al catálogo <ChevronRight className="h-4 w-4" />
                        </Link>
                        <button onClick={onAdd} className="it-btn it-btn-secondary">
                            Seleccionar aquí
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

function ComparisonHeader({ equipo, onRemove, onChange }: { equipo: Laptop; onRemove: () => void; onChange: () => void }) {
    return (
        <div className="min-w-0 border-r p-3 last:border-r-0 sm:p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
                <EquipoThumb equipo={equipo} className="h-16 w-full shrink-0 sm:h-20 lg:w-28" />
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black tracking-wider text-[var(--it-primary)] uppercase dark:text-sky-300">{equipo.marca}</p>
                    <h2 className="mt-1 text-sm font-black sm:text-base">{equipo.modelo}</h2>
                    <p className="mt-1 text-base font-black sm:text-lg">{soles(equipo.precio_soles)}</p>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={onChange} className="it-btn it-btn-secondary h-8 flex-1 px-2 text-xs">
                    Cambiar
                </button>
                <button onClick={onRemove} className="it-btn it-btn-ghost h-8 px-2 text-xs">
                    Quitar
                </button>
            </div>
        </div>
    );
}

function ComparisonRow({ fila, equipos, grid }: { fila: Fila; equipos: Laptop[]; grid: { fila: string; etiqueta: string } }) {
    const ganadores = ganadoresDe(fila, equipos);

    return (
        <div className={grid.fila}>
            <div
                className={`border-b bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 md:border-r md:px-5 md:py-3 dark:bg-slate-900 ${grid.etiqueta}`}
            >
                {fila.label}
            </div>
            {equipos.map((equipo) => {
                const mejor = ganadores.includes(equipo.id);
                return (
                    <div
                        key={equipo.id}
                        className="flex min-w-0 flex-col items-start gap-1 border-b p-3 text-xs sm:text-sm md:p-4 xl:flex-row xl:items-center"
                    >
                        <span className={`min-w-0 flex-1 break-words ${mejor ? 'font-bold text-emerald-700 dark:text-emerald-300' : ''}`}>
                            {fila.texto(equipo)}
                        </span>
                        {mejor && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                Mejor dato
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function EquipoThumb({ equipo, className = 'h-20 w-28' }: { equipo: Laptop; className?: string }) {
    return (
        <div className={`overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 ${className}`}>
            <LaptopImage imagenUrl={equipo.imagen_url} marca={equipo.marca} tipo={equipo.tipo} className="h-full w-full" />
        </div>
    );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <article className="rounded-2xl border bg-white p-5 dark:bg-slate-950">
            <p className="text-xs font-black tracking-wider text-slate-400 uppercase">{label}</p>
            <p className="mt-2 text-xl font-black">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </article>
    );
}

function SelectorModal({
    open,
    catalogos,
    selectedIds,
    replaceId,
    onClose,
    onSelect,
}: {
    open: boolean;
    catalogos: Catalogos | null;
    selectedIds: number[];
    replaceId: number | null;
    onClose: () => void;
    onSelect: (id: number) => void;
}) {
    if (!open || !catalogos) return null;

    // Se ofrecen las laptops que aún no están en la comparación.
    const disponibles = catalogos.hardware.filter((item) => !selectedIds.includes(item.id));

    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="it-modal-header">
                    <div>
                        <p className="it-eyebrow">SELECCIÓN DE EQUIPO</p>
                        <h2 className="mt-1 text-2xl font-black">{replaceId === null ? 'Agregar equipo' : 'Cambiar equipo'}</h2>
                        <p className="mt-1 text-sm text-slate-500">Elige una laptop del catálogo actual.</p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar" className="it-icon-btn">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="it-modal-body">
                    {disponibles.length === 0 ? (
                        <p className="text-sm text-slate-500">No quedan más laptops en el catálogo para agregar.</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {disponibles.map((equipo) => (
                                <button
                                    key={equipo.id}
                                    onClick={() => onSelect(equipo.id)}
                                    className="rounded-2xl border p-3 text-left transition hover:border-sky-300 hover:shadow-md"
                                >
                                    <div className="flex gap-3">
                                        <EquipoThumb equipo={equipo} className="h-20 w-28 shrink-0 rounded-xl" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black tracking-wider text-[var(--it-primary)] uppercase dark:text-sky-300">
                                                {equipo.marca}
                                            </p>
                                            <h3 className="truncate font-black">{equipo.modelo}</h3>
                                            <p className="mt-1 text-sm font-bold">{soles(equipo.precio_soles)}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {equipo.ram_gb} GB RAM · {equipo.almacenamiento_gb} GB
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
