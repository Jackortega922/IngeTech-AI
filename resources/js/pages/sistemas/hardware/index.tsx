import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Catalogos, Laptop } from '@/types/flujo';
import { flujoStorage } from '@/lib/flujo-storage';
import { getCatalogImage } from '@/lib/catalog-images';
import { Head, Link } from '@inertiajs/react';
import { Battery, Check, Cpu, HardDrive, MonitorSmartphone, Scale, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Catálogo de equipos', href: '/hardware' }];
const MAX_COMPARAR = 2;

export default function HardwareIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [query, setQuery] = useState('');
    const [type, setType] = useState('todos');
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

                // Si administración eliminó un equipo, no dejamos su ID huérfano
                // en la selección del comparador.
                const validIds = flujoStorage
                    .leerComparar()
                    .filter((id) => data.hardware.some((item) => Number(item.id) === Number(id)));
                flujoStorage.guardarComparar(validIds);
                setCompare(validIds);
            })
            .catch(() => setCatalogos({ carreras: [], software: [], hardware: [], actividades: [], accesorios: [], kits: [] }));
    }, []);

    const filtered = useMemo(
        () =>
            catalogos?.hardware.filter((x) => {
                const q = `${x.marca} ${x.modelo} ${x.cpu} ${x.gpu ?? ''}`.toLowerCase();
                return (!query || q.includes(query.toLowerCase())) && (type === 'todos' || x.tipo === type);
            }) ?? [],
        [catalogos, query, type],
    );

    const selectedEquipos = useMemo(
        () => compare.map((id) => catalogos?.hardware.find((item) => Number(item.id) === Number(id))).filter(Boolean) as Laptop[],
        [catalogos, compare],
    );

    function toggle(id: number) {
        setCompare((old) => {
            if (old.includes(id)) {
                const next = old.filter((x) => x !== id);
                flujoStorage.guardarComparar(next);
                setCompareMessage('');
                return next;
            }

            if (old.length >= MAX_COMPARAR) {
                setCompareMessage('El comparador permite máximo 2 equipos. Quita uno para seleccionar otro.');
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
            <Head title="Catálogo de equipos" />

            <main className="it-container py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-7 text-white shadow-xl sm:p-9">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.18),transparent_55%)]" />
                    <div className="relative max-w-3xl">
                        <span className="it-badge border-white/10 bg-white/10 text-sky-200">CATÁLOGO HARDWARE</span>
                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Equipos que puedes comparar y recomendar.</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                            Explora especificaciones, imágenes, precio y compatibilidad antes de personalizar tu elección.
                        </p>
                    </div>
                </section>

                <div className="it-card mt-6 p-4">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                className="it-input pl-10"
                                placeholder="Busca marca, modelo, CPU o GPU"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <select className="it-input md:w-52" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="laptop">Laptops</option>
                            <option value="escritorio">Escritorio</option>
                        </select>
                    </div>
                </div>

                {!catalogos ? (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="it-skeleton h-96" />)}
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((item) => (
                            <HardwareCard
                                key={item.id}
                                item={item}
                                selected={compare.includes(Number(item.id))}
                                onCompare={() => toggle(Number(item.id))}
                                onOpen={() => setSelected(item)}
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
                                    <p className="text-sm font-bold">Comparador: {compare.length}/{MAX_COMPARAR}</p>
                                    <p className="text-xs text-slate-500">{compare.length === 1 ? 'Selecciona un segundo equipo.' : 'Listo para comparar.'}</p>
                                </div>
                            </div>
                            {compareMessage && <p className="mt-1 text-xs font-semibold text-amber-600">{compareMessage}</p>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <button onClick={clearCompare} className="it-btn it-btn-ghost">Limpiar</button>
                            <button
                                onClick={() => compare.length === 2 && setComparisonOpen(true)}
                                disabled={compare.length < 2}
                                className="it-btn it-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Comparar <Scale className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                <ProductModal item={selected} onClose={() => setSelected(null)} />
                <ComparisonPreviewModal
                    equipos={selectedEquipos}
                    open={comparisonOpen}
                    onClose={() => setComparisonOpen(false)}
                    onRemove={toggle}
                />
            </main>
        </AppLayout>
    );
}

function HardwareCard({ item, selected, onCompare, onOpen }: { item: Laptop; selected: boolean; onCompare: () => void; onOpen: () => void }) {
    const image = getCatalogImage('hardware', item.id, item.imagen_url);

    return (
        <article className="it-card it-card-hover group overflow-hidden">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-950">
                {image ? (
                    <img src={image} alt={`${item.marca} ${item.modelo}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,#dbeafe,transparent_65%)] text-5xl font-black text-slate-300 dark:bg-slate-900 dark:text-slate-700">IT</div>
                )}
                <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-700 backdrop-blur">{item.tipo}</span>
                <button
                    type="button"
                    onClick={onCompare}
                    aria-label={selected ? `Quitar ${item.marca} ${item.modelo} del comparador` : `Agregar ${item.marca} ${item.modelo} al comparador`}
                    className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border backdrop-blur ${selected ? 'bg-[var(--it-primary)] text-white' : 'bg-white/85 text-slate-700'}`}
                >
                    {selected ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                </button>
            </div>
            <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--it-primary)]">{item.marca}</p>
                <h2 className="mt-1 text-xl font-black">{item.modelo}</h2>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{item.descripcion || item.cpu}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <Spec icon={<Cpu />} value={item.rendimiento_score ?? 0} label="Score" />
                    <Spec icon={<HardDrive />} value={`${item.ram_gb} GB`} label="RAM" />
                    <Spec icon={<MonitorSmartphone />} value={item.gpu_dedicada ? 'GPU' : 'IGPU'} label="Gráficos" />
                </div>
                <div className="mt-5 flex items-end justify-between border-t pt-4">
                    <div>
                        <span className="text-xs text-slate-400">Desde</span>
                        <p className="text-2xl font-black">S/ {Number(item.precio_soles).toLocaleString('es-PE')}</p>
                    </div>
                    <button onClick={onOpen} className="it-btn it-btn-secondary">Ver detalle</button>
                </div>
            </div>
        </article>
    );
}

function Spec({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
    return (
        <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/70">
            <span className="mx-auto block h-4 w-4 text-[var(--it-primary)]">{icon}</span>
            <b className="mt-1 block text-xs">{value}</b>
            <small className="text-[10px] text-slate-400">{label}</small>
        </div>
    );
}

function ProductModal({ item, onClose }: { item: Laptop | null; onClose: () => void }) {
    const image = item ? getCatalogImage('hardware', item.id, item.imagen_url) : null;
    if (!item) return null;

    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-5xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="grid md:grid-cols-[1.1fr_.9fr]">
                    <div className="relative bg-slate-100 dark:bg-slate-950">
                        <div className="aspect-square">
                            {image ? <img src={image} alt={`${item.marca} ${item.modelo}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-6xl font-black text-slate-300">IT</div>}
                        </div>
                        <button onClick={onClose} className="it-icon-btn absolute right-4 top-4 bg-white/90"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="p-7">
                        <p className="it-eyebrow">Ficha técnica</p>
                        <h2 className="mt-2 text-3xl font-black">{item.marca} {item.modelo}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.descripcion || 'Equipo registrado en el catálogo de IngeTech AI.'}</p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {[
                                ['CPU', item.cpu],
                                ['RAM', `${item.ram_gb} GB`],
                                ['Almacenamiento', `${item.almacenamiento_gb} GB ${item.almacenamiento_tipo}`],
                                ['GPU', item.gpu_dedicada ? item.gpu : 'Integrada'],
                                ['Score', item.rendimiento_score ?? '—'],
                                ['Batería', item.bateria_horas ? `${item.bateria_horas} h` : '—'],
                            ].map(([k, v]) => <div key={String(k)} className="rounded-2xl border p-3"><small className="text-xs text-slate-400">{k}</small><p className="mt-1 font-bold">{v}</p></div>)}
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t pt-5">
                            <div><p className="text-xs text-slate-400">Precio</p><p className="text-3xl font-black">S/ {Number(item.precio_soles).toLocaleString('es-PE')}</p></div>
                            <Link href="/personalizar" className="it-btn it-btn-primary">Personalizar <Check className="h-4 w-4" /></Link>
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

    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-5xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="it-modal-header">
                    <div>
                        <p className="it-eyebrow">COMPARACIÓN RÁPIDA</p>
                        <h2 className="mt-1 text-2xl font-black">Compara tus 2 equipos</h2>
                        <p className="mt-1 text-sm text-slate-500">Revisa las diferencias principales antes de abrir la comparación completa.</p>
                    </div>
                    <button onClick={onClose} className="it-icon-btn"><X className="h-4 w-4" /></button>
                </div>

                <div className="it-modal-body">
                    <div className="grid gap-4 md:grid-cols-2">
                        {equipos.map((e) => {
                            const image = getCatalogImage('hardware', e.id, e.imagen_url);
                            return (
                                <article key={e.id} className="rounded-3xl border bg-slate-50 p-4 dark:bg-slate-900">
                                    <div className="flex gap-4">
                                        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
                                            {image ? <img src={image} alt={`${e.marca} ${e.modelo}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-black text-slate-300">IT</div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold uppercase text-[var(--it-primary)]">{e.marca}</p>
                                            <h3 className="truncate font-black">{e.modelo}</h3>
                                            <p className="mt-1 text-xl font-black">S/ {Number(e.precio_soles).toLocaleString('es-PE')}</p>
                                            <button onClick={() => onRemove(Number(e.id))} className="mt-2 text-xs font-semibold text-slate-500 underline hover:text-red-600">Quitar equipo</button>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                        <MiniSpec label="CPU" value={e.cpu} />
                                        <MiniSpec label="RAM" value={`${e.ram_gb} GB`} />
                                        <MiniSpec label="GPU" value={e.gpu_dedicada ? e.gpu ?? 'Dedicada' : 'Integrada'} />
                                        <MiniSpec label="SSD" value={`${e.almacenamiento_gb} GB`} />
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/30">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Diferencia de precio</p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">La diferencia entre ambos equipos es de <b>S/ {Math.abs(Number(equipos[0].precio_soles) - Number(equipos[1].precio_soles)).toLocaleString('es-PE')}</b>.</p>
                            </div>
                            <Scale className="hidden h-6 w-6 text-sky-500 sm:block" />
                        </div>
                    </div>
                </div>

                <div className="it-modal-footer">
                    <button onClick={onClose} className="it-btn it-btn-secondary">Seguir seleccionando</button>
                    <Link href="/comparador" onClick={onClose} className="it-btn it-btn-primary">Ver comparación completa <Scale className="h-4 w-4" /></Link>
                </div>
            </div>
        </div>
    );
}

function MiniSpec({ label, value }: { label: string; value: string }) {
    return <div className="rounded-xl border bg-white p-2 dark:border-slate-800 dark:bg-slate-950"><span className="block text-[10px] uppercase text-slate-400">{label}</span><span className="mt-0.5 block truncate font-semibold">{value}</span></div>;
}
