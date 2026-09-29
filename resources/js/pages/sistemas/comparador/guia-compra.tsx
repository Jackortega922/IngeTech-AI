import LaptopImage from '@/components/laptop-image';
import { criteriosDeCompra, idealPara, justificarPrecios, rolesPorPrecio, type Calidad, type Rol } from '@/lib/guia-compra';
import type { Laptop } from '@/types/flujo';
import { Link } from '@inertiajs/react';
import { BadgeCheck, Scale } from 'lucide-react';

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

// Guía para decidir entre 2 o 3 laptops: qué perfil tiene cada una, qué significa cada spec
// para el cliente y si la diferencia de precio se justifica. Lógica en lib/guia-compra.ts.
export default function GuiaCompra({ equipos }: { equipos: Laptop[] }) {
    const roles = rolesPorPrecio(equipos);
    const criterios = criteriosDeCompra(equipos);
    const precios = justificarPrecios(equipos);
    const nombre = (id: number) => {
        const e = equipos.find((x) => x.id === id);
        return e ? `${e.marca} ${e.modelo}` : '';
    };

    return (
        <section className="mt-4">
            <h2 className="text-xl font-bold">Guía para decidir</h2>
            <p className="text-muted-foreground mt-1 text-sm">Qué significa cada diferencia para el día a día, sin tecnicismos.</p>

            {/* Resumen por laptop */}
            <div className={`mt-4 grid gap-3 ${equipos.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                {equipos.map((e) => (
                    <article key={e.id} className="bg-card flex gap-3 rounded-xl border p-4">
                        <LaptopImage imagenUrl={e.imagen_url} marca={e.marca} tipo={e.tipo} className="h-14 w-14 shrink-0 rounded-lg" />
                        <div className="min-w-0">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ROL[roles[e.id]]}`}>
                                Opción {roles[e.id].toLowerCase()}
                            </span>
                            <h3 className="mt-1 font-semibold">
                                {e.marca} {e.modelo}
                            </h3>
                            <p className="text-muted-foreground text-xs">Ideal para: {idealPara(e)}</p>
                            <p className="mt-1 font-mono text-sm font-bold">{soles(e.precio_soles)}</p>
                        </div>
                    </article>
                ))}
            </div>

            {/* Criterio por criterio */}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                {criterios.map((c) => (
                    <article key={c.clave} className="bg-card rounded-xl border p-4">
                        <h3 className="font-semibold">{c.titulo}</h3>
                        <p className="text-muted-foreground text-xs">{c.porque}</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            {c.veredictos.map((v) => (
                                <li key={v.laptop_id} className="flex items-start gap-2">
                                    <span
                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${v.calidad ? PUNTO[v.calidad] : 'bg-muted-foreground/40'}`}
                                    />
                                    <span className="min-w-0">
                                        <span className="font-medium">{nombre(v.laptop_id)}:</span> {v.texto}
                                        {v.detalle && <span className="text-muted-foreground block text-xs">{v.detalle}</span>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
            <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Destaca
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" /> Cumple
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Tenlo en cuenta
                </span>
                <span>Pantalla, peso y puertos son datos de referencia del fabricante.</span>
            </p>

            {/* ¿Vale la diferencia de precio? */}
            {precios && (
                <article className="bg-card mt-4 rounded-xl border p-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <Scale className="h-4 w-4 text-cyan-500" /> ¿Vale la diferencia de precio?
                    </h3>
                    <p className="text-muted-foreground text-xs">
                        La más cara no siempre es la que necesitas: compara lo que te da de más con lo que vas a hacer.
                    </p>
                    <ul className="mt-3 space-y-3 text-sm">
                        {precios.otras.map((j) => (
                            <li key={j.laptop_id}>
                                <span className="font-medium">{nombre(j.laptop_id)}</span> cuesta{' '}
                                <span className="font-mono font-bold">{soles(j.diferencia)}</span> más que la {precios.base.marca}{' '}
                                {precios.base.modelo}.{' '}
                                {j.ventajas.length > 0 ? (
                                    <>
                                        A cambio te da: <span className="text-emerald-700 dark:text-emerald-300">{j.ventajas.join(', ')}</span>.
                                        Conviene si vas a aprovechar eso.
                                    </>
                                ) : (
                                    <span className="text-amber-700 dark:text-amber-300">
                                        En estas specs no ofrece ventajas claras: la diferencia sería por marca o diseño.
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </article>
            )}

            {/* Garantía */}
            <p className="text-muted-foreground mt-3 flex items-start gap-2 text-xs">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                <span>
                    Todas son equipos nuevos con garantía de fábrica y el soporte técnico de la tienda.{' '}
                    <Link href="/derecho" className="text-cyan-600 underline dark:text-cyan-400">
                        Ver garantía y devoluciones
                    </Link>
                </span>
            </p>
        </section>
    );
}
