import { LoadingPanel } from '@/components/loading-panel';
import { Brain, Info, Megaphone, RefreshCw, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Segmento {
    tipo: 'alto_valor' | 'compradores' | 'interesados' | 'exploradores' | 'inactivos';
    nombre: string;
    accion: string;
    tamano: number;
    promedio: { presupuesto_soles: number; recomendaciones: number; pedidos: number; gasto_soles: number; dias_inactivo: number };
}

interface Resultado {
    k: number;
    silueta: number | null;
    clientes_analizados: number;
    segmentos: Segmento[];
}

interface ErrorMotor {
    error: string;
    mensaje: string;
    clientes_analizados?: number;
}

type Respuesta = Resultado | ErrorMotor;

const esError = (r: Respuesta): r is ErrorMotor => 'error' in r;

const COLOR: Record<Segmento['tipo'], string> = {
    alto_valor: 'border-violet-500/40 bg-violet-500/5',
    compradores: 'border-emerald-500/40 bg-emerald-500/5',
    interesados: 'border-cyan-500/40 bg-cyan-500/5',
    exploradores: 'border-sky-500/30 bg-sky-500/5',
    inactivos: 'border-slate-400/40 bg-slate-500/5',
};

const soles = (n: number) => `S/ ${Math.round(n).toLocaleString('es-PE')}`;

// Qué tan bien separados quedaron los grupos, en palabras (coeficiente de silueta, de -1 a 1).
function calidad(silueta: number | null): string {
    if (silueta === null) return 'sin calcular (modo de prueba)';
    if (silueta >= 0.5) return 'grupos bien separados';
    if (silueta >= 0.25) return 'grupos razonables';
    return 'grupos poco definidos: tómalos como orientación';
}

// Segmentación de clientes (Marketing + IA). El motor agrupa a los clientes con K-Means según
// su comportamiento; aquí se ven los grupos y qué campaña conviene a cada uno.
export function PanelSegmentos() {
    const [datos, setDatos] = useState<Respuesta | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await fetch('/api/admin/marketing/segmentos', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            setDatos(await res.json());
        } catch {
            setDatos({ error: 'red', mensaje: 'No se pudo conectar con el servidor.' });
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    if (cargando || !datos) return <LoadingPanel />;

    return (
        <div className="space-y-6">
            <section className="bg-card rounded-2xl border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-3xl">
                        <h3 className="flex items-center gap-2 font-bold">
                            <Brain className="h-5 w-5 text-cyan-500" /> Segmentación de clientes con IA
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm leading-6">
                            El motor agrupa a los clientes con <b>K-Means</b>, un algoritmo de aprendizaje no supervisado: nadie le dice qué grupos
                            existen, los descubre juntando a los clientes que se parecen en presupuesto, recomendaciones pedidas, compras, gasto y
                            días sin volver. Solo recibe esos números, nunca nombres ni correos.
                        </p>
                    </div>
                    <button
                        onClick={() => void cargar()}
                        className="hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                    >
                        <RefreshCw className="h-4 w-4" /> Volver a calcular
                    </button>
                </div>
                {!esError(datos) && (
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <Dato label="Clientes analizados" valor={String(datos.clientes_analizados)} />
                        <Dato label="Grupos encontrados" valor={String(datos.k)} />
                        <Dato
                            label="Calidad (silueta)"
                            valor={datos.silueta === null ? '—' : datos.silueta.toFixed(2)}
                            detalle={calidad(datos.silueta)}
                        />
                    </div>
                )}
            </section>

            {esError(datos) ? (
                <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-200">
                    {datos.mensaje}
                    {datos.clientes_analizados !== undefined && ` Hoy hay ${datos.clientes_analizados} cliente(s) con actividad.`}
                </p>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {datos.segmentos.map((s) => (
                        <article key={s.nombre} className={`rounded-2xl border p-5 ${COLOR[s.tipo]}`}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="font-black">{s.nombre}</h3>
                                <span className="bg-background inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold">
                                    <Users className="h-3.5 w-3.5" /> {s.tamano} · {Math.round((s.tamano / datos.clientes_analizados) * 100)}%
                                </span>
                            </div>
                            <p className="text-muted-foreground mt-3 text-xs font-bold uppercase">Cliente promedio del grupo</p>
                            <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <li>Presupuesto: {soles(s.promedio.presupuesto_soles)}</li>
                                <li>Recomendaciones: {s.promedio.recomendaciones}</li>
                                <li>Compras: {s.promedio.pedidos}</li>
                                <li>Gasto: {soles(s.promedio.gasto_soles)}</li>
                                <li>Sin volver: {Math.round(s.promedio.dias_inactivo)} días</li>
                            </ul>
                            <p className="bg-background mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm">
                                <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                                <span>
                                    <b>Campaña sugerida:</b> {s.accion}
                                </span>
                            </p>
                        </article>
                    ))}
                </div>
            )}

            <p className="text-muted-foreground flex items-start gap-2 text-xs leading-5">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Para enviar una campaña por correo a un grupo, cada cliente debe haber aceptado recibir publicidad (Ley 29733). Ese consentimiento y
                el envío llegarán con los avisos por correo; por ahora el panel muestra los grupos y no la lista de personas.
            </p>
        </div>
    );
}

function Dato({ label, valor, detalle }: { label: string; valor: string; detalle?: string }) {
    return (
        <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-muted-foreground text-[11px] font-bold uppercase">{label}</p>
            <p className="mt-1 text-xl font-black">{valor}</p>
            {detalle && <p className="text-muted-foreground text-xs">{detalle}</p>}
        </div>
    );
}
