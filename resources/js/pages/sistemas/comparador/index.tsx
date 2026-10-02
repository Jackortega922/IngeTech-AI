import DeviceIllustration from '@/components/device-illustration';
import AppLayout from '@/layouts/app-layout';
import { getCatalogImage } from '@/lib/catalog-images';
import { flujoStorage } from '@/lib/flujo-storage';
import type { BreadcrumbItem } from '@/types';
import type { Catalogos, Laptop } from '@/types/flujo';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Minus, Scale, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import GuiaCompra from './guia-compra';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Comparador', href: '/comparador' }];
const MAX_COMPARAR = 2;

type Fila = {
    label: string;
    getValue: (e: Laptop) => string;
    getNumeric?: (e: Laptop) => number | null;
    higherIsBetter?: boolean;
};

const FILAS: Fila[] = [
    { label: 'Tipo', getValue: (e) => (e.tipo === 'laptop' ? 'Laptop' : 'PC de escritorio') },
    { label: 'Procesador', getValue: (e) => e.cpu || '—' },
    {
        label: 'Puntaje de rendimiento',
        getValue: (e) => (e.rendimiento_score == null ? '—' : `${e.rendimiento_score}/100`),
        getNumeric: (e) => e.rendimiento_score,
        higherIsBetter: true,
    },
    {
        label: 'RAM',
        getValue: (e) => `${e.ram_gb} GB`,
        getNumeric: (e) => Number(e.ram_gb),
        higherIsBetter: true,
    },
    {
        label: 'Almacenamiento',
        getValue: (e) => `${e.almacenamiento_tipo} ${e.almacenamiento_gb} GB`,
        getNumeric: (e) => Number(e.almacenamiento_gb),
        higherIsBetter: true,
    },
    {
        label: 'Gráficos',
        getValue: (e) => `${e.gpu_dedicada ? 'Dedicada — ' : 'Integrada — '}${e.gpu ?? ''}`,
        getNumeric: (e) => (e.gpu_dedicada ? 1 : 0),
        higherIsBetter: true,
    },
    {
        label: 'Batería',
        getValue: (e) => (e.bateria_horas ? `${e.bateria_horas} h` : '—'),
        getNumeric: (e) => e.bateria_horas,
        higherIsBetter: true,
    },
    { label: 'Tienda de referencia', getValue: (e) => e.tienda ?? '—' },
    {
        label: 'Precio',
        getValue: (e) => `S/ ${Number(e.precio_soles).toLocaleString('es-PE')}`,
        getNumeric: (e) => Number(e.precio_soles),
        higherIsBetter: false,
    },
];

export default function ComparadorIndex() {
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

                // Mantiene compatibles los equipos cargados/actualizados desde administración.
                const validIds = idsGuardados.filter((id) => data.hardware.some((h) => Number(h.id) === Number(id)));
                flujoStorage.guardarComparar(validIds);
                setIds(validIds);
            })
            .catch(() => setError('No se pudo cargar el catálogo de hardware. Intenta nuevamente.'));
    }, []);

    const equipos = useMemo(() => {
        if (!catalogos) return [];
        return ids.map((id) => catalogos.hardware.find((h) => Number(h.id) === Number(id))).filter(Boolean) as Laptop[];
    }, [catalogos, ids]);

    function remove(id: number) {
        const next = ids.filter((itemId) => Number(itemId) !== Number(id));
        flujoStorage.guardarComparar(next);
        setIds(next);
    }

    function openSelector(id: number | null = null) {
        setReplaceId(id);
        setSelectorOpen(true);
    }

    function selectReplacement(id: number) {
        let next: number[];

        if (replaceId !== null) {
            next = ids.map((current) => (Number(current) === Number(replaceId) ? Number(id) : Number(current)));
        } else if (ids.length < MAX_COMPARAR) {
            next = [...ids, Number(id)];
        } else {
            return;
        }

        next = [...new Set(next)].slice(0, MAX_COMPARAR);
        flujoStorage.guardarComparar(next);
        setIds(next);
        setSelectorOpen(false);
        setReplaceId(null);
    }

    function clear() {
        flujoStorage.guardarComparar([]);
        setIds([]);
    }

    const priceDifference = equipos.length === 2 ? Math.abs(Number(equipos[0].precio_soles) - Number(equipos[1].precio_soles)) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comparador" />

            <main className="it-container py-7 sm:py-9">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <span className="it-eyebrow">COMPARADOR DE HARDWARE</span>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Compara tus equipos</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Selecciona hasta 2 equipos del catálogo y revisa sus especificaciones lado a lado.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/hardware" className="it-btn it-btn-secondary">
                            Catálogo <ChevronRight className="h-4 w-4" />
                        </Link>
                        {ids.length > 0 && (
                            <button onClick={clear} className="it-btn it-btn-ghost">
                                Limpiar
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
                ) : equipos.length < 2 ? (
                    <EmptyComparison selected={equipos[0]} onAdd={() => openSelector()} onRemove={() => equipos[0] && remove(equipos[0].id)} />
                ) : (
                    <>
                        <section className="mt-8 overflow-hidden rounded-[2rem] border bg-white shadow-sm dark:bg-slate-950">
                            <div className="grid md:grid-cols-[190px_1fr_1fr]">
                                <div className="hidden border-r bg-slate-50 p-5 md:block dark:bg-slate-900">
                                    <p className="text-xs font-black tracking-wider text-slate-400 uppercase">Equipo</p>
                                    <p className="mt-2 text-sm text-slate-500">2 seleccionados</p>
                                </div>
                                {equipos.map((e) => (
                                    <ComparisonHeader key={e.id} equipo={e} onRemove={() => remove(e.id)} onChange={() => openSelector(e.id)} />
                                ))}
                            </div>

                            <div className="border-t">
                                {FILAS.map((fila) => (
                                    <ComparisonRow key={fila.label} fila={fila} equipos={equipos} />
                                ))}
                            </div>
                        </section>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <MetricCard
                                label="Diferencia de precio"
                                value={`S/ ${priceDifference.toLocaleString('es-PE')}`}
                                detail="Diferencia absoluta entre los dos precios."
                            />
                            <MetricCard
                                label="Rendimiento"
                                value={`${equipos[0].rendimiento_score ?? '—'} vs ${equipos[1].rendimiento_score ?? '—'}`}
                                detail="Puntaje registrado en el catálogo."
                            />
                            <MetricCard
                                label="RAM"
                                value={`${equipos[0].ram_gb} GB vs ${equipos[1].ram_gb} GB`}
                                detail="Memoria instalada en cada equipo."
                            />
                        </div>

                        <GuiaCompra equipos={equipos} />
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
                            <p className="text-xs font-black tracking-wider text-[var(--it-primary)] uppercase">Equipo 1</p>
                            <h2 className="mt-1 text-xl font-black">
                                {selected.marca} {selected.modelo}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">Falta seleccionar un segundo equipo.</p>
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
                        Selecciona 2 equipos desde el catálogo de hardware. La selección se conservará al volver a esta pantalla.
                    </p>
                    <div className="mt-5 flex justify-center gap-2">
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
        <div className="border-b p-4 last:border-r-0 md:border-r md:border-b-0 md:p-5">
            <div className="flex gap-3">
                <EquipoThumb equipo={equipo} className="h-20 w-28 shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black tracking-wider text-[var(--it-primary)] uppercase">{equipo.marca}</p>
                    <h2 className="mt-1 truncate font-black">{equipo.modelo}</h2>
                    <p className="mt-1 text-lg font-black">S/ {Number(equipo.precio_soles).toLocaleString('es-PE')}</p>
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <button onClick={onChange} className="it-btn it-btn-secondary h-9 flex-1 px-3 text-xs">
                    Cambiar
                </button>
                <button onClick={onRemove} className="it-btn it-btn-ghost h-9 px-3 text-xs">
                    Quitar
                </button>
            </div>
        </div>
    );
}

function ComparisonRow({ fila, equipos }: { fila: Fila; equipos: Laptop[] }) {
    const values = equipos.map((e) => fila.getNumeric?.(e) ?? null);
    const comparable = values.length === 2 && values.every((value) => value !== null && Number.isFinite(value));
    const firstIsBetter = comparable && values[0] !== values[1] ? (fila.higherIsBetter ? values[0]! > values[1]! : values[0]! < values[1]!) : false;
    const secondIsBetter = comparable && values[0] !== values[1] ? (fila.higherIsBetter ? values[1]! > values[0]! : values[1]! < values[0]!) : false;

    return (
        <div className="grid md:grid-cols-[190px_1fr_1fr]">
            <div className="border-b bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 md:border-r md:px-5 dark:bg-slate-900">{fila.label}</div>
            {equipos.map((equipo, index) => {
                const better = index === 0 ? firstIsBetter : secondIsBetter;
                const equal = comparable && values[0] === values[1];
                return (
                    <div key={equipo.id} className="flex items-center gap-2 border-b p-3 text-sm md:p-4">
                        <span className={`min-w-0 flex-1 ${better ? 'font-bold text-sky-700 dark:text-sky-300' : ''}`}>{fila.getValue(equipo)}</span>
                        {better && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                Mejor dato
                            </span>
                        )}
                        {equal && comparable && <Minus className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    </div>
                );
            })}
        </div>
    );
}

function EquipoThumb({ equipo, className = 'h-20 w-28' }: { equipo: Laptop; className?: string }) {
    const image = getCatalogImage('hardware', equipo.id, equipo.imagen_url);
    return (
        <div className={`overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 ${className}`}>
            {image ? (
                <img src={image} alt={`${equipo.marca} ${equipo.modelo}`} className="h-full w-full object-cover" />
            ) : (
                <DeviceIllustration marca={equipo.marca} tipo={equipo.tipo} imagenUrl={null} className="h-full w-full" />
            )}
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

    const disponibles = catalogos.hardware.filter((item) => {
        const isCurrent = replaceId !== null && Number(item.id) === Number(replaceId);
        return isCurrent || !selectedIds.some((id) => Number(id) === Number(item.id));
    });

    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="it-modal-header">
                    <div>
                        <p className="it-eyebrow">SELECCIÓN DE EQUIPO</p>
                        <h2 className="mt-1 text-2xl font-black">{replaceId === null ? 'Agregar equipo' : 'Cambiar equipo'}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Elige un equipo del catálogo actual, incluyendo los registrados desde administración.
                        </p>
                    </div>
                    <button onClick={onClose} className="it-icon-btn">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="it-modal-body">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {disponibles.map((equipo) => {
                            const image = getCatalogImage('hardware', equipo.id, equipo.imagen_url);
                            const current = replaceId !== null && Number(equipo.id) === Number(replaceId);
                            return (
                                <button
                                    key={equipo.id}
                                    onClick={() => !current && onSelect(Number(equipo.id))}
                                    disabled={current}
                                    className="rounded-2xl border p-3 text-left transition hover:border-sky-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <div className="flex gap-3">
                                        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                                            {image ? (
                                                <img src={image} alt={`${equipo.marca} ${equipo.modelo}`} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="grid h-full place-items-center font-black text-slate-300">IT</div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black tracking-wider text-[var(--it-primary)] uppercase">{equipo.marca}</p>
                                            <h3 className="truncate font-black">{equipo.modelo}</h3>
                                            <p className="mt-1 text-sm font-bold">S/ {Number(equipo.precio_soles).toLocaleString('es-PE')}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {equipo.ram_gb} GB RAM · {equipo.almacenamiento_gb} GB
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
