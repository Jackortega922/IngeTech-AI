import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import { flujoStorage } from '@/lib/flujo-storage';
import type { Accesorio, Catalogos, Kit, Tarjeta } from '@/types/flujo';
import { Head, Link, router } from '@inertiajs/react';
import { Check, Cpu, MonitorSmartphone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const TIERS_RAM = [8, 16, 32, 64];
const TIERS_ALMACENAMIENTO = [256, 512, 1024, 2048];
const SOLES_POR_GB_RAM = 12;
const SOLES_POR_GB_ALMACENAMIENTO = 0.25;

export default function PersonalizarIndex() {
    const [seleccionada, setSeleccionada] = useState<Tarjeta | null>(null);
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [ram, setRam] = useState<number | null>(null);
    const [almacenamiento, setAlmacenamiento] = useState<number | null>(null);
    const [kitId, setKitId] = useState<number | null>(null);
    const [accesorioIds, setAccesorioIds] = useState<number[]>([]);
    const [confirmado, setConfirmado] = useState(false);

    useEffect(() => {
        const r = flujoStorage.leerSeleccionada();
        if (!r || !r.laptop) {
            router.visit('/resultado');
            return;
        }
        setSeleccionada(r);
        setRam(r.laptop.ram_gb);
        setAlmacenamiento(r.laptop.almacenamiento_gb);

        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((res) => res.json())
            .then((data: Catalogos) => setCatalogos(data))
            .catch(() => setCatalogos({ carreras: [], software: [], hardware: [], actividades: [], accesorios: [], kits: [] }));
    }, []);

    const laptop = seleccionada?.laptop ?? null;

    const opcionesRam = useMemo(() => {
        if (!laptop) return [];
        const tope = laptop.ram_ampliable_gb ?? laptop.ram_gb;
        const set = new Set([laptop.ram_gb, ...TIERS_RAM.filter((v) => v >= laptop.ram_gb && v <= tope)]);
        return Array.from(set).sort((a, b) => a - b);
    }, [laptop]);

    const opcionesAlmacenamiento = useMemo(() => {
        if (!laptop) return [];
        const set = new Set([laptop.almacenamiento_gb, ...TIERS_ALMACENAMIENTO.filter((v) => v >= laptop.almacenamiento_gb)]);
        return Array.from(set).sort((a, b) => a - b);
    }, [laptop]);

    const accesoriosSueltosSeleccionados = useMemo(
        () => catalogos?.accesorios.filter((a) => accesorioIds.includes(a.id)) ?? [],
        [catalogos, accesorioIds],
    );
    const kitSeleccionado = useMemo(() => catalogos?.kits.find((k) => k.id === kitId) ?? null, [catalogos, kitId]);

    if (!seleccionada || !laptop || ram === null || almacenamiento === null) return null;

    const precioBase = Number(seleccionada.laptop.precio_soles);
    const deltaRam = (ram - laptop.ram_gb) * SOLES_POR_GB_RAM;
    const deltaAlmacenamiento = (almacenamiento - laptop.almacenamiento_gb) * SOLES_POR_GB_ALMACENAMIENTO;
    const precioKit = kitSeleccionado ? Number(kitSeleccionado.precio_soles) : 0;
    const precioAccesorios = accesoriosSueltosSeleccionados.reduce((sum, a) => sum + Number(a.precio_soles), 0);
    const precioFinal = precioBase + deltaRam + deltaAlmacenamiento + precioKit + precioAccesorios;

    function toggleAccesorio(id: number) {
        setAccesorioIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
    }

    return (
        <>
            <Head title={`Personalizar ${laptop.modelo} — IngeTech AI`} />
            <div className="min-h-screen bg-[#07111f] text-white">
                <FlowHeader pasoActual={3} />

                <main className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
                    <h1 className="text-3xl font-bold sm:text-4xl">
                        Ajusta la {laptop.marca} {laptop.modelo}
                    </h1>
                    <p className="mt-2 text-slate-400">Cambia memoria, almacenamiento o agrega accesorios — el precio se actualiza al instante.</p>

                    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
                        <div className="space-y-10">
                            {/* RAM */}
                            <section>
                                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                                    <Cpu className="h-4 w-4 text-cyan-400" /> Memoria RAM
                                </h2>
                                <div className="flex flex-wrap gap-2.5">
                                    {opcionesRam.map((v) => (
                                        <OpcionPastilla
                                            key={v}
                                            activo={ram === v}
                                            onClick={() => setRam(v)}
                                            label={`${v} GB`}
                                            sub={v === laptop.ram_gb ? 'incluida' : `+S/ ${((v - laptop.ram_gb) * SOLES_POR_GB_RAM).toFixed(0)}`}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Almacenamiento */}
                            <section>
                                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                                    <MonitorSmartphone className="h-4 w-4 text-cyan-400" /> Almacenamiento
                                </h2>
                                <div className="flex flex-wrap gap-2.5">
                                    {opcionesAlmacenamiento.map((v) => (
                                        <OpcionPastilla
                                            key={v}
                                            activo={almacenamiento === v}
                                            onClick={() => setAlmacenamiento(v)}
                                            label={v >= 1024 ? `${v / 1024} TB` : `${v} GB`}
                                            sub={
                                                v === laptop.almacenamiento_gb
                                                    ? 'incluido'
                                                    : `+S/ ${((v - laptop.almacenamiento_gb) * SOLES_POR_GB_ALMACENAMIENTO).toFixed(0)}`
                                            }
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Kits */}
                            {catalogos && catalogos.kits.length > 0 && (
                                <section>
                                    <h2 className="mb-3 text-sm font-semibold text-slate-300">Kits (con descuento frente a comprarlo suelto)</h2>
                                    <div className="space-y-2.5">
                                        <OpcionKit label="Sin kit" activo={kitId === null} onClick={() => setKitId(null)} />
                                        {catalogos.kits.map((kit: Kit) => (
                                            <OpcionKit
                                                key={kit.id}
                                                label={kit.nombre}
                                                incluye={kit.accesorios.map((a) => a.nombre).join(' · ')}
                                                precio={Number(kit.precio_soles)}
                                                activo={kitId === kit.id}
                                                onClick={() => setKitId(kit.id)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Accesorios sueltos */}
                            {catalogos && catalogos.accesorios.length > 0 && (
                                <section>
                                    <h2 className="mb-3 text-sm font-semibold text-slate-300">Accesorios adicionales</h2>
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        {catalogos.accesorios.map((a: Accesorio) => (
                                            <button
                                                key={a.id}
                                                type="button"
                                                onClick={() => toggleAccesorio(a.id)}
                                                className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition ${
                                                    accesorioIds.includes(a.id)
                                                        ? 'border-cyan-400 bg-cyan-400/10'
                                                        : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                                                }`}
                                            >
                                                <span>{a.nombre}</span>
                                                <span className="font-mono text-xs text-slate-400">S/ {Number(a.precio_soles).toFixed(0)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Resumen */}
                        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-24">
                            <p className="text-sm text-slate-400">Resumen</p>
                            <h3 className="mt-1 text-lg font-bold">
                                {laptop.marca} {laptop.modelo}
                            </h3>

                            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm">
                                <FilaResumen label="Laptop base" valor={precioBase} />
                                {deltaRam !== 0 && <FilaResumen label={`RAM ${ram} GB`} valor={deltaRam} />}
                                {deltaAlmacenamiento !== 0 && (
                                    <FilaResumen label={`Almacenamiento ${almacenamiento} GB`} valor={deltaAlmacenamiento} />
                                )}
                                {kitSeleccionado && <FilaResumen label={kitSeleccionado.nombre} valor={precioKit} />}
                                {accesoriosSueltosSeleccionados.map((a) => (
                                    <FilaResumen key={a.id} label={a.nombre} valor={Number(a.precio_soles)} />
                                ))}
                            </div>

                            <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
                                <span className="text-sm text-slate-300">Precio final</span>
                                <span className="font-mono text-2xl font-bold text-cyan-400">S/ {precioFinal.toLocaleString('es-PE')}</span>
                            </div>

      {confirmado ? (
    <div className="mt-5 space-y-3">
        {/* Confirmación */}
        <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />

            <div>
                <p className="font-semibold">
                    ¡Configuración guardada!
                </p>

                <p className="mt-1 text-xs text-emerald-300/70">
                    Tu configuración está lista. Un asesor te contactará para
                    ayudarte a cerrar la compra.
                </p>
            </div>
        </div>

        {/* Botón panel de usuario */}
        <Link
            href="/dashboard"
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition-all duration-200 hover:border-cyan-400 hover:bg-cyan-400 hover:text-[#07111f]"
        >
            <span>Ir a mi panel</span>

            <span className="transition-transform duration-200 group-hover:translate-x-1">
                →
            </span>
        </Link>
    </div>
) : (
    <button
        type="button"
        onClick={() => setConfirmado(true)}
        className="mt-5 w-full rounded-xl bg-cyan-400 py-3 text-sm font-bold text-[#07111f] transition hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20"
    >
        Confirmar personalización
    </button>
)}
                        </aside>
                    </div>

                    <Link href="/resultado" className="mt-10 inline-block text-sm text-slate-400 underline decoration-white/20 hover:text-white">
                        ← Elegir otra laptop
                    </Link>
                </main>
                <ChatWidget />
            </div>
        </>
    );
}

function OpcionPastilla({ label, sub, activo, onClick }: { label: string; sub: string; activo: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-4 py-2.5 text-center text-sm transition ${
                activo ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
            }`}
        >
            <span className="block font-mono font-semibold">{label}</span>
            <span className="block text-[11px] text-slate-500">{sub}</span>
        </button>
    );
}

function OpcionKit({
    label,
    incluye,
    precio,
    activo,
    onClick,
}: {
    label: string;
    incluye?: string;
    precio?: number;
    activo: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                activo ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
            }`}
        >
            <span>
                <span className="block text-sm font-semibold">{label}</span>
                {incluye && <span className="block text-xs text-slate-500">{incluye}</span>}
            </span>
            {precio !== undefined && <span className="font-mono text-sm text-cyan-300 shrink-0">S/ {precio.toFixed(0)}</span>}
        </button>
    );
}

function FilaResumen({ label, valor }: { label: string; valor: number }) {
    return (
        <div className="flex items-center justify-between text-slate-300">
            <span className="truncate pr-3">{label}</span>
            <span className="shrink-0 font-mono">
                {valor >= 0 ? '+' : '−'} S/ {Math.abs(valor).toLocaleString('es-PE')}
            </span>
        </div>
    );
}
