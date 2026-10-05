import LaptopImage from '@/components/laptop-image';
import AppLayout from '@/layouts/app-layout';
import { flujoStorage } from '@/lib/flujo-storage';
import { disponibilidad } from '@/lib/inventario';
import { type BreadcrumbItem } from '@/types';
import type { Catalogos, Laptop } from '@/types/flujo';
import { Head, Link, router } from '@inertiajs/react';
import { BatteryFull, Check, Cpu, HardDrive, MonitorSmartphone, Scale, Search, ShoppingCart, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Catálogo de laptops', href: '/hardware' }];

// El comparador acepta hasta 3 equipos (la tabla de /comparador está pensada para 3 columnas).
const MAX_COMPARAR = 3;

const soles = (n: number | string) => `S/ ${Number(n).toLocaleString('es-PE')}`;

// Diseño: Marco (PR #41). Lógica de main: hasta 3 equipos en el comparador, foto real o
// ilustración por marca (LaptopImage) y botón "Comprar" que lleva a personalizar.
export default function HardwareIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Laptop | null>(null);
    const [compare, setCompare] = useState<number[]>([]);
    const [comparisonOpen, setComparisonOpen] = useState(false);
    const [compareMessage, setCompareMessage] = useState('');

    useEffect(() => {
        setCompare(flujoStorage.leerComparar());

        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data: Catalogos) => {
                setCatalogos(data);

                // Si administración eliminó un equipo, no dejamos su ID huérfano en el comparador.
                const validIds = flujoStorage.leerComparar().filter((id) => data.hardware.some((item) => item.id === id));
                flujoStorage.guardarComparar(validIds);
                setCompare(validIds);
            })
            .catch(() => setCatalogos({ carreras: [], software: [], hardware: [], actividades: [], accesorios: [], kits: [] }));
    }, []);

    const filtered = useMemo(
        () =>
            catalogos?.hardware.filter((x) => {
                const q = `${x.marca} ${x.modelo} ${x.cpu} ${x.gpu ?? ''}`.toLowerCase();
                return !query || q.includes(query.toLowerCase());
            }) ?? [],
        [catalogos, query],
    );

    const selectedEquipos = useMemo(
        () => compare.map((id) => catalogos?.hardware.find((item) => item.id === id)).filter(Boolean) as Laptop[],
        [catalogos, compare],
    );

    // Segundo camino, aparte de la recomendación con IA: elegir directo del catálogo y
    // personalizarla (RAM/almacenamiento/kits). /personalizar solo lee tarjeta.laptop para el
    // precio base — badges/compatibilidad_pct/recomendacion_id no aplican aquí porque esta
    // laptop no vino de una recomendación, así que quedan en un valor provisional sin uso.
    function comprar(laptop: Laptop) {
        flujoStorage.guardarSeleccionada({ laptop_id: laptop.id, laptop, badges: [], compatibilidad_pct: 0, recomendacion_id: 0 });
        router.visit('/personalizar');
    }

    function toggle(id: number) {
        setCompare((old) => {
            if (old.includes(id)) {
                const next = old.filter((x) => x !== id);
                flujoStorage.guardarComparar(next);
                setCompareMessage('');
                return next;
            }

            if (old.length >= MAX_COMPARAR) {
                setCompareMessage(`El comparador permite máximo ${MAX_COMPARAR} equipos. Quita uno para seleccionar otro.`);
                return old;
            }

            const next = [...old, id];
            flujoStorage.guardarComparar(next);
            setCompareMessage('');
            return next;
        });
    }

    function clearCompare() {
        flujoStorage.guardarComparar([]);
        setCompare([]);
        setCompareMessage('');
        setComparisonOpen(false);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catálogo de laptops" />

            <main className="it-container py-7 pb-32 sm:py-9 sm:pb-32">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-7 text-white shadow-xl sm:p-9">
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.18),transparent_55%)]" />
                    <div className="relative max-w-3xl">
                        <span className="it-badge border-white/10 bg-white/10 text-sky-200">CATÁLOGO DE LAPTOPS</span>
                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Laptops que puedes comparar y comprar.</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                            Explora especificaciones y precios. Marca hasta {MAX_COMPARAR} equipos (⚖️) para compararlos lado a lado.
                        </p>
                    </div>
                </section>

                <div className="it-card mt-6 p-4">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            className="it-input pl-10"
                            placeholder="Busca marca, modelo, CPU o GPU"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                {!catalogos ? (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="it-skeleton h-96" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="it-card mt-6 p-8 text-center text-sm text-slate-500">No hay laptops que coincidan con tu búsqueda.</p>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((item) => (
                            <HardwareCard
                                key={item.id}
                                item={item}
                                selected={compare.includes(item.id)}
                                onCompare={() => toggle(item.id)}
                                onOpen={() => setSelected(item)}
                                onComprar={() => comprar(item)}
                            />
                        ))}
                    </div>
                )}

                {compare.length > 0 && (
                    <div className="it-floating-detail flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                    <Scale className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">
                                        Comparador: {compare.length}/{MAX_COMPARAR}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {compare.length === 1 ? 'Selecciona al menos un equipo más.' : 'Listo para comparar.'}
                                    </p>
                                </div>
                            </div>
                            {compareMessage && <p className="mt-1 text-xs font-semibold text-amber-600">{compareMessage}</p>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <button onClick={clearCompare} className="it-btn it-btn-ghost">
                                Limpiar
                            </button>
                            <button
                                onClick={() => compare.length >= 2 && setComparisonOpen(true)}
                                disabled={compare.length < 2}
                                className="it-btn it-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Comparar <Scale className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                <ProductModal item={selected} onClose={() => setSelected(null)} onComprar={comprar} />
                <ComparisonPreviewModal equipos={selectedEquipos} open={comparisonOpen} onClose={() => setComparisonOpen(false)} onRemove={toggle} />
            </main>
        </AppLayout>
    );
}

function HardwareCard({
    item,
    selected,
    onCompare,
    onOpen,
    onComprar,
}: {
    item: Laptop;
    selected: boolean;
    onCompare: () => void;
    onOpen: () => void;
    onComprar: () => void;
}) {
    return (
        <article className={`it-card it-card-hover group flex flex-col overflow-hidden ${selected ? 'ring-2 ring-[var(--it-primary)]' : ''}`}>
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-950">
                <LaptopImage
                    imagenUrl={item.imagen_url}
                    marca={item.marca}
                    tipo={item.tipo}
                    className="h-full w-full transition duration-500 group-hover:scale-105"
                />
                {disponibilidad(item.stock).texto && (
                    <span
                        className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${disponibilidad(item.stock).agotada ? 'bg-slate-800 text-white' : 'bg-amber-400 text-slate-900'}`}
                    >
                        {disponibilidad(item.stock).texto}
                    </span>
                )}
                <button
                    type="button"
                    onClick={onCompare}
                    aria-label={
                        selected ? `Quitar ${item.marca} ${item.modelo} del comparador` : `Agregar ${item.marca} ${item.modelo} al comparador`
                    }
                    className={`absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full border backdrop-blur ${selected ? 'bg-[var(--it-primary)] text-white' : 'bg-white/85 text-slate-700'}`}
                >
                    {selected ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                </button>
            </div>
            <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-bold tracking-wider text-[var(--it-primary)] uppercase dark:text-sky-300">{item.marca}</p>
                <h2 className="mt-1 text-xl font-black">{item.modelo}</h2>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{item.descripcion || item.cpu}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <Spec icon={<Cpu />} value={item.rendimiento_score ?? '—'} label="Rendimiento" />
                    <Spec icon={<HardDrive />} value={`${item.ram_gb} GB`} label="RAM" />
                    <Spec icon={<MonitorSmartphone />} value={item.gpu_dedicada ? 'Dedicada' : 'Integrada'} label="Gráficos" />
                </div>
                <div className="mt-auto flex items-end justify-between border-t pt-4">
                    <div>
                        <span className="text-xs text-slate-400">Precio</span>
                        <p className="text-2xl font-black">{soles(item.precio_soles)}</p>
                    </div>
                    <button onClick={onOpen} className="it-btn it-btn-secondary">
                        Ver detalle
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onComprar}
                    disabled={disponibilidad(item.stock).agotada}
                    className="it-btn it-btn-primary mt-3 w-full justify-center"
                >
                    <ShoppingCart className="h-4 w-4" /> {disponibilidad(item.stock).agotada ? 'Agotada' : 'Comprar'}
                </button>
            </div>
        </article>
    );
}

function Spec({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
    return (
        <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/70">
            <span className="mx-auto block h-4 w-4 text-[var(--it-primary)] dark:text-sky-300">{icon}</span>
            <b className="mt-1 block text-xs">{value}</b>
            <small className="text-[10px] text-slate-400">{label}</small>
        </div>
    );
}

function ProductModal({ item, onClose, onComprar }: { item: Laptop | null; onClose: () => void; onComprar: (laptop: Laptop) => void }) {
    if (!item) return null;

    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-5xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="grid md:grid-cols-[1.1fr_.9fr]">
                    <div className="relative bg-slate-100 dark:bg-slate-950">
                        <div className="aspect-square">
                            <LaptopImage imagenUrl={item.imagen_url} marca={item.marca} tipo={item.tipo} className="h-full w-full" />
                        </div>
                        <button onClick={onClose} aria-label="Cerrar" className="it-icon-btn absolute top-4 right-4 bg-white/90">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="p-7">
                        <p className="it-eyebrow">Ficha técnica</p>
                        <h2 className="mt-2 text-3xl font-black">
                            {item.marca} {item.modelo}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {item.descripcion || 'Laptop registrada en el catálogo de IngeTech AI.'}
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {[
                                ['CPU', item.cpu],
                                ['RAM', `${item.ram_gb} GB`],
                                ['Almacenamiento', `${item.almacenamiento_gb} GB ${item.almacenamiento_tipo}`],
                                ['GPU', item.gpu_dedicada ? (item.gpu ?? 'Dedicada') : 'Integrada'],
                                ['Rendimiento', item.rendimiento_score ?? '—'],
                                ['Batería', item.bateria_horas ? `~${item.bateria_horas} h` : '—'],
                            ].map(([k, v]) => (
                                <div key={String(k)} className="rounded-2xl border p-3">
                                    <small className="text-xs text-slate-400">{k}</small>
                                    <p className="mt-1 font-bold">{v}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-3 border-t pt-5">
                            <div>
                                <p className="text-xs text-slate-400">Precio</p>
                                <p className="text-3xl font-black">{soles(item.precio_soles)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onComprar(item)}
                                disabled={disponibilidad(item.stock).agotada}
                                className="it-btn it-btn-primary"
                            >
                                <ShoppingCart className="h-4 w-4" /> {disponibilidad(item.stock).agotada ? 'Agotada' : 'Comprar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ComparisonPreviewModal({
    equipos,
    open,
    onClose,
    onRemove,
}: {
    equipos: Laptop[];
    open: boolean;
    onClose: () => void;
    onRemove: (id: number) => void;
}) {
    if (!open || equipos.length < 2) return null;

    const precios = equipos.map((e) => Number(e.precio_soles));
    const diferencia = Math.max(...precios) - Math.min(...precios);

    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-5xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="it-modal-header">
                    <div>
                        <p className="it-eyebrow">COMPARACIÓN RÁPIDA</p>
                        <h2 className="mt-1 text-2xl font-black">Compara tus {equipos.length} equipos</h2>
                        <p className="mt-1 text-sm text-slate-500">Revisa las diferencias principales antes de abrir la comparación completa.</p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar" className="it-icon-btn">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="it-modal-body">
                    <div className={`grid gap-4 ${equipos.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                        {equipos.map((e) => (
                            <article key={e.id} className="rounded-3xl border bg-slate-50 p-4 dark:bg-slate-900">
                                <div className="h-28 overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
                                    <LaptopImage imagenUrl={e.imagen_url} marca={e.marca} tipo={e.tipo} className="h-full w-full" />
                                </div>
                                <p className="mt-3 text-xs font-bold text-[var(--it-primary)] uppercase dark:text-sky-300">{e.marca}</p>
                                <h3 className="truncate font-black">{e.modelo}</h3>
                                <p className="mt-1 text-xl font-black">{soles(e.precio_soles)}</p>
                                <button
                                    onClick={() => onRemove(e.id)}
                                    className="mt-1 text-xs font-semibold text-slate-500 underline hover:text-red-600"
                                >
                                    Quitar equipo
                                </button>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                    <MiniSpec label="CPU" value={e.cpu} />
                                    <MiniSpec label="RAM" value={`${e.ram_gb} GB`} />
                                    <MiniSpec label="GPU" value={e.gpu_dedicada ? (e.gpu ?? 'Dedicada') : 'Integrada'} />
                                    <MiniSpec label="SSD" value={`${e.almacenamiento_gb} GB`} />
                                    {e.bateria_horas && (
                                        <MiniSpec label="Batería" value={`~${e.bateria_horas} h`} icon={<BatteryFull className="h-3 w-3" />} />
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/30">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold tracking-wider text-sky-700 uppercase dark:text-sky-300">Diferencia de precio</p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Entre el equipo más barato y el más caro hay <b>{soles(diferencia)}</b>.
                                </p>
                            </div>
                            <Scale className="hidden h-6 w-6 text-sky-500 sm:block" />
                        </div>
                    </div>
                </div>

                <div className="it-modal-footer">
                    <button onClick={onClose} className="it-btn it-btn-secondary">
                        Seguir seleccionando
                    </button>
                    <Link href="/comparador" onClick={onClose} className="it-btn it-btn-primary">
                        Ver comparación completa <Scale className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function MiniSpec({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
    return (
        <div className="rounded-xl border bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
                {icon}
                {label}
            </span>
            <span className="mt-0.5 block truncate font-semibold">{value}</span>
        </div>
    );
}
