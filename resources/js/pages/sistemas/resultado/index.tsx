import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import LaptopImage from '@/components/laptop-image';
import { costoAnual, VIDA_UTIL_ANIOS } from '@/lib/contabilidad';
import { flujoStorage } from '@/lib/flujo-storage';
import { nivelCpu, PUERTO_ETIQUETA } from '@/lib/guia-compra';
import type { Laptop, PreferenciasCliente, RespuestaMotorError, Tarjeta } from '@/types/flujo';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronDown,
    Cpu,
    HardDrive,
    HeartHandshake,
    LayoutGrid,
    MonitorSmartphone,
    Scale,
    X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

// Diseño de la página: Marco (PR #41) — tarjetas con imagen, detalle en ventana, tema claro u
// oscuro. Lógica: la de main — KPIs de elección, cuestionario de bienvenida (Psicología) y la
// explicación de la IA (B11).

const COLOR_BADGE: Record<string, string> = {
    'Mejor Opción Económica': 'bg-emerald-100 text-emerald-700',
    'Opción Equilibrada': 'bg-sky-100 text-sky-700',
    'Mejor Rendimiento': 'bg-violet-100 text-violet-700',
};

// El comparador admite hasta 3 laptops.
const MAX_COMPARAR = 3;

// Cómo se presenta la recomendación según el cuestionario de bienvenida (Psicología). No cambia
// qué recomienda la IA, solo cómo se muestra y se explica.
type Estilo = 'la_mejor' | 'comparar' | 'ver_todo';
type Nivel = 'principiante' | 'intermedio' | 'avanzado';

const MOTIVO_ESTILO: Record<Estilo, string> = {
    la_mejor: 'nos dijiste que prefieres que te digamos cuál es la mejor para ti',
    comparar: 'nos dijiste que prefieres comparar opciones',
    ver_todo: 'nos dijiste que prefieres ver todas las opciones',
};

const soles = (n: number | string) => `S/ ${Number(n).toLocaleString('es-PE')}`;

export default function ResultadoIndex({ preferencias }: { preferencias: PreferenciasCliente | null }) {
    const estilo: Estilo | null = preferencias?.estilo_decision ?? null;
    const nivel: Nivel = preferencias?.nivel_tecnologia ?? 'intermedio';
    const [verOtras, setVerOtras] = useState(false);
    const [tarjetas, setTarjetas] = useState<Tarjeta[] | null>(null);
    const [errorMotor, setErrorMotor] = useState<RespuestaMotorError | null>(null);
    const [comparar, setComparar] = useState<number[]>([]);
    const [detalle, setDetalle] = useState<Laptop | null>(null);

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
        flujoStorage.guardarComparar(tarjetas.slice(0, MAX_COMPARAR).map((t) => t.laptop_id));
        router.visit('/comparador');
    }

    // Agregar o quitar del comparador (quitar es aporte de Marco; antes solo se podía agregar).
    function alternarComparar(id: number) {
        setComparar((prev) => {
            if (prev.includes(id)) {
                const next = prev.filter((x) => x !== id);
                flujoStorage.guardarComparar(next);
                return next;
            }
            if (prev.length >= MAX_COMPARAR) return prev;
            const next = [...prev, id];
            flujoStorage.guardarComparar(next);
            return next;
        });
    }

    if (tarjetas === null) return null;

    const tarjeta = (t: Tarjeta) => (
        <TarjetaLaptop
            key={t.laptop_id}
            t={t}
            nivel={nivel}
            enComparar={comparar.includes(t.laptop_id)}
            compararLleno={comparar.length >= MAX_COMPARAR}
            onElegir={() => elegir(t)}
            onComparar={() => alternarComparar(t.laptop_id)}
            onDetalle={() => setDetalle(t.laptop)}
        />
    );

    return (
        <>
            <Head title="Tu recomendación — IngeTech AI" />
            <div className="min-h-screen bg-slate-50 text-[#0c2340] dark:bg-slate-950 dark:text-white">
                <FlowHeader pasoActual={2} />

                <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <span className="it-eyebrow">Resultado IA</span>
                            <h1 className="mt-2 text-4xl font-black tracking-tight">Estas opciones encajan contigo.</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Revisa por qué te las recomendamos, compáralas y elige una para personalizar.{' '}
                                <Link href="/como-decide-la-ia" className="font-semibold text-sky-600 underline dark:text-sky-400">
                                    ¿Cómo decide la IA?
                                </Link>
                            </p>
                        </div>
                        {comparar.length >= 2 && (
                            <Link href="/comparador" className="it-btn it-btn-primary">
                                <Scale className="h-4 w-4" /> Comparar ({comparar.length}/{MAX_COMPARAR})
                            </Link>
                        )}
                    </div>

                    {errorMotor ? (
                        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                            <div className="flex gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <b>{errorMotor.mensaje}</b>
                                    {errorMotor.cercanas && errorMotor.cercanas.length > 0 && (
                                        <>
                                            <p className="mt-4 text-sm">Las más cercanas dentro de tu presupuesto:</p>
                                            <div className="mt-3 grid gap-4 sm:grid-cols-3">
                                                {errorMotor.cercanas.map((l) => (
                                                    <TarjetaSimple key={l.id} l={l} onDetalle={() => setDetalle(l)} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {estilo && (
                                <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                    <HeartHandshake className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                                    Te lo mostramos así porque {MOTIVO_ESTILO[estilo]}.
                                    <Link href="/bienvenida" className="font-semibold text-violet-600 underline dark:text-violet-300">
                                        Cambiar
                                    </Link>
                                </p>
                            )}

                            {estilo === 'comparar' && tarjetas.length > 1 && (
                                <button onClick={compararTodas} className="it-btn it-btn-secondary mt-4">
                                    <Scale className="h-4 w-4" /> Comparar estas {Math.min(tarjetas.length, MAX_COMPARAR)} lado a lado
                                </button>
                            )}

                            {estilo === 'la_mejor' ? (
                                // Una sola recomendación clara (la de mayor compatibilidad); las demás, a pedido.
                                <>
                                    <p className="it-eyebrow mt-8">Nuestra recomendación para ti</p>
                                    <div className="mt-3 max-w-md">{tarjeta(tarjetas[0])}</div>
                                    {tarjetas.length > 1 &&
                                        (verOtras ? (
                                            <div className="mt-6 grid gap-6 lg:grid-cols-3">{tarjetas.slice(1).map(tarjeta)}</div>
                                        ) : (
                                            <button
                                                onClick={() => setVerOtras(true)}
                                                className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[var(--it-primary)] dark:text-slate-400"
                                            >
                                                <ChevronDown className="h-4 w-4" /> Ver las otras {tarjetas.length - 1} opciones
                                            </button>
                                        ))}
                                </>
                            ) : (
                                <div className="mt-8 grid gap-6 lg:grid-cols-3">{tarjetas.map(tarjeta)}</div>
                            )}

                            {estilo === 'ver_todo' && (
                                <Link href="/hardware" className="it-btn it-btn-secondary mt-6">
                                    <LayoutGrid className="h-4 w-4" /> Ver todo el catálogo de laptops
                                </Link>
                            )}
                        </>
                    )}

                    <div className="mt-8">
                        <Link href="/perfil" className="text-sm font-semibold text-slate-500 hover:text-[var(--it-primary)] dark:text-slate-400">
                            ← Modificar mi perfil
                        </Link>
                    </div>
                </main>
                <ChatWidget />
                <VentanaDetalle l={detalle} onCerrar={() => setDetalle(null)} />
            </div>
        </>
    );
}

// Textos sin tecnicismos para quien dijo sentirse poco cómodo con la tecnología (Psicología:
// menos jerga = menos ansiedad al decidir).
const RENDIMIENTO_SIMPLE = { basico: 'Para lo básico', estandar: 'Buen rendimiento', avanzado: 'Rendimiento alto' } as const;

function TarjetaLaptop({
    t,
    nivel,
    enComparar,
    compararLleno,
    onElegir,
    onComparar,
    onDetalle,
}: {
    t: Tarjeta;
    nivel: Nivel;
    enComparar: boolean;
    compararLleno: boolean;
    onElegir: () => void;
    onComparar: () => void;
    onDetalle: () => void;
}) {
    const simple = nivel === 'principiante';
    const l = t.laptop;

    return (
        <article className="it-card it-card-hover flex flex-col overflow-hidden">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-950">
                <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="h-full w-full" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                    {t.badges.map((b) => (
                        <span key={b} className={`rounded-full px-2.5 py-1 text-[10px] font-black ${COLOR_BADGE[b] ?? 'bg-white text-slate-700'}`}>
                            {b}
                        </span>
                    ))}
                </div>
                <button
                    onClick={onDetalle}
                    className="absolute right-3 bottom-3 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 backdrop-blur hover:bg-white"
                >
                    Ver detalle
                </button>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-bold tracking-wider text-[var(--it-primary)] uppercase dark:text-sky-300">{l.marca}</p>
                        <h2 className="mt-1 text-xl font-black">{l.modelo}</h2>
                        {!simple && <p className="text-xs text-slate-500 dark:text-slate-400">{l.cpu}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                        <b className="text-2xl">{t.compatibilidad_pct}%</b>
                        <small className="block text-[10px] text-slate-400">compatible contigo</small>
                    </div>
                </div>
                {/* Si respondió el cuestionario: de dónde sale el % (70% técnica + 30% la persona). */}
                {t.afinidad_pct !== null && t.afinidad_pct !== undefined && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Por lo que harás: {t.compatibilidad_tecnica_pct}% · Por cómo eres: {t.afinidad_pct}%
                    </p>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2">
                    <Spec icon={<Cpu />} valor={simple ? RENDIMIENTO_SIMPLE[nivelCpu(l)] : `Score ${l.rendimiento_score ?? '—'}`} />
                    <Spec
                        icon={<HardDrive />}
                        valor={simple ? `Memoria ${l.ram_gb >= 16 ? 'de sobra' : 'suficiente'}` : `${l.ram_gb} GB · ${l.almacenamiento_gb} GB`}
                    />
                    <Spec
                        icon={<MonitorSmartphone />}
                        valor={
                            simple ? (l.gpu_dedicada ? 'Para diseño y juegos' : 'Para el día a día') : l.gpu_dedicada ? 'GPU dedicada' : 'Integrada'
                        }
                    />
                </div>
                {nivel === 'avanzado' && (
                    <p className="mt-3 font-mono text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {l.almacenamiento_tipo} {l.almacenamiento_gb} GB · {l.gpu ?? 'GPU integrada'}
                        {l.ram_ampliable_gb ? ` · RAM ampliable a ${l.ram_ampliable_gb} GB` : ''}
                        {l.bateria_horas ? ` · ${l.bateria_horas} h de batería` : ''}
                        {l.pantalla_pulgadas ? ` · ${l.pantalla_pulgadas}" ${l.pantalla_resolucion ?? ''} ${l.pantalla_hz ?? 60} Hz` : ''}
                    </p>
                )}

                {/* El "por qué" de la IA (transparencia): sus motivos principales y lo que conviene saber. */}
                {(t.explicacion?.factores?.length ?? 0) > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-bold">¿Por qué te la recomendamos?</p>
                        <ul className="mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            {t.explicacion!.factores.slice(0, 3).map((f) => (
                                <li key={f.criterio} className="flex items-start gap-1.5">
                                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f.criterio}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {(t.explicacion?.advertencias?.length ?? 0) > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                        {t.explicacion!.advertencias.map((a) => (
                            <li key={a} className="flex items-start gap-1.5">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {a}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto pt-5">
                    <div className="flex items-end justify-between border-t pt-4">
                        <div>
                            <small className="text-xs text-slate-400">Precio</small>
                            <p className="text-2xl font-black">{soles(l.precio_soles)}</p>
                            {/* Contabilidad: el precio repartido en la vida útil contable (4 años). */}
                            <small className="block text-[11px] text-slate-500 dark:text-slate-400">
                                ≈ {soles(costoAnual(l.precio_soles))} por año de uso
                            </small>
                        </div>
                        <button
                            onClick={onComparar}
                            disabled={!enComparar && compararLleno}
                            title={!enComparar && compararLleno ? `Máximo ${MAX_COMPARAR} para comparar` : undefined}
                            className={`it-btn h-9 px-3 ${enComparar ? 'bg-[var(--it-primary-soft)] text-[var(--it-primary)]' : 'it-btn-secondary'}`}
                        >
                            <Scale className="h-4 w-4" />
                            {enComparar ? 'Quitar' : 'Comparar'}
                        </button>
                    </div>
                    <button onClick={onElegir} className="it-btn it-btn-primary mt-3 w-full">
                        Personalizar esta opción <CheckCircle2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}

function Spec({ icon, valor }: { icon: ReactNode; valor: string }) {
    return (
        <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800">
            <span className="mx-auto block h-4 w-4 text-[var(--it-primary)] dark:text-sky-300 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
            <b className="mt-1 block text-[11px] leading-tight">{valor}</b>
        </div>
    );
}

function TarjetaSimple({ l, onDetalle }: { l: Laptop; onDetalle: () => void }) {
    return (
        <button
            onClick={onDetalle}
            className="flex items-center gap-3 rounded-2xl border bg-white p-3 text-left text-[#0c2340] shadow-sm hover:shadow-md dark:bg-slate-900 dark:text-white"
        >
            <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="h-14 w-16 shrink-0 rounded-xl" />
            <div>
                <b className="text-sm">
                    {l.marca} {l.modelo}
                </b>
                <p className="text-xs text-slate-500">{soles(l.precio_soles)}</p>
            </div>
        </button>
    );
}

// Ventana con todas las specs (diseño de Marco), con los datos que el catálogo ya tiene.
function VentanaDetalle({ l, onCerrar }: { l: Laptop | null; onCerrar: () => void }) {
    if (!l) return null;
    const datos: [string, string][] = [
        ['Procesador', l.cpu],
        ['RAM', `${l.ram_gb} GB${l.ram_ampliable_gb && l.ram_ampliable_gb > l.ram_gb ? ` (hasta ${l.ram_ampliable_gb} GB)` : ''}`],
        ['Almacenamiento', `${l.almacenamiento_tipo} ${l.almacenamiento_gb} GB`],
        ['Gráficos', l.gpu_dedicada ? (l.gpu ?? 'Dedicada') : 'Integrada'],
        ['Rendimiento', `${l.rendimiento_score ?? '—'}/100`],
        ['Batería', l.bateria_horas ? `${l.bateria_horas} h` : '—'],
        ['Pantalla', l.pantalla_pulgadas ? `${l.pantalla_pulgadas}" ${l.pantalla_resolucion ?? ''} ${l.pantalla_hz ?? 60} Hz` : '—'],
        ['Peso', l.peso_kg ? `${l.peso_kg} kg` : '—'],
        ['Precio', soles(l.precio_soles)],
        ['Costo por año de uso', `${soles(costoAnual(l.precio_soles))} (en ${VIDA_UTIL_ANIOS} años)`],
    ];

    return (
        <div className="it-modal-backdrop" onMouseDown={onCerrar}>
            <div className="it-modal max-w-3xl text-[#0c2340] dark:text-white" onMouseDown={(e) => e.stopPropagation()}>
                <div className="relative aspect-[16/7] overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="h-full w-full" />
                    <button onClick={onCerrar} aria-label="Cerrar" className="it-icon-btn absolute top-4 right-4 bg-white/90 text-slate-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="overflow-y-auto p-6">
                    <p className="it-eyebrow">Detalle</p>
                    <h2 className="mt-1 text-2xl font-black">
                        {l.marca} {l.modelo}
                    </h2>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {datos.map(([k, v]) => (
                            <div key={k} className="rounded-2xl border p-3">
                                <small className="text-xs text-slate-400">{k}</small>
                                <p className="mt-1 font-bold">{v}</p>
                            </div>
                        ))}
                    </div>
                    {l.puertos && l.puertos.length > 0 && (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                            <b>Puertos:</b> {l.puertos.map((p) => PUERTO_ETIQUETA[p] ?? p).join(', ')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
