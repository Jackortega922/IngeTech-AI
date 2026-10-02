import { soles } from '@/lib/contabilidad';
import { lugarDeEnvio } from '@/lib/pedidos';
import type { Pedido } from '@/types/flujo';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

interface Emisor {
    razon_social: string | null;
    ruc: string | null;
    direccion: string | null;
}

// Boleta de venta electrónica SIMULADA (Contabilidad). Siempre en blanco, también en modo
// oscuro: es un documento para imprimir o guardar en PDF. No tiene validez tributaria.
export default function BoletaIndex({
    pedido,
    desglose,
    igvPorcentaje,
    emisor,
}: {
    pedido: Pedido;
    desglose: { base: number; igv: number; total: number };
    igvPorcentaje: number;
    emisor: Emisor;
}) {
    const p = pedido.personalizacion;
    const items = p.items.filter((i) => i.item);
    const precioItems = items.reduce((suma, i) => suma + Number(i.item!.precio_soles), 0);
    // El subtotal del pedido es la laptop configurada + kit y accesorios.
    const precioLaptop = Number(pedido.subtotal) - precioItems;
    const envio = Number(pedido.costo_envio);

    const lineas = [
        {
            descripcion: `Laptop ${p.laptop.marca} ${p.laptop.modelo} — ${p.ram_gb} GB RAM, ${p.almacenamiento_gb} GB ${p.laptop.almacenamiento_tipo}`,
            importe: precioLaptop,
        },
        ...items.map((i) => ({ descripcion: i.item!.nombre, importe: Number(i.item!.precio_soles) })),
        ...(envio > 0 ? [{ descripcion: 'Envío', importe: envio }] : []),
    ];

    const porConfigurar = <span className="text-slate-400 italic">por configurar</span>;

    return (
        <>
            <Head title={`Boleta ${pedido.comprobante} — IngeTech AI`} />
            <div className="min-h-screen bg-slate-100 py-8 text-slate-900 print:bg-white print:py-0">
                {/* Acciones: no salen al imprimir */}
                <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
                    <Link
                        href={`/pedido/${pedido.codigo}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" /> Volver al pedido
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 rounded-xl bg-[#0c2340] px-4 py-2 text-sm font-bold text-white hover:bg-[#102f55]"
                    >
                        <Printer className="h-4 w-4" /> Imprimir o guardar PDF
                    </button>
                </div>

                <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
                    <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xl font-black">{emisor.razon_social ?? 'IngeTech AI'}</p>
                            <p className="mt-1 text-sm text-slate-600">Dirección: {emisor.direccion ?? porConfigurar}</p>
                        </div>
                        <div className="rounded-lg border-2 border-slate-800 px-6 py-3 text-center">
                            <p className="text-sm font-bold">RUC {emisor.ruc ?? porConfigurar}</p>
                            <p className="mt-1 text-base font-black tracking-wide">BOLETA DE VENTA ELECTRÓNICA</p>
                            <p className="mt-1 font-mono text-lg font-bold">{pedido.comprobante}</p>
                        </div>
                    </header>

                    <section className="mt-8 grid gap-2 text-sm sm:grid-cols-2">
                        <p>
                            <b>Fecha de emisión:</b> {new Date(pedido.created_at).toLocaleDateString('es-PE')}
                        </p>
                        <p>
                            <b>Moneda:</b> Soles (PEN)
                        </p>
                        <p>
                            <b>Cliente:</b> {pedido.nombre}
                        </p>
                        <p>
                            <b>Pedido:</b> <span className="font-mono">{pedido.codigo}</span>
                        </p>
                        <p className="sm:col-span-2">
                            <b>Dirección de entrega:</b> {pedido.direccion}, {lugarDeEnvio(pedido)}
                        </p>
                    </section>

                    <table className="mt-8 w-full text-sm">
                        <thead>
                            <tr className="border-y-2 border-slate-800 text-left">
                                <th className="py-2 pr-3">Cant.</th>
                                <th className="py-2 pr-3">Descripción</th>
                                <th className="py-2 text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineas.map((l, i) => (
                                <tr key={i} className="border-b border-slate-200">
                                    <td className="py-2 pr-3">1</td>
                                    <td className="py-2 pr-3">{l.descripcion}</td>
                                    <td className="py-2 text-right font-mono">{soles(l.importe, 2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <section className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span>Op. gravada</span>
                            <span className="font-mono">{soles(desglose.base, 2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>IGV ({igvPorcentaje}%)</span>
                            <span className="font-mono">{soles(desglose.igv, 2)}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-base font-black">
                            <span>Importe total</span>
                            <span className="font-mono">{soles(desglose.total, 2)}</span>
                        </div>
                    </section>

                    <footer className="mt-10 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
                        <p>
                            Pago con tarjeta <span className="uppercase">{pedido.tarjeta_marca}</span> terminada en {pedido.tarjeta_ultimos4}.
                        </p>
                        <p className="mt-2 font-semibold text-slate-600">
                            Representación SIMULADA de una boleta de venta electrónica, generada con fines académicos. No ha sido enviada a SUNAT y no
                            tiene validez tributaria; el pago también es simulado.
                        </p>
                    </footer>
                </article>
            </div>
        </>
    );
}
