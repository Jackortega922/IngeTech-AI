import LaptopImage from '@/components/laptop-image';
import { criteriosDeCompra, idealPara, justificarPrecios, rolesPorPrecio, type Calidad, type Rol } from '@/lib/guia-compra';
import type { Laptop } from '@/types/flujo';
import { Link } from '@inertiajs/react';
import { BadgeCheck, BatteryFull, CheckCircle2, Cpu, HardDrive, Monitor, Scale, Usb, Weight, Zap } from 'lucide-react';
import { type ReactNode } from 'react';

const PUNTO: Record<Calidad, string> = {
    alta: 'bg-emerald-500',
    media: 'bg-cyan-500',
    baja: 'bg-amber-500',
};

const ROL: Record<Rol, string> = {
    Económica: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    Equilibrada: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    Premium: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
};

const soles = (n: number | string) => `S/ ${Number(n).toLocaleString('es-PE')}`;

const ICONO: Record<string, { icon: typeof Cpu; color: string }> = {
    cpu: { icon: Cpu, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    ram: { icon: Zap, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    almacenamiento: { icon: HardDrive, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    pantalla: { icon: Monitor, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    peso: { icon: Weight, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
    bateria: { icon: BatteryFull, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    puertos: { icon: Usb, color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
};

const ETIQUETA_CALIDAD: Record<Calidad, string> = { alta: 'Destaca', media: 'Cumple', baja: 'Considerar' };

// Cifra destacada de cada criterio, tomada del dato de la laptop (no del texto).
function cifra(clave: string, l: Laptop): { valor: string; unidad: string } | null {
    if (clave === 'ram') return { valor: String(l.ram_gb), unidad: 'GB' };
    if (clave === 'almacenamiento')
        return l.almacenamiento_gb >= 1024
            ? { valor: String(l.almacenamiento_gb / 1024), unidad: 'TB' }
            : { valor: String(l.almacenamiento_gb), unidad: 'GB' };
    if (clave === 'pantalla' && l.pantalla_pulgadas) return { valor: String(l.pantalla_pulgadas), unidad: 'pulgadas' };
    if (clave === 'peso' && l.peso_kg) return { valor: String(l.peso_kg), unidad: 'kg' };
    if (clave === 'bateria' && l.bateria_horas) return { valor: String(l.bateria_horas), unidad: 'horas' };
    return null;
}

// Diseño: Marco (PR #41). Lógica: lib/guia-compra.ts. A diferencia de su versión, las cifras salen
// del dato de la laptop y siempre se muestra el detalle (ampliable, resolución, avisos de puertos).
// `despuesDelPrecio`: lo que va tras "¿Vale la diferencia de precio?" (el bloque "Para ti").
export default function GuiaCompra({ equipos, despuesDelPrecio }: { equipos: Laptop[]; despuesDelPrecio?: ReactNode }) {
    const roles = rolesPorPrecio(equipos);
    const criterios = criteriosDeCompra(equipos);
    const precios = justificarPrecios(equipos);

    const laptop = (id: number) => equipos.find((x) => x.id === id);
    const nombre = (id: number) => {
        const e = laptop(id);
        return e ? `${e.marca} ${e.modelo}` : '';
    };

    return (
        <section className="mt-8">
            {/* ─────────────────────────────────────────────
                CABECERA
            ───────────────────────────────────────────── */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        <Scale className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Guía para decidir</h2>

                        <p className="text-muted-foreground mt-1 text-sm">
                            Compara las diferencias importantes y descubre cuál se adapta mejor a tu uso.
                        </p>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────
                EQUIPOS
            ───────────────────────────────────────────── */}
            <div className={`grid gap-4 ${equipos.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                {equipos.map((e) => (
                    <article
                        key={e.id}
                        className="group bg-card relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        {/* línea superior */}
                        <div
                            className={`absolute inset-x-0 top-0 h-1 ${
                                roles[e.id] === 'Premium' ? 'bg-violet-500' : roles[e.id] === 'Económica' ? 'bg-emerald-500' : 'bg-cyan-500'
                            }`}
                        />

                        <div className="flex items-start gap-4">
                            <div className="bg-muted/50 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                                <LaptopImage imagenUrl={e.imagen_url} marca={e.marca} tipo={e.tipo} className="h-full w-full object-contain" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase ${ROL[roles[e.id]]}`}>
                                        Opción {roles[e.id]?.toLowerCase()}
                                    </span>
                                </div>

                                <h3 className="truncate text-lg font-bold">
                                    {e.marca} {e.modelo}
                                </h3>

                                <p className="text-muted-foreground mt-1 text-xs">Ideal para: {idealPara(e)}</p>

                                <div className="mt-3 flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Precio</p>

                                        <p className="text-xl font-black">{soles(e.precio_soles)}</p>
                                    </div>

                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* ─────────────────────────────────────────────
                CRITERIOS
            ───────────────────────────────────────────── */}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
                {criterios.map((c) => {
                    const { icon: Icono, color } = ICONO[c.clave] ?? { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600' };

                    return (
                        <article key={c.clave} className="bg-card overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
                            <div className="bg-muted/20 border-b px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                                        <Icono className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold">{c.titulo}</h3>
                                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{c.porque}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-5">
                                {c.veredictos.map((v) => {
                                    const l = laptop(v.laptop_id);
                                    const calidadColor = v.calidad ? PUNTO[v.calidad] : 'bg-muted-foreground/40';
                                    const score = c.clave === 'cpu' ? (l?.rendimiento_score ?? null) : null;
                                    const dato = l ? cifra(c.clave, l) : null;

                                    return (
                                        <div key={v.laptop_id} className="bg-background rounded-xl border p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${calidadColor}`} />
                                                    <span className="truncate text-sm font-bold">{nombre(v.laptop_id)}</span>
                                                </div>
                                                {v.calidad && (
                                                    <span className="bg-muted shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase">
                                                        {ETIQUETA_CALIDAD[v.calidad]}
                                                    </span>
                                                )}
                                            </div>

                                            {score !== null ? (
                                                <div className="mt-4">
                                                    <div className="flex items-end justify-between gap-3">
                                                        <p className="text-sm leading-relaxed">{v.texto}</p>
                                                        <p className="shrink-0 text-2xl font-black">
                                                            {score}
                                                            <span className="text-muted-foreground text-sm font-medium">/100</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                                                        <div
                                                            className={`h-full rounded-full ${calidadColor} transition-all`}
                                                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : dato ? (
                                                <div className="mt-4 flex items-center gap-4">
                                                    <div className="bg-muted/60 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl">
                                                        <span className="text-xl font-black">{dato.valor}</span>
                                                        <span className="text-muted-foreground text-[9px] font-bold uppercase">{dato.unidad}</span>
                                                    </div>
                                                    <p className="min-w-0 text-sm leading-relaxed">{v.texto}</p>
                                                </div>
                                            ) : (
                                                <p className="mt-3 text-sm leading-relaxed">{v.texto}</p>
                                            )}

                                            {v.detalle && (
                                                <p className="text-muted-foreground mt-3 border-t pt-3 text-xs leading-relaxed">{v.detalle}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* ─────────────────────────────────────────────
                LEYENDA
            ───────────────────────────────────────────── */}
            <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-card inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Destaca
                </span>

                <span className="bg-card inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    Cumple
                </span>

                <span className="bg-card inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Tenlo en cuenta
                </span>
            </div>

            <p className="text-muted-foreground mt-2 text-xs">Pantalla, peso y puertos son datos de referencia del fabricante.</p>

            {/* ─────────────────────────────────────────────
                DIFERENCIA DE PRECIO
            ───────────────────────────────────────────── */}
            {precios && (
                <article className="bg-card mt-6 overflow-hidden rounded-2xl border">
                    <div className="bg-muted/20 border-b px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                <Scale className="h-5 w-5" />
                            </div>

                            <div>
                                <h3 className="font-bold">¿Vale la diferencia de precio?</h3>

                                <p className="text-muted-foreground text-xs">Compara lo que pagas con lo que realmente obtienes.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 p-5">
                        {precios.otras.map((j) => (
                            <div key={j.laptop_id} className="bg-background rounded-xl border p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold">{nombre(j.laptop_id)}</p>

                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Frente a {precios.base.marca} {precios.base.modelo}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-cyan-500/10 px-4 py-2 text-right">
                                        <p className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">Diferencia</p>

                                        <p className="font-mono text-sm font-black text-cyan-700 dark:text-cyan-300">+{soles(j.diferencia)}</p>
                                    </div>
                                </div>

                                {j.ventajas.length > 0 ? (
                                    <div className="mt-4">
                                        <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase">Obtienes a cambio</p>

                                        <div className="flex flex-wrap gap-2">
                                            {j.ventajas.map((ventaja) => (
                                                <span
                                                    key={ventaja}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {ventaja}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-muted-foreground mt-3 text-xs">Conviene si vas a aprovechar estas características.</p>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                        En estas especificaciones no ofrece ventajas claras; la diferencia puede estar relacionada con marca o diseño.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </article>
            )}

            {despuesDelPrecio}

            {/* ─────────────────────────────────────────────
                GARANTÍA
            ───────────────────────────────────────────── */}
            <div className="bg-card mt-5 flex items-start gap-3 rounded-xl border p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <BadgeCheck className="h-5 w-5" />
                </div>

                <div className="text-xs leading-relaxed">
                    <p className="font-semibold">Compra con tranquilidad</p>

                    <p className="text-muted-foreground mt-0.5">
                        Todas son equipos nuevos con garantía de fábrica y soporte técnico de la tienda.{' '}
                        <Link href="/derecho" className="font-medium text-cyan-600 underline dark:text-cyan-400">
                            Ver garantía y devoluciones
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
