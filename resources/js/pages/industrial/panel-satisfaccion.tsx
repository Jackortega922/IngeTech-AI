import { Estrellas } from '@/components/tienda/encuesta-satisfaccion';
import type { GrupoSatisfaccion, SatisfaccionClientes } from '@/types/flujo';
import { BrainCircuit, HeartHandshake, MessageSquareText } from 'lucide-react';
import type { ReactNode } from 'react';

// Con menos respuestas que esto, una diferencia entre grupos puede ser casualidad.
const MUESTRA_MINIMA = 5;

// ¿La laptop le sirvió de verdad? Encuesta después de la entrega. Lo importante para la IA: si lo
// que recomendó (y con más % de compatibilidad) termina en clientes más satisfechos.
export function PanelSatisfaccion({ s }: { s: SatisfaccionClientes }) {
    return (
        <section className="bg-card space-y-5 rounded-2xl border p-5 shadow-sm">
            <div>
                <h3 className="flex items-center gap-2 font-bold">
                    <HeartHandshake className="h-5 w-5 text-cyan-500" /> Satisfacción después de la compra
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                    Encuesta que el cliente responde al recibir su laptop (desde el correo de «entregado» o desde su pedido). Es la prueba final de si
                    la recomendación acertó.
                </p>
            </div>

            {s.respuestas === 0 ? (
                <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                    Aún no hay respuestas. {s.entregados > 0 ? `Hay ${s.entregados} pedido(s) entregado(s) esperando la opinión del cliente.` : ''}
                </p>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Dato titulo="Satisfacción promedio" valor={`${s.promedio} / 5`}>
                            <Estrellas valor={Math.round(s.promedio ?? 0)} />
                        </Dato>
                        <Dato titulo="Volverían a elegirla" valor={`${s.volveria_pct}%`} />
                        <Dato titulo="Respondieron" valor={`${s.respuestas} de ${s.entregados}`}>
                            <span className="text-muted-foreground text-xs">{s.tasa_respuesta_pct}% de los pedidos entregados</span>
                        </Dato>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Tabla
                            titulo="¿Lo que recomendó la IA dejó más satisfechos?"
                            primera="Compra"
                            filas={s.por_origen.map((g) => ({ ...g, nombre: g.origen }))}
                        />
                        <Tabla
                            titulo="¿Más compatibilidad, más satisfacción?"
                            primera="Compatibilidad"
                            filas={s.por_compatibilidad.map((g) => ({ ...g, nombre: g.rango }))}
                        />
                    </div>
                    <p className="text-muted-foreground flex items-start gap-2 text-xs leading-5">
                        <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                        Si las compras recomendadas por la IA, o las de mayor % de compatibilidad, no salen más satisfechas, el cálculo del motor
                        necesita ajuste: estas respuestas son datos reales para revisarlo. Con menos de {MUESTRA_MINIMA} respuestas por fila (*),
                        tómalo como una pista.
                    </p>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                            <p className="text-muted-foreground mb-2 text-xs font-bold uppercase">Lo que no salió como esperaban</p>
                            <ul className="space-y-2 text-sm">
                                {s.aspectos.map((a) => (
                                    <li key={a.clave}>
                                        <div className="flex justify-between gap-3">
                                            <span>{a.etiqueta}</span>
                                            <span className="font-mono text-xs">{a.cantidad}</span>
                                        </div>
                                        <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                                            <div
                                                className="h-full rounded-full bg-amber-500"
                                                style={{ width: `${(a.cantidad / s.respuestas) * 100}%` }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-bold uppercase">
                                <MessageSquareText className="h-3.5 w-3.5" /> Comentarios recientes
                            </p>
                            {s.comentarios.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Nadie dejó un comentario todavía.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {s.comentarios.map((c, i) => (
                                        <li key={i} className="bg-muted/40 rounded-xl p-3 text-sm">
                                            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                                                <Estrellas valor={c.satisfaccion} chica />
                                                <span>{c.laptop ?? 'Laptop'}</span>
                                                <span className="font-mono">{c.pedido}</span>
                                                <span>{new Date(c.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                            <p className="mt-1">«{c.texto}»</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

function Dato({ titulo, valor, children }: { titulo: string; valor: string; children?: ReactNode }) {
    return (
        <div className="bg-muted/40 rounded-xl p-4">
            <p className="text-muted-foreground text-[11px] font-bold uppercase">{titulo}</p>
            <p className="mt-1 text-2xl font-black">{valor}</p>
            {children}
        </div>
    );
}

function Tabla({ titulo, primera, filas }: { titulo: string; primera: string; filas: (GrupoSatisfaccion & { nombre: string })[] }) {
    return (
        <div className="overflow-x-auto">
            <p className="mb-1 text-sm font-semibold">{titulo}</p>
            <table className="w-full min-w-[360px] text-sm">
                <thead className="text-muted-foreground text-left text-xs">
                    <tr>
                        <th className="py-2 pr-3">{primera}</th>
                        <th className="py-2 pr-3 text-right">Respuestas</th>
                        <th className="py-2 pr-3">Satisfacción</th>
                        <th className="py-2 text-right">Volverían</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map((f) => (
                        <tr key={f.nombre} className="border-t">
                            <td className="py-2 pr-3">{f.nombre}</td>
                            <td className="py-2 pr-3 text-right font-mono">
                                {f.respuestas}
                                {f.respuestas > 0 && f.respuestas < MUESTRA_MINIMA && <span className="text-amber-500">*</span>}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                                {f.promedio === null ? (
                                    <span className="text-muted-foreground">—</span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Estrellas valor={Math.round(f.promedio)} chica />
                                        <span className="font-mono text-xs">{f.promedio}</span>
                                    </span>
                                )}
                            </td>
                            <td className="py-2 text-right font-mono">{f.volveria_pct === null ? '—' : `${f.volveria_pct}%`}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
