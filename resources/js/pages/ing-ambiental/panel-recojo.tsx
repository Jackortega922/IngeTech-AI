import { LoadingPanel } from '@/components/loading-panel';
import { CheckCircle2, Clock, Leaf, Recycle, Truck, Weight, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Respuesta de /api/admin/ambiental (App\Http\Controllers\Api\Admin\AmbientalController).
type EstadoRaee = 'pendiente' | 'recogido' | 'reciclado';

interface Recojo {
    id: number;
    codigo: string;
    nombre: string;
    distrito: string | null;
    ciudad: string | null;
    departamento: string;
    raee_detalle: string | null;
    raee_estado: EstadoRaee;
    raee_recogido_at: string | null;
    raee_reciclado_at: string | null;
    created_at: string;
}

interface Datos {
    recojos: Recojo[];
    indicadores: {
        compras: number;
        con_recojo: number;
        con_recojo_pct: number | null;
        por_estado: Record<EstadoRaee, number>;
        recuperados: number;
        peso_promedio_kg: number | null;
        kg_estimados: number | null;
        recogidos_por_mes: { mes: string; cantidad: number }[];
    };
}

const ESTADO: Record<EstadoRaee, { texto: string; clase: string; siguiente?: { valor: EstadoRaee; boton: string } }> = {
    pendiente: {
        texto: 'Pendiente de recojo',
        clase: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        siguiente: { valor: 'recogido', boton: 'Marcar recogido' },
    },
    recogido: {
        texto: 'Recogido',
        clase: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
        siguiente: { valor: 'reciclado', boton: 'Marcar reciclado' },
    },
    reciclado: { texto: 'Entregado a reciclaje', clase: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
};

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—');
const nombreMes = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString('es-PE', { month: 'short' });

/**
 * Ing. Ambiental: seguimiento del recojo RAEE. El cliente pide al comprar que se lleven su equipo
 * viejo; aquí se marca cuándo se recogió y cuándo se entregó a una empresa autorizada de reciclaje.
 */
export function PanelRecojo({ avisar }: { avisar: (msg: string) => void }) {
    const [datos, setDatos] = useState<Datos | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState<number | null>(null);

    const cargar = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/ambiental', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!res.ok) throw new Error();
            setDatos(await res.json());
            setError(null);
        } catch {
            setError('No se pudo cargar el recojo de equipos.');
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    async function avanzar(r: Recojo, estado: EstadoRaee) {
        setGuardando(r.id);
        try {
            const res = await fetch(`/api/admin/ambiental/${r.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
                body: JSON.stringify({ raee_estado: estado }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.message);
            avisar(`Pedido ${r.codigo}: ${ESTADO[estado].texto.toLowerCase()}.`);
            await cargar();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : 'No se pudo actualizar el recojo.');
        } finally {
            setGuardando(null);
        }
    }

    if (error) return <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>;
    if (!datos) return <LoadingPanel />;

    const { recojos, indicadores: ind } = datos;
    const maxMes = Math.max(1, ...ind.recogidos_por_mes.map((m) => m.cantidad));

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Tarjeta
                    icon={Recycle}
                    label="Compras con recojo"
                    valor={String(ind.con_recojo)}
                    detalle={ind.con_recojo_pct === null ? 'Aún no hay compras' : `${ind.con_recojo_pct}% de ${ind.compras} compras`}
                />
                <Tarjeta icon={Clock} label="Pendientes de recoger" valor={String(ind.por_estado.pendiente)} tono={ind.por_estado.pendiente > 0} />
                <Tarjeta
                    icon={CheckCircle2}
                    label="Equipos recuperados"
                    valor={String(ind.recuperados)}
                    detalle={`${ind.por_estado.reciclado} ya entregados a reciclaje`}
                />
                <Tarjeta
                    icon={Weight}
                    label="Residuos evitados (estimado)"
                    valor={ind.kg_estimados === null ? '—' : `${ind.kg_estimados} kg`}
                    detalle={
                        ind.peso_promedio_kg === null ? undefined : `${ind.recuperados} × ${ind.peso_promedio_kg} kg (peso promedio del catálogo)`
                    }
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                <section className="bg-card rounded-2xl border p-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                        <Truck className="h-4 w-4 text-emerald-500" /> Equipos recogidos por mes
                    </h3>
                    <div className="mt-4 flex h-32 items-end gap-2">
                        {ind.recogidos_por_mes.map((m) => (
                            <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
                                <span className="text-xs font-bold">{m.cantidad}</span>
                                <div
                                    className="w-full rounded-t-md bg-emerald-500/80"
                                    style={{ height: `${Math.max(4, (m.cantidad / maxMes) * 88)}px` }}
                                />
                                <span className="text-muted-foreground text-[10px] capitalize">{nombreMes(m.mes)}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="bg-card rounded-2xl border p-5 text-sm leading-6">
                    <h3 className="flex items-center gap-2 font-bold">
                        <Leaf className="h-4 w-4 text-emerald-500" /> Cómo funciona
                    </h3>
                    <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-5">
                        <li>Al comprar, el cliente marca que quiere entregar su equipo viejo (RAEE).</li>
                        <li>Al llevarle la laptop nueva, se recoge el viejo: «Marcar recogido».</li>
                        <li>Se entrega a una empresa autorizada para el manejo de RAEE: «Marcar reciclado».</li>
                    </ol>
                    <p className="text-muted-foreground mt-2 text-xs">
                        Los kilos son una estimación: no se pesa el equipo viejo, se usa el peso promedio de las laptops del catálogo.
                    </p>
                </section>
            </div>

            <div className="bg-card overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                        <tr>
                            <th className="px-4 py-3">Pedido</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Lugar</th>
                            <th className="px-4 py-3">Equipo a recoger</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Recogido</th>
                            <th className="px-4 py-3">Reciclado</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {recojos.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                                    Todavía ningún cliente pidió el recojo de su equipo viejo.
                                </td>
                            </tr>
                        ) : (
                            recojos.map((r) => {
                                const estado = ESTADO[r.raee_estado];
                                return (
                                    <tr key={r.id} className="border-t">
                                        <td className="px-4 py-3 font-mono text-xs font-bold">{r.codigo}</td>
                                        <td className="px-4 py-3">{r.nombre}</td>
                                        <td className="px-4 py-3 text-xs">{[r.distrito ?? r.ciudad, r.departamento].filter(Boolean).join(', ')}</td>
                                        <td className="px-4 py-3 text-xs">{r.raee_detalle ?? 'Sin detalle'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${estado.clase}`}>
                                                {estado.texto}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{fecha(r.raee_recogido_at)}</td>
                                        <td className="px-4 py-3 text-xs">{fecha(r.raee_reciclado_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {estado.siguiente && (
                                                <button
                                                    onClick={() => void avanzar(r, estado.siguiente!.valor)}
                                                    disabled={guardando === r.id}
                                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    {estado.siguiente.boton}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Tarjeta({ icon: Icon, label, valor, detalle, tono }: { icon: LucideIcon; label: string; valor: string; detalle?: string; tono?: boolean }) {
    return (
        <div className="bg-card rounded-2xl border p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-xs font-bold uppercase">
                <Icon className="h-4 w-4" /> {label}
            </p>
            <p className={`mt-2 text-3xl font-black ${tono ? 'text-amber-600 dark:text-amber-400' : ''}`}>{valor}</p>
            {detalle && <p className="text-muted-foreground mt-1 text-xs">{detalle}</p>}
        </div>
    );
}
