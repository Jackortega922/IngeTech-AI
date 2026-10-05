import type { EmisorTienda, Reclamo } from '@/types/flujo';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, Printer } from 'lucide-react';
import type { ReactNode } from 'react';

const fecha = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-PE', { dateStyle: 'long' });

// Constancia de la hoja de reclamación (Derecho): lo que el consumidor presentó y, cuando la
// tienda responde, la respuesta. Siempre en blanco, como la boleta, para imprimir o guardar en PDF.
export default function HojaReclamacion({ reclamo: r, proveedor, plazoDias }: { reclamo: Reclamo; proveedor: EmisorTienda; plazoDias: number }) {
    const porConfigurar = <span className="text-slate-400 italic">por configurar</span>;

    return (
        <>
            <Head title={`Hoja ${r.numero} — Libro de Reclamaciones`} />
            <div className="min-h-screen bg-slate-100 py-8 text-slate-900 print:bg-white print:py-0">
                <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
                    <Link href="/libro-reclamaciones" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" /> Libro de Reclamaciones
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 rounded-xl bg-[#0c2340] px-4 py-2 text-sm font-bold text-white hover:bg-[#102f55]"
                    >
                        <Printer className="h-4 w-4" /> Imprimir o guardar PDF
                    </button>
                </div>

                <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
                    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xl font-black">{proveedor.razon_social ?? 'IngeTech AI'}</p>
                            <p className="mt-1 text-sm text-slate-600">RUC {proveedor.ruc ?? porConfigurar}</p>
                            <p className="text-sm text-slate-600">Domicilio: {proveedor.direccion ?? porConfigurar}</p>
                        </div>
                        <div className="rounded-xl border-2 border-slate-900 px-5 py-3 text-center">
                            <p className="text-xs font-bold tracking-wider uppercase">Hoja de reclamación</p>
                            <p className="mt-1 font-mono text-lg font-black">{r.numero}</p>
                            <p className="text-xs text-slate-500">{fecha(r.created_at)}</p>
                        </div>
                    </header>

                    {r.estado === 'respondido' ? (
                        <p className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" /> Respondida el {fecha(r.respondido_at!)}
                        </p>
                    ) : (
                        <p className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            <Clock className="h-4 w-4" /> En revisión. La tienda debe responder a más tardar el {fecha(r.fecha_limite)} ({plazoDias}{' '}
                            días hábiles).
                        </p>
                    )}

                    <Bloque titulo="1. Identificación del consumidor reclamante">
                        <Fila k="Nombre">{r.nombre}</Fila>
                        <Fila k="Documento">
                            {r.tipo_documento} {r.numero_documento}
                        </Fila>
                        <Fila k="Domicilio">{r.domicilio}</Fila>
                        <Fila k="Correo">{r.email}</Fila>
                        {r.telefono && <Fila k="Celular">{r.telefono}</Fila>}
                        {r.menor_de_edad && <Fila k="Padre, madre o tutor">{r.apoderado}</Fila>}
                    </Bloque>

                    <Bloque titulo="2. Identificación del bien contratado">
                        <Fila k="Tipo">{r.bien === 'producto' ? 'Producto' : 'Servicio'}</Fila>
                        <Fila k="Descripción">{r.descripcion_bien}</Fila>
                        {r.pedido_codigo && <Fila k="Pedido">{r.pedido_codigo}</Fila>}
                        <Fila k="Monto reclamado">
                            {r.monto_reclamado ? `S/ ${Number(r.monto_reclamado).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '—'}
                        </Fila>
                    </Bloque>

                    <Bloque titulo="3. Detalle de la reclamación y pedido del consumidor">
                        <Fila k="Tipo">{r.tipo === 'reclamo' ? 'Reclamo' : 'Queja'}</Fila>
                        <Fila k="Detalle">
                            <span className="whitespace-pre-line">{r.detalle}</span>
                        </Fila>
                        <Fila k="Pedido">
                            <span className="whitespace-pre-line">{r.pedido_consumidor}</span>
                        </Fila>
                    </Bloque>

                    <Bloque titulo="4. Observaciones y acciones adoptadas por el proveedor">
                        {r.respuesta ? (
                            <p className="text-sm whitespace-pre-line">{r.respuesta}</p>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Pendiente de respuesta.</p>
                        )}
                    </Bloque>

                    <footer className="mt-8 space-y-1 border-t pt-4 text-[11px] leading-5 text-slate-500">
                        <p>
                            <b>Reclamo:</b> disconformidad relacionada a los productos o servicios. <b>Queja:</b> disconformidad no relacionada a los
                            productos o servicios, o malestar o descontento respecto a la atención al público.
                        </p>
                        <p>
                            La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para
                            interponer una denuncia ante el INDECOPI.
                        </p>
                        <p className="print:hidden">
                            Guarda el número {r.numero}: con él y tu correo puedes consultar esta hoja desde el Libro de Reclamaciones.
                        </p>
                    </footer>
                </article>
            </div>
        </>
    );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <section className="mt-6">
            <h2 className="bg-slate-900 px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase">{titulo}</h2>
            <div className="mt-3 space-y-2">{children}</div>
        </section>
    );
}

function Fila({ k, children }: { k: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 text-sm sm:grid-cols-[170px_1fr]">
            <span className="font-semibold text-slate-500">{k}</span>
            <span>{children}</span>
        </div>
    );
}
