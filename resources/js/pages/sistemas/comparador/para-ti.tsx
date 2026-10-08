import LaptopImage from '@/components/laptop-image';
import type { Laptop } from '@/types/flujo';
import { AlertTriangle, CheckCircle2, Heart } from 'lucide-react';

// Respuesta del motor (operación "afinidad", docs/arquitectura/contrato-motor.md).
export interface Afinidad {
    laptop_id: number;
    afinidad_pct: number;
    factores: { criterio: string; aporte: number }[];
    advertencias: string[];
}

/**
 * "Para ti": ordena las laptops comparadas según el cuestionario de bienvenida. Solo aparece si la
 * persona lo respondió; la recomendación con IA sigue siendo la más completa (usa además su
 * carrera, programas y presupuesto): el aviso final del comparador invita a usarla.
 */
export default function ParaTi({ afinidades, equipos }: { afinidades: Afinidad[]; equipos: Laptop[] }) {
    const filas = afinidades
        .map((a) => ({ ...a, equipo: equipos.find((e) => e.id === a.laptop_id) }))
        .filter((a): a is Afinidad & { equipo: Laptop } => Boolean(a.equipo));
    if (filas.length < 2) return null;

    const [mejor, ...resto] = filas;
    const empate = mejor.afinidad_pct === resto[0].afinidad_pct;

    return (
        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[var(--it-primary)]/30 bg-white shadow-sm dark:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-sky-50 px-5 py-4 sm:px-6 dark:bg-sky-950/40">
                <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--it-primary)] text-white">
                        <Heart className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="font-black text-slate-900 dark:text-white">Para ti</h2>
                        <p className="text-xs text-slate-500">Según lo que respondiste en tu cuestionario de bienvenida.</p>
                    </div>
                </div>
                {empate && <p className="text-xs font-semibold text-slate-500">Empatan para ti: decide por las specs de abajo.</p>}
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr]">
                {/* La que mejor encaja, con el porqué */}
                <article>
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                            <LaptopImage
                                imagenUrl={mejor.equipo.imagen_url}
                                marca={mejor.equipo.marca}
                                tipo={mejor.equipo.tipo}
                                className="h-full w-full"
                            />
                        </div>
                        <div className="min-w-0">
                            {!empate && (
                                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 uppercase dark:text-emerald-300">
                                    Mejor para ti
                                </span>
                            )}
                            <h3 className="mt-1 text-lg font-black">
                                {mejor.equipo.marca} {mejor.equipo.modelo}
                            </h3>
                            <p className="text-sm text-slate-500">
                                <b className="text-2xl font-black text-slate-900 dark:text-white">{mejor.afinidad_pct}%</b> de afinidad contigo
                            </p>
                        </div>
                    </div>
                    <Motivos afinidad={mejor} />
                </article>

                {/* Las demás, más cortas */}
                <div className="space-y-3">
                    {resto.map((a) => (
                        <article key={a.laptop_id} className="rounded-2xl border p-4">
                            <div className="flex items-baseline justify-between gap-3">
                                <h3 className="truncate text-sm font-bold">
                                    {a.equipo.marca} {a.equipo.modelo}
                                </h3>
                                <span className="shrink-0 text-sm font-black">{a.afinidad_pct}%</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full rounded-full bg-[var(--it-primary)]" style={{ width: `${a.afinidad_pct}%` }} />
                            </div>
                            <Motivos afinidad={a} compacto />
                        </article>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-start gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-slate-500">
                    Esto solo mira cómo eres tú. La recomendación con IA además considera tu carrera, tus programas y tu presupuesto.
                </p>
            </div>
        </section>
    );
}

function Motivos({ afinidad, compacto = false }: { afinidad: Afinidad; compacto?: boolean }) {
    const factores = afinidad.factores.slice(0, compacto ? 1 : 3);
    const advertencias = afinidad.advertencias.slice(0, compacto ? 1 : 2);
    if (!factores.length && !advertencias.length) return null;

    return (
        <ul className={`space-y-1.5 text-sm ${compacto ? 'mt-3' : 'mt-4'}`}>
            {factores.map((f) => (
                <li key={f.criterio} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{f.criterio}</span>
                </li>
            ))}
            {advertencias.map((a) => (
                <li key={a} className="flex gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{a}</span>
                </li>
            ))}
        </ul>
    );
}
