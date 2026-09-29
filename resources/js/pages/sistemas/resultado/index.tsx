import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import LaptopImage from '@/components/laptop-image';
import { flujoStorage } from '@/lib/flujo-storage';
import { nivelCpu } from '@/lib/guia-compra';
import type { Laptop, PreferenciasCliente, RespuestaMotorError, Tarjeta } from '@/types/flujo';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Check, ChevronDown, Cpu, HardDrive, HeartHandshake, LayoutGrid, MonitorSmartphone, Scale } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const COLOR_BADGE: Record<string, string> = {
    'Mejor Opción Económica': 'bg-emerald-400 text-emerald-950',
    'Opción Equilibrada': 'bg-cyan-400 text-[#07111f]',
    'Mejor Rendimiento': 'bg-violet-400 text-violet-950',
};

// Cómo se presenta la recomendación según el cuestionario de bienvenida (Psicología). No cambia
// qué recomienda la IA, solo cómo se muestra y se explica.
type Estilo = 'la_mejor' | 'comparar' | 'ver_todo';
type Nivel = 'principiante' | 'intermedio' | 'avanzado';

const MOTIVO_ESTILO: Record<Estilo, string> = {
    la_mejor: 'nos dijiste que prefieres que te digamos cuál es la mejor para ti',
    comparar: 'nos dijiste que prefieres comparar opciones',
    ver_todo: 'nos dijiste que prefieres ver todas las opciones',
};

export default function ResultadoIndex({ preferencias }: { preferencias: PreferenciasCliente | null }) {
    const estilo: Estilo | null = preferencias?.estilo_decision ?? null;
    const nivel: Nivel = preferencias?.nivel_tecnologia ?? 'intermedio';
    const [verOtras, setVerOtras] = useState(false);
    const [tarjetas, setTarjetas] = useState<Tarjeta[] | null>(null);
    const [errorMotor, setErrorMotor] = useState<RespuestaMotorError | null>(null);
    const [comparar, setComparar] = useState<number[]>([]);

    useEffect(() => {
        const guardadas = flujoStorage.leerTarjetas();
        const errorGuardado = sessionStorage.getItem('ingetech:error');
        const err = errorGuardado ? (JSON.parse(errorGuardado) as RespuestaMotorError | null) : null;

        if (guardadas.length === 0 && !err) {
            router.visit('/perfil');
            return;
        }
        setTarjetas(guardadas);
        setErrorMotor(err);
        setComparar(flujoStorage.leerComparar());
    }, []);

    function elegir(t: Tarjeta) {
        // Avisa al servidor qué opción eligió la persona: es el dato con el que se mide si la IA
        // recomienda bien (docs/gestion/kpis.md). Sin await y sin propagar errores a propósito:
        // si el registro falla, igual se pasa a personalizar — medir no debe romper la compra.
        fetch(`/api/recomendaciones/${t.recomendacion_id}/eleccion`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
        }).catch(() => {});

        flujoStorage.guardarSeleccionada(t);
        router.visit('/personalizar');
    }

    // "Quiero comparar": manda todas las recomendadas al comparador de una vez.
    function compararTodas() {
        if (!tarjetas) return;
        flujoStorage.guardarComparar(tarjetas.slice(0, 3).map((t) => t.laptop_id));
        router.visit('/comparador');
    }

    function agregarAComparar(id: number) {
        setComparar((prev) => {
            if (prev.includes(id)) return prev;
            if (prev.length >= 3) return prev;
            const next = [...prev, id];
            flujoStorage.guardarComparar(next);
            return next;
        });
    }

    if (tarjetas === null) return null;

    return (
        <>
            <Head title="Tu recomendación — IngeTech AI" />
            <div className="min-h-screen bg-[#07111f] text-white">
                <FlowHeader pasoActual={2} />

                <main className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
                    <h1 className="text-3xl font-bold sm:text-4xl">Tu recomendación</h1>
                    <p className="mt-2 max-w-xl text-slate-400">Clasificamos los equipos viables en tres categorías, según qué priorices.</p>

                    {errorMotor ? (
                        <>
                            <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-200">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                                <span>{errorMotor.mensaje}</span>
                            </div>
                            {errorMotor.cercanas && errorMotor.cercanas.length > 0 && (
                                <>
                                    <h2 className="mt-8 text-lg font-semibold">Las más cercanas dentro de tu presupuesto:</h2>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                        {errorMotor.cercanas.map((l) => (
                                            <TarjetaSimple key={l.id} l={l} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {estilo && (
                                <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
                                    <HeartHandshake className="h-4 w-4 text-violet-300" />
                                    Te lo mostramos así porque {MOTIVO_ESTILO[estilo]}.
                                    <Link href="/bienvenida" className="text-violet-300 underline decoration-violet-300/30 hover:text-violet-200">
                                        Cambiar
                                    </Link>
                                </p>
                            )}

                            {estilo === 'comparar' && tarjetas.length > 1 && (
                                <button
                                    onClick={compararTodas}
                                    className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-400/20"
                                >
                                    <Scale className="h-4 w-4" /> Comparar estas {Math.min(tarjetas.length, 3)} lado a lado
                                </button>
                            )}

                            {estilo === 'la_mejor' ? (
                                // Una sola recomendación clara (la de mayor compatibilidad); las demás, a pedido.
                                <>
                                    <p className="mt-6 text-sm font-bold tracking-wide text-cyan-300 uppercase">Nuestra recomendación para ti</p>
                                    <div className="mt-3 max-w-md">
                                        <TarjetaLaptop
                                            t={tarjetas[0]}
                                            nivel={nivel}
                                            enComparar={comparar.includes(tarjetas[0].laptop_id)}
                                            onElegir={() => elegir(tarjetas[0])}
                                            onComparar={() => agregarAComparar(tarjetas[0].laptop_id)}
                                        />
                                    </div>
                                    {tarjetas.length > 1 &&
                                        (verOtras ? (
                                            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                                                {tarjetas.slice(1).map((t) => (
                                                    <TarjetaLaptop
                                                        key={t.laptop_id}
                                                        t={t}
                                                        nivel={nivel}
                                                        enComparar={comparar.includes(t.laptop_id)}
                                                        onElegir={() => elegir(t)}
                                                        onComparar={() => agregarAComparar(t.laptop_id)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setVerOtras(true)}
                                                className="mt-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                                            >
                                                <ChevronDown className="h-4 w-4" /> Ver las otras {tarjetas.length - 1} opciones
                                            </button>
                                        ))}
                                </>
                            ) : (
                                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                                    {tarjetas.map((t) => (
                                        <TarjetaLaptop
                                            key={t.laptop_id}
                                            t={t}
                                            nivel={nivel}
                                            enComparar={comparar.includes(t.laptop_id)}
                                            onElegir={() => elegir(t)}
                                            onComparar={() => agregarAComparar(t.laptop_id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {estilo === 'ver_todo' && (
                                <Link
                                    href="/hardware"
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold hover:border-cyan-400"
                                >
                                    <LayoutGrid className="h-4 w-4" /> Ver todo el catálogo de laptops
                                </Link>
                            )}
                        </>
                    )}

                    <div className="mt-10 flex items-center gap-6">
                        <Link href="/perfil" className="text-sm text-slate-400 underline decoration-white/20 hover:text-white">
                            ← Cambiar mi perfil
                        </Link>
                        {comparar.length >= 2 && (
                            <Link href="/comparador" className="flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                                <Scale className="h-4 w-4" /> Comparar seleccionados ({comparar.length})
                            </Link>
                        )}
                    </div>
                </main>
                <ChatWidget />
            </div>
        </>
    );
}

// Textos sin tecnicismos para quien dijo sentirse poco cómodo con la tecnología (Psicología:
// menos jerga = menos ansiedad al decidir).
const RENDIMIENTO_SIMPLE = { basico: 'Rendimiento para lo básico', estandar: 'Buen rendimiento', avanzado: 'Rendimiento alto' } as const;

function TarjetaLaptop({
    t,
    nivel,
    enComparar,
    onElegir,
    onComparar,
}: {
    t: Tarjeta;
    nivel: Nivel;
    enComparar: boolean;
    onElegir: () => void;
    onComparar: () => void;
}) {
    const simple = nivel === 'principiante';
    const l = t.laptop;
    const destacada = t.badges.includes('Mejor Rendimiento') && t.badges.length > 1;

    return (
        <article
            className={`flex flex-col rounded-2xl border p-6 ${
                destacada ? 'border-cyan-400/60 bg-cyan-400/[0.06]' : 'border-white/10 bg-white/[0.03]'
            }`}
        >
            <div className="flex flex-wrap gap-1.5">
                {t.badges.map((b) => (
                    <span key={b} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${COLOR_BADGE[b] ?? 'bg-white/10'}`}>
                        {b}
                    </span>
                ))}
            </div>

            <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="mt-4 h-32 w-full rounded-xl" />

            <h2 className="mt-3 text-xl font-bold">
                {l.marca} {l.modelo}
            </h2>
            <p className="text-xs text-slate-400">{simple ? 'Laptop' : `Laptop · ${l.cpu}`}</p>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xl font-bold text-cyan-300">{t.compatibilidad_pct}%</span>
                <span className="text-sm text-slate-300">compatible contigo</span>
                {/* Si respondió el cuestionario: de dónde sale el % (70% técnica + 30% la persona). */}
                {t.afinidad_pct !== null && t.afinidad_pct !== undefined && (
                    <span className="w-full text-[11px] text-slate-500">
                        Por lo que harás: {t.compatibilidad_tecnica_pct}% · Por cómo eres: {t.afinidad_pct}%
                    </span>
                )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <SpecChip icon={<Cpu className="h-3.5 w-3.5" />} label={simple ? RENDIMIENTO_SIMPLE[nivelCpu(l)] : `Score ${l.rendimiento_score}`} />
                <SpecChip
                    icon={<HardDrive className="h-3.5 w-3.5" />}
                    label={simple ? `Memoria ${l.ram_gb >= 16 ? 'de sobra' : 'suficiente'}` : `${l.ram_gb} GB · ${l.almacenamiento_gb} GB`}
                />
                <SpecChip
                    icon={<MonitorSmartphone className="h-3.5 w-3.5" />}
                    label={
                        simple
                            ? l.gpu_dedicada
                                ? 'Gráficos para diseño y juegos'
                                : 'Gráficos para el día a día'
                            : l.gpu_dedicada
                              ? 'GPU dedicada'
                              : 'Integrada'
                    }
                />
            </div>
            {nivel === 'avanzado' && (
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-slate-500">
                    {l.almacenamiento_tipo} {l.almacenamiento_gb} GB · {l.gpu ?? 'GPU integrada'}
                    {l.ram_ampliable_gb ? ` · RAM ampliable a ${l.ram_ampliable_gb} GB` : ''}
                    {l.bateria_horas ? ` · ${l.bateria_horas} h de batería` : ''}
                    {l.pantalla_pulgadas ? ` · ${l.pantalla_pulgadas}" ${l.pantalla_resolucion ?? ''} ${l.pantalla_hz ?? 60} Hz` : ''}
                </p>
            )}

            {/* El "por qué" de la IA (transparencia): sus motivos principales y lo que conviene saber. */}
            {(t.explicacion?.factores?.length ?? 0) > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-300">¿Por qué te la recomendamos?</p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-400">
                        {t.explicacion!.factores.slice(0, 3).map((f) => (
                            <li key={f.criterio} className="flex items-start gap-1.5">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {f.criterio}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {(t.explicacion?.advertencias?.length ?? 0) > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-200/90">
                    {t.explicacion!.advertencias.map((a) => (
                        <li key={a} className="flex items-start gap-1.5">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {a}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="font-mono text-2xl font-bold">S/ {Number(l.precio_soles).toLocaleString('es-PE')}</span>
                <span className="text-xs text-slate-500">{l.tienda}</span>
            </div>

            <div className="mt-5 flex gap-2">
                <button
                    type="button"
                    onClick={onElegir}
                    className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#07111f] transition hover:bg-cyan-300"
                >
                    Personalizar esta
                </button>
                <button
                    type="button"
                    onClick={onComparar}
                    disabled={enComparar}
                    title="Agregar al comparador"
                    className={`rounded-xl border px-3 py-3 transition ${
                        enComparar ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                >
                    <Scale className="h-4 w-4" />
                </button>
            </div>
        </article>
    );
}

function TarjetaSimple({ l }: { l: Laptop }) {
    return (
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="h-14 w-14 shrink-0 rounded-lg" />
            <div>
                <p className="font-semibold">
                    {l.marca} {l.modelo}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                    {l.cpu} · {l.ram_gb}GB · score {l.rendimiento_score}
                </p>
                <p className="mt-2 font-mono text-cyan-400">S/ {Number(l.precio_soles).toLocaleString('es-PE')}</p>
            </div>
        </div>
    );
}

function SpecChip({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2.5 text-slate-300">
            {icon}
            <span className="leading-tight">{label}</span>
        </div>
    );
}
