import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import { getCatalogImage } from '@/lib/catalog-images';
import { flujoStorage } from '@/lib/flujo-storage';
import type { Laptop, RespuestaMotorError, Tarjeta } from '@/types/flujo';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Cpu, HardDrive, MonitorSmartphone, Scale, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
const badgeStyle: Record<string, string> = {
    'Mejor Opción Económica': 'bg-emerald-100 text-emerald-700',
    'Opción Equilibrada': 'bg-sky-100 text-sky-700',
    'Mejor Rendimiento': 'bg-violet-100 text-violet-700',
};
export default function ResultadoIndex() {
    const [cards, setCards] = useState<Tarjeta[] | null>(null);
    const [error, setError] = useState<RespuestaMotorError | null>(null);
    const [compare, setCompare] = useState<number[]>([]);
    const [selected, setSelected] = useState<Laptop | null>(null);
    useEffect(() => {
        const saved = flujoStorage.leerTarjetas();
        const storedError = sessionStorage.getItem('ingetech:error');
        const err = storedError ? (JSON.parse(storedError) as RespuestaMotorError) : null;
        if (!saved.length && !err) {
            router.visit('/perfil');
            return;
        }
        setCards(saved);
        setError(err);
        setCompare(flujoStorage.leerComparar());
    }, []);
    function choose(card: Tarjeta) {
        flujoStorage.guardarSeleccionada(card);
        router.visit('/personalizar');
    }
    function addCompare(id: number) {
        setCompare((old) => {
            if (old.includes(id)) {
                const next = old.filter((itemId) => itemId !== id);
                flujoStorage.guardarComparar(next);
                return next;
            }
            if (old.length >= 2) return old;
            const next = [...old, id];
            flujoStorage.guardarComparar(next);
            return next;
        });
    }
    if (cards === null) return null;
    return (
        <>
            <Head title="Tu recomendación — IngeTech AI" />
            <div className="min-h-screen bg-slate-50 text-[#0c2340] dark:bg-slate-950 dark:text-white">
                <FlowHeader pasoActual={2} />
                <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <span className="it-eyebrow">RESULTADO IA</span>
                            <h1 className="mt-2 text-4xl font-black tracking-tight">Estas opciones encajan con tu perfil.</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Compara la compatibilidad, revisa las especificaciones y elige una para personalizar.
                            </p>
                        </div>
                        {compare.length >= 2 && (
                            <Link href="/comparador" className="it-btn it-btn-primary">
                                <Scale className="h-4 w-4" /> Comparar ({compare.length}/2)
                            </Link>
                        )}
                    </div>
                    {error ? (
                        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
                            <div className="flex gap-3">
                                <AlertTriangle />
                                <div>
                                    <b>{error.mensaje}</b>
                                    {error.cercanas?.length ? (
                                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                            {error.cercanas.map((x) => (
                                                <SimpleCard key={x.id} item={x} onOpen={() => setSelected(x)} />
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 grid gap-6 lg:grid-cols-3">
                            {cards.map((card) => (
                                <RecommendationCard
                                    key={card.laptop_id}
                                    card={card}
                                    compared={compare.includes(card.laptop_id)}
                                    onCompare={() => addCompare(card.laptop_id)}
                                    onChoose={() => choose(card)}
                                    onOpen={() => setSelected(card.laptop)}
                                />
                            ))}
                        </div>
                    )}
                    <div className="mt-8">
                        <Link href="/perfil" className="text-sm font-semibold text-slate-500 hover:text-[var(--it-primary)]">
                            ← Modificar mi perfil
                        </Link>
                    </div>
                </main>
                <ChatWidget />
                <DetailModal item={selected} onClose={() => setSelected(null)} />
            </div>
        </>
    );
}
function RecommendationCard({
    card,
    compared,
    onCompare,
    onChoose,
    onOpen,
}: {
    card: Tarjeta;
    compared: boolean;
    onCompare: () => void;
    onChoose: () => void;
    onOpen: () => void;
}) {
    const l = card.laptop;
    const image = getCatalogImage('hardware', l.id, l.imagen_url);
    return (
        <article className="it-card it-card-hover overflow-hidden">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-950">
                {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="grid h-full place-items-center text-5xl font-black text-slate-300">IT</div>
                )}
                <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                    {card.badges.map((b) => (
                        <span key={b} className={`rounded-full px-2.5 py-1 text-[10px] font-black ${badgeStyle[b] ?? 'bg-white text-slate-700'}`}>
                            {b}
                        </span>
                    ))}
                </div>
                <button
                    onClick={onOpen}
                    className="absolute right-3 bottom-3 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 backdrop-blur"
                >
                    Ver detalle
                </button>
            </div>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-[var(--it-primary)] uppercase">{l.marca}</p>
                        <h2 className="mt-1 text-xl font-black">{l.modelo}</h2>
                    </div>
                    <div className="text-right">
                        <b className="text-2xl">{card.compatibilidad_pct}%</b>
                        <small className="block text-[10px] text-slate-400">compatibilidad</small>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <Spec icon={<Cpu />} value={l.rendimiento_score ?? '—'} />
                    <Spec icon={<HardDrive />} value={`${l.ram_gb} GB`} />
                    <Spec icon={<MonitorSmartphone />} value={l.gpu_dedicada ? 'GPU' : 'IGPU'} />
                </div>
                <div className="mt-5 flex items-end justify-between border-t pt-4">
                    <div>
                        <small className="text-xs text-slate-400">Precio</small>
                        <p className="text-2xl font-black">S/ {Number(l.precio_soles).toLocaleString('es-PE')}</p>
                    </div>
                    <button
                        onClick={onCompare}
                        className={`it-btn h-9 px-3 ${compared ? 'bg-[var(--it-primary-soft)] text-[var(--it-primary)]' : 'it-btn-secondary'}`}
                    >
                        <Scale className="h-4 w-4" />
                        {compared ? 'Quitar' : 'Comparar'}
                    </button>
                </div>
                <button onClick={onChoose} className="it-btn it-btn-primary mt-3 w-full">
                    Personalizar esta opción <CheckCircle2 className="h-4 w-4" />
                </button>
            </div>
        </article>
    );
}
function Spec({ icon, value }: { icon: ReactNode; value: string | number }) {
    return (
        <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800">
            <span className="mx-auto block h-4 w-4 text-[var(--it-primary)]">{icon}</span>
            <b className="mt-1 block text-xs">{value}</b>
        </div>
    );
}
function SimpleCard({ item, onOpen }: { item: Laptop; onOpen: () => void }) {
    const image = getCatalogImage('hardware', item.id, item.imagen_url);
    return (
        <button onClick={onOpen} className="flex items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm">
            <div className="h-14 w-16 overflow-hidden rounded-xl bg-slate-100">
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
                <b className="text-sm">
                    {item.marca} {item.modelo}
                </b>
                <p className="text-xs text-slate-500">S/ {Number(item.precio_soles).toLocaleString('es-PE')}</p>
            </div>
        </button>
    );
}
function DetailModal({ item, onClose }: { item: Laptop | null; onClose: () => void }) {
    if (!item) return null;
    const image = getCatalogImage('hardware', item.id, item.imagen_url);
    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-3xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="relative aspect-[16/7] overflow-hidden bg-slate-100 dark:bg-slate-950">
                    {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
                    <button onClick={onClose} className="it-icon-btn absolute top-4 right-4 bg-white/90">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="it-eyebrow">Detalle recomendado</p>
                    <h2 className="mt-1 text-2xl font-black">
                        {item.marca} {item.modelo}
                    </h2>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                            ['CPU', item.cpu],
                            ['RAM', `${item.ram_gb} GB`],
                            ['SSD', `${item.almacenamiento_gb} GB`],
                            ['GPU', item.gpu_dedicada ? item.gpu : 'Integrada'],
                            ['Score', item.rendimiento_score ?? '—'],
                            ['Precio', `S/ ${Number(item.precio_soles).toLocaleString('es-PE')}`],
                        ].map(([k, v]) => (
                            <div key={String(k)} className="rounded-2xl border p-3">
                                <small className="text-xs text-slate-400">{k}</small>
                                <p className="mt-1 font-bold">{v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
