import { NOMBRE_SEGMENTO, type TipoSegmento } from '@/pages/marketing/panel-cupones';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Fila {
    enviados: number;
    compraron_por_correo: number;
    usos: number;
    ventas: number;
    descuento: number;
    conversion_pct: number | null;
    retorno: number | null;
}

interface FilaCupon extends Fila {
    id: number;
    codigo: string;
    segmento: TipoSegmento | null;
    activo: boolean;
}

interface FilaGrupo extends Fila {
    segmento: TipoSegmento | 'todos';
    cupones: number;
}

interface Efectividad {
    cupones: FilaCupon[];
    por_grupo: FilaGrupo[];
}

const soles = (n: number) => `S/ ${Math.round(n).toLocaleString('es-PE')}`;
const nombreGrupo = (s: TipoSegmento | 'todos' | null) => (s === null || s === 'todos' ? 'Todos' : NOMBRE_SEGMENTO[s]);

// ¿Funcionaron las campañas? Cierra el ciclo de la segmentación: K-Means arma los grupos, se les
// envía un cupón y aquí se ve qué grupos compraron con él.
export function PanelEfectividad() {
    const [datos, setDatos] = useState<Efectividad | null>(null);

    const cargar = useCallback(async () => {
        const res = await fetch('/api/admin/cupones/efectividad', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        setDatos(res.ok ? await res.json() : { cupones: [], por_grupo: [] });
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    if (!datos || datos.cupones.length === 0) return null;

    return (
        <section className="bg-card space-y-5 rounded-2xl border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                    <h3 className="flex items-center gap-2 font-bold">
                        <TrendingUp className="h-5 w-5 text-cyan-500" /> Efectividad de las campañas
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                        La <b>conversión</b> cuenta a quienes compraron con el cupón <b>después de recibirlo por correo</b>. El <b>retorno</b> dice
                        cuántos soles se vendieron por cada sol descontado. Por grupo se ve qué clientes de la segmentación responden a las ofertas.
                    </p>
                </div>
                <button
                    onClick={() => void cargar()}
                    className="hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                >
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </button>
            </div>

            <Tabla
                titulo="Por grupo"
                primera="Grupo"
                filas={datos.por_grupo.map((g) => ({
                    ...g,
                    clave: g.segmento,
                    nombre: nombreGrupo(g.segmento),
                    detalle: `${g.cupones} ${g.cupones === 1 ? 'cupón' : 'cupones'}`,
                }))}
            />
            <Tabla
                titulo="Por cupón"
                primera="Cupón"
                filas={datos.cupones.map((c) => ({
                    ...c,
                    clave: String(c.id),
                    nombre: c.codigo,
                    detalle: nombreGrupo(c.segmento),
                    apagado: !c.activo,
                }))}
            />
        </section>
    );
}

type FilaTabla = Fila & { clave: string; nombre: string; detalle: string; apagado?: boolean };

function Tabla({ titulo, primera, filas }: { titulo: string; primera: string; filas: FilaTabla[] }) {
    return (
        <div>
            <p className="text-muted-foreground mb-1 text-xs font-bold uppercase">{titulo}</p>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                    <thead className="text-muted-foreground text-left text-xs">
                        <tr>
                            <th className="py-2 pr-3">{primera}</th>
                            <th className="py-2 pr-3 text-right">Enviados</th>
                            <th className="py-2 pr-3 text-right">Compraron</th>
                            <th className="py-2 pr-3">Conversión</th>
                            <th className="py-2 pr-3 text-right">Usos totales</th>
                            <th className="py-2 pr-3 text-right">Ventas</th>
                            <th className="py-2 pr-3 text-right">Descontado</th>
                            <th className="py-2 text-right">Retorno</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((f) => (
                            <tr key={f.clave} className={`border-t ${f.apagado ? 'opacity-50' : ''}`}>
                                <td className="py-2 pr-3">
                                    <span className="font-semibold">{f.nombre}</span>
                                    <span className="text-muted-foreground block text-xs">{f.detalle}</span>
                                </td>
                                <td className="py-2 pr-3 text-right font-mono">{f.enviados}</td>
                                <td className="py-2 pr-3 text-right font-mono">{f.compraron_por_correo}</td>
                                <td className="py-2 pr-3">
                                    <Conversion pct={f.conversion_pct} />
                                </td>
                                <td className="py-2 pr-3 text-right font-mono">{f.usos}</td>
                                <td className="py-2 pr-3 text-right whitespace-nowrap">{soles(f.ventas)}</td>
                                <td className="py-2 pr-3 text-right whitespace-nowrap">{soles(f.descuento)}</td>
                                <td className="py-2 text-right whitespace-nowrap">{f.retorno === null ? '—' : `S/ ${f.retorno} por S/ 1`}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Conversion({ pct }: { pct: number | null }) {
    if (pct === null) return <span className="text-muted-foreground text-xs">sin envíos</span>;

    return (
        <div className="flex items-center gap-2">
            <div className="bg-muted h-2 w-20 overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="font-mono text-xs">{pct}%</span>
        </div>
    );
}
