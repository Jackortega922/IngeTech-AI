import { LoadingPanel } from '@/components/loading-panel';
import { CheckCircle2, ClipboardList, HeartHandshake, ShieldCheck, UserX, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

// Respuesta de /api/admin/psicologia (App\Http\Controllers\Api\Admin\PsicologiaController).
interface Opcion {
    valor: string;
    etiqueta: string;
    cantidad?: number;
    puntos?: number;
    primero?: number;
}

interface Pregunta {
    clave: string;
    pregunta: string;
    tipo: 'unica' | 'multiple' | 'orden' | 'marcas';
    respondieron: number;
    opciones?: Opcion[];
    preferidas?: Opcion[];
    evitadas?: Opcion[];
}

interface FilaConfianza {
    valor: string;
    etiqueta: string;
    consultas: number;
    eligieron: number;
    eligio_la_primera: number;
    posicion_promedio: number | null;
}

interface Datos {
    clientes: number;
    completaron: number;
    omitieron: number;
    preguntas: Pregunta[];
    confianza: { por_estilo: FilaConfianza[]; por_nivel: FilaConfianza[] };
}

// Con menos elecciones que esto, un porcentaje dice poco: se avisa en vez de sacar conclusiones.
const MUESTRA_MINIMA = 5;

const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

/**
 * Psicología: cómo son nuestros clientes (cuestionario de bienvenida) y si la recomendación les
 * genera confianza según cómo deciden. Solo cifras de conjunto, sin nombres (Ley 29733).
 */
export function PanelPsicologia() {
    const [datos, setDatos] = useState<Datos | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/admin/psicologia', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then(setDatos)
            .catch(() => setError('No se pudo cargar el perfil de los clientes.'));
    }, []);

    if (error) return <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>;
    if (!datos) return <LoadingPanel />;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <Tarjeta icon={HeartHandshake} label="Clientes registrados" valor={String(datos.clientes)} />
                <Tarjeta
                    icon={CheckCircle2}
                    label="Respondieron el cuestionario"
                    valor={`${datos.completaron}`}
                    detalle={`${pct(datos.completaron, datos.clientes)}% de los clientes`}
                />
                <Tarjeta icon={UserX} label="Lo omitieron" valor={String(datos.omitieron)} />
            </div>

            <p className="text-muted-foreground flex items-start gap-2 text-xs leading-5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Solo se muestran cifras de conjunto: nadie del personal ve qué respondió una persona en particular (Ley 29733). Sirve para ajustar
                cómo se le habla a los clientes, por ejemplo destacar laptops ligeras si a la mayoría le molesta el peso.
            </p>

            {datos.completaron === 0 ? (
                <p className="bg-card rounded-2xl border p-8 text-center text-sm text-slate-500">
                    Todavía ningún cliente completó el cuestionario de bienvenida.
                </p>
            ) : (
                <>
                    <section>
                        <Titulo icon={ClipboardList} titulo="Cómo son nuestros clientes" subtitulo="Respuestas del cuestionario de bienvenida." />
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            {datos.preguntas.map((p) => (
                                <TarjetaPregunta key={p.clave} pregunta={p} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <Titulo
                            icon={HeartHandshake}
                            titulo="¿La recomendación genera confianza?"
                            subtitulo="Qué laptop eligen, de las que les recomendó la IA, según cómo dicen que deciden. Si quien pide «dime cuál es la mejor» no elige la primera, la recomendación no lo convenció."
                        />
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                            <TablaConfianza titulo="Según cómo prefieren decidir" filas={datos.confianza.por_estilo} />
                            <TablaConfianza titulo="Según su comodidad con la tecnología" filas={datos.confianza.por_nivel} />
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function TarjetaPregunta({ pregunta: p }: { pregunta: Pregunta }) {
    return (
        <article className="bg-card rounded-2xl border p-5">
            <h3 className="text-sm font-bold">{p.pregunta}</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
                {p.respondieron} {p.respondieron === 1 ? 'respuesta' : 'respuestas'}
                {p.tipo === 'multiple' && ' · podían marcar varias'}
                {p.tipo === 'orden' && ' · puntaje por orden de importancia'}
            </p>

            {p.tipo === 'marcas' ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Barras titulo="Prefieren" opciones={p.preferidas ?? []} total={p.respondieron} color="bg-emerald-500" />
                    <Barras titulo="Evitan" opciones={p.evitadas ?? []} total={p.respondieron} color="bg-rose-500" />
                </div>
            ) : p.tipo === 'orden' ? (
                <ul className="mt-4 space-y-2.5">
                    {(p.opciones ?? []).map((o, i) => {
                        const maximo = Math.max(1, ...(p.opciones ?? []).map((x) => x.puntos ?? 0));
                        return (
                            <li key={o.valor}>
                                <div className="flex justify-between gap-2 text-xs">
                                    <span>
                                        <b>{i + 1}.</b> {o.etiqueta}
                                    </span>
                                    <span className="text-muted-foreground shrink-0">1.ª opción de {o.primero}</span>
                                </div>
                                <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct(o.puntos ?? 0, maximo)}%` }} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="mt-4">
                    <Barras opciones={p.opciones ?? []} total={p.respondieron} color="bg-sky-500" />
                </div>
            )}
        </article>
    );
}

function Barras({ titulo, opciones, total, color }: { titulo?: string; opciones: Opcion[]; total: number; color: string }) {
    return (
        <div>
            {titulo && <p className="text-muted-foreground mb-2 text-[11px] font-bold uppercase">{titulo}</p>}
            <ul className="space-y-2.5">
                {opciones.map((o) => (
                    <li key={o.valor}>
                        <div className="flex justify-between gap-2 text-xs">
                            <span>{o.etiqueta}</span>
                            <span className="text-muted-foreground shrink-0 font-mono">
                                {o.cantidad} · {pct(o.cantidad ?? 0, total)}%
                            </span>
                        </div>
                        <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct(o.cantidad ?? 0, total)}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TablaConfianza({ titulo, filas }: { titulo: string; filas: FilaConfianza[] }) {
    return (
        <div className="bg-card overflow-x-auto rounded-2xl border">
            <p className="border-b px-4 py-3 text-sm font-bold">{titulo}</p>
            <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                    <tr>
                        <th className="px-4 py-2.5">Grupo</th>
                        <th className="px-4 py-2.5 text-right">Consultas</th>
                        <th className="px-4 py-2.5 text-right">Eligieron</th>
                        <th className="px-4 py-2.5 text-right">Eligió la 1.ª</th>
                        <th className="px-4 py-2.5 text-right">Puesto promedio</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map((f) => (
                        <tr key={f.valor} className="border-t">
                            <td className="px-4 py-2.5">{f.etiqueta}</td>
                            <td className="px-4 py-2.5 text-right font-mono">{f.consultas}</td>
                            <td className="px-4 py-2.5 text-right font-mono">{f.eligieron}</td>
                            <td className="px-4 py-2.5 text-right font-mono">
                                {f.eligieron === 0 ? '—' : `${pct(f.eligio_la_primera, f.eligieron)}%`}
                                {f.eligieron > 0 && f.eligieron < MUESTRA_MINIMA && (
                                    <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400" title="Muestra pequeña">
                                        *
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono">{f.posicion_promedio ?? '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-muted-foreground border-t px-4 py-2 text-[11px]">
                * Menos de {MUESTRA_MINIMA} elecciones: muestra pequeña, tómalo como una pista, no como una conclusión.
            </p>
        </div>
    );
}

function Titulo({ icon: Icon, titulo, subtitulo }: { icon: LucideIcon; titulo: string; subtitulo: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Icon className="h-5 w-5" />
            </span>
            <div>
                <h2 className="text-lg font-bold">{titulo}</h2>
                <p className="text-muted-foreground text-sm">{subtitulo}</p>
            </div>
        </div>
    );
}

function Tarjeta({ icon: Icon, label, valor, detalle }: { icon: LucideIcon; label: string; valor: string; detalle?: string }) {
    return (
        <div className="bg-card rounded-2xl border p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-xs font-bold uppercase">
                <Icon className="h-4 w-4" /> {label}
            </p>
            <p className="mt-2 text-3xl font-black">{valor}</p>
            {detalle && <p className="text-muted-foreground mt-1 text-xs">{detalle}</p>}
        </div>
    );
}
