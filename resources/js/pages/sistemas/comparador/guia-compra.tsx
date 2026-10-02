import LaptopImage from '@/components/laptop-image';
import { criteriosDeCompra, idealPara, justificarPrecios, rolesPorPrecio, type Calidad, type Rol } from '@/lib/guia-compra';
import type { Laptop } from '@/types/flujo';
import { Link } from '@inertiajs/react';
import { BadgeCheck, CheckCircle2, Cpu, HardDrive, Monitor, Scale, Zap } from 'lucide-react';

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

/* Icono según el criterio */
function iconoCriterio(clave: string) {
    const texto = clave.toLowerCase();

    if (texto.includes('proces')) {
        return <Cpu className="h-5 w-5" />;
    }

    if (texto.includes('ram') || texto.includes('memoria')) {
        return <Zap className="h-5 w-5" />;
    }

    if (texto.includes('almacen') || texto.includes('disco') || texto.includes('storage')) {
        return <HardDrive className="h-5 w-5" />;
    }

    if (texto.includes('pantalla') || texto.includes('display')) {
        return <Monitor className="h-5 w-5" />;
    }

    return <CheckCircle2 className="h-5 w-5" />;
}

/* Color del icono */
function colorCriterio(clave: string) {
    const texto = clave.toLowerCase();

    if (texto.includes('proces')) {
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
    }

    if (texto.includes('ram') || texto.includes('memoria')) {
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
    }

    if (texto.includes('almacen') || texto.includes('disco') || texto.includes('storage')) {
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }

    if (texto.includes('pantalla') || texto.includes('display')) {
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    }

    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
}

/* Extrae un número tipo 38/100 */
function extraerScore(texto: string) {
    const match = texto.match(/(\d+)\s*\/\s*100/);
    return match ? Number(match[1]) : null;
}

/* Extrae GB */
function extraerGB(texto: string) {
    const match = texto.match(/(\d+)\s*GB/i);
    return match ? Number(match[1]) : null;
}

/* Extrae pulgadas */
function extraerPulgadas(texto: string) {
    const match = texto.match(/(\d+(?:\.\d+)?)\s*(?:["″]|pulgadas)/i);
    return match ? match[1] : null;
}

export default function GuiaCompra({ equipos }: { equipos: Laptop[] }) {
    const roles = rolesPorPrecio(equipos);
    const criterios = criteriosDeCompra(equipos);
    const precios = justificarPrecios(equipos);

    const nombre = (id: number) => {
        const e = equipos.find((x) => x.id === id);

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
                    const iconBg = colorCriterio(c.clave);

                    return (
                        <article key={c.clave} className="bg-card overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
                            {/* Cabecera del criterio */}
                            <div className="bg-muted/20 border-b px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                                        {iconoCriterio(c.clave)}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold">{c.titulo}</h3>

                                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{c.porque}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Opciones */}
                            <div className="space-y-3 p-5">
                                {c.veredictos.map((v) => {
                                    const textoCompleto = `${v.texto} ${v.detalle ?? ''}`;

                                    const score = extraerScore(textoCompleto);

                                    const gb = extraerGB(textoCompleto);

                                    const pulgadas = extraerPulgadas(textoCompleto);

                                    const calidadColor = v.calidad ? PUNTO[v.calidad] : 'bg-muted-foreground/40';

                                    const porcentaje =
                                        score !== null
                                            ? Math.min(100, Math.max(0, score))
                                            : v.calidad === 'alta'
                                              ? 85
                                              : v.calidad === 'media'
                                                ? 65
                                                : 40;

                                    return (
                                        <div key={v.laptop_id} className="bg-background rounded-xl border p-4">
                                            {/* Nombre + calidad */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${calidadColor}`} />

                                                    <span className="truncate text-sm font-bold">{nombre(v.laptop_id)}</span>
                                                </div>

                                                {v.calidad && (
                                                    <span className="bg-muted shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase">
                                                        {v.calidad === 'alta' ? 'Destaca' : v.calidad === 'media' ? 'Cumple' : 'Considerar'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Métrica visual */}
                                            {score !== null ? (
                                                <div className="mt-4">
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                                                Rendimiento
                                                            </p>

                                                            <p className="mt-0.5 text-2xl font-black">
                                                                {score}
                                                                <span className="text-muted-foreground text-sm font-medium">/100</span>
                                                            </p>
                                                        </div>

                                                        <span className="text-muted-foreground text-xs font-semibold">
                                                            {score >= 70 ? 'Alto' : score >= 50 ? 'Medio' : 'Básico'}
                                                        </span>
                                                    </div>

                                                    <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                                                        <div
                                                            className={`h-full rounded-full ${calidadColor} transition-all`}
                                                            style={{
                                                                width: `${porcentaje}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : gb !== null ? (
                                                <div className="mt-4 flex items-center gap-4">
                                                    <div className="bg-muted/60 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl">
                                                        <span className="text-xl font-black">{gb}</span>

                                                        <span className="text-muted-foreground text-[9px] font-bold uppercase">GB</span>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold">Capacidad</p>

                                                        <p className="text-muted-foreground mt-0.5 text-xs">{v.texto}</p>
                                                    </div>
                                                </div>
                                            ) : pulgadas !== null ? (
                                                <div className="mt-4 flex items-center gap-4">
                                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                        <div className="text-center">
                                                            <p className="text-xl font-black">{pulgadas}</p>
                                                            <p className="text-[9px] font-bold uppercase">pulgadas</p>
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold">Tamaño de pantalla</p>

                                                        <p className="text-muted-foreground mt-0.5 text-xs">{v.texto}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-3">
                                                    <p className="text-sm leading-relaxed">{v.texto}</p>
                                                </div>
                                            )}

                                            {/* Descripción secundaria */}
                                            {v.detalle && score !== null && (
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
