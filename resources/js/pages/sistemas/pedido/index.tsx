import ChatWidget from '@/components/chat-widget';
import LaptopImage from '@/components/laptop-image';
import { ESTADOS_PEDIDO, estadoPedido, lugarDeEnvio, soles } from '@/lib/pedidos';
import { type SharedData } from '@/types';
import type { Pedido } from '@/types/flujo';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, CreditCard, MapPin } from 'lucide-react';

export default function PedidoIndex({ pedido }: { pedido: Pedido }) {
    const { auth } = usePage<SharedData>().props;
    const p = pedido.personalizacion;
    const estado = estadoPedido(pedido.estado);
    // Línea de tiempo sin "cancelado": ese estado se muestra aparte.
    const pasos = ESTADOS_PEDIDO.filter((e) => e.value !== 'cancelado');
    const indiceActual = pasos.findIndex((e) => e.value === pedido.estado);
    // Fecha en que pasó a cada estado (la última vez, por si el admin retrocedió y volvió a avanzar).
    const fechaDe = (valor: string) => {
        const ev = [...(pedido.eventos ?? [])].reverse().find((e) => e.estado === valor);
        return ev ? new Date(ev.created_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
    };

    return (
        <>
            <Head title={`Pedido ${pedido.codigo} — IngeTech AI`} />
            <div className="min-h-screen bg-slate-50 text-[#0c2340] dark:bg-slate-950 dark:text-white">
                <header className="border-b border-slate-200 dark:border-white/10">
                    <div className="mx-auto flex max-w-3xl items-center px-6 py-5">
                        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-[#07111f]">✦</span>
                            Inge<span className="text-sky-600 dark:text-cyan-400">Tech</span> AI
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-6 py-12">
                    <div className="text-center">
                        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400" />
                        <h1 className="mt-4 text-3xl font-bold">¡Gracias por tu compra, {pedido.nombre.split(' ')[0]}!</h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Guarda este código: con él y tu correo puedes seguir tu pedido cuando quieras.
                        </p>
                        <p className="mt-4 inline-block rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 font-mono text-2xl font-bold tracking-wider text-sky-700 dark:text-cyan-300">
                            {pedido.codigo}
                        </p>
                    </div>

                    {/* Estado */}
                    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">Estado del pedido</h2>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>{estado.label}</span>
                        </div>
                        {pedido.estado === 'cancelado' ? (
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                Este pedido se canceló el {fechaDe('cancelado') ?? '—'}. Si tienes dudas, escríbele a la tienda.
                            </p>
                        ) : (
                            <ol className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
                                {pasos.map((e, i) => (
                                    <li key={e.value}>
                                        <div
                                            className={`h-1.5 rounded-full ${i <= indiceActual ? 'bg-cyan-400' : 'bg-slate-200 dark:bg-white/10'}`}
                                        />
                                        <span className={`mt-2 block ${i <= indiceActual ? 'text-[#0c2340] dark:text-white' : 'text-slate-500'}`}>
                                            {e.label}
                                        </span>
                                        {i <= indiceActual && <span className="block text-[10px] text-slate-500">{fechaDe(e.value) ?? '—'}</span>}
                                    </li>
                                ))}
                            </ol>
                        )}
                        {!auth.user && (
                            <p className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                Para volver a ver este pedido desde otro navegador, entra a{' '}
                                <Link href="/seguimiento" className="text-sky-600 underline dark:text-cyan-400">
                                    Seguimiento de pedido
                                </Link>{' '}
                                con tu código y tu correo.
                            </p>
                        )}
                    </section>

                    {/* Resumen */}
                    <section className="mt-6 grid gap-6 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <LaptopImage
                                    imagenUrl={p.laptop.imagen_url}
                                    marca={p.laptop.marca}
                                    tipo={p.laptop.tipo}
                                    className="h-14 w-14 shrink-0 rounded-lg"
                                />
                                <div>
                                    <p className="font-bold">
                                        {p.laptop.marca} {p.laptop.modelo}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {p.ram_gb} GB RAM · {p.almacenamiento_gb} GB
                                    </p>
                                </div>
                            </div>
                            {p.items.length > 0 && (
                                <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    {p.items.map((i) => i.item && <li key={i.id}>+ {i.item.nombre}</li>)}
                                </ul>
                            )}
                            <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{soles(pedido.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Envío</span>
                                    <span className="font-mono">{Number(pedido.costo_envio) === 0 ? 'Gratis' : soles(pedido.costo_envio)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-[#0c2340] dark:border-white/10 dark:text-white">
                                    <span>Total pagado</span>
                                    <span className="font-mono text-sky-700 dark:text-cyan-300">{soles(pedido.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                            <div>
                                <p className="flex items-center gap-2 font-semibold">
                                    <MapPin className="h-4 w-4 text-sky-600 dark:text-cyan-400" /> Envío a
                                </p>
                                <p className="mt-1 text-slate-600 dark:text-slate-300">
                                    {pedido.direccion}, {lugarDeEnvio(pedido)}
                                </p>
                                {pedido.referencia && <p className="text-xs text-slate-500">Ref.: {pedido.referencia}</p>}
                                <p className="mt-1 text-xs text-slate-500">
                                    Contacto: {pedido.telefono} · {pedido.email}
                                </p>
                            </div>
                            <div>
                                <p className="flex items-center gap-2 font-semibold">
                                    <CreditCard className="h-4 w-4 text-sky-600 dark:text-cyan-400" /> Pago
                                </p>
                                <p className="mt-1 text-slate-600 dark:text-slate-300">
                                    <span className="uppercase">{pedido.tarjeta_marca}</span> terminada en {pedido.tarjeta_ultimos4}
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300/80">Pago simulado: no se realizó ningún cobro.</p>
                            </div>
                        </div>
                    </section>

                    <div className="mt-10 flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-center">
                        {auth.user ? (
                            <Link href="/dashboard#pedidos" className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-[#07111f] hover:bg-cyan-300">
                                Ver mis pedidos
                            </Link>
                        ) : (
                            <Link href="/register" className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-[#07111f] hover:bg-cyan-300">
                                Crea una cuenta para tus próximas compras
                            </Link>
                        )}
                        <Link
                            href="/"
                            className="rounded-xl border border-slate-200 px-6 py-3 font-semibold hover:border-cyan-400 dark:border-white/15"
                        >
                            Volver a la tienda
                        </Link>
                    </div>
                </main>
                <ChatWidget />
            </div>
        </>
    );
}
