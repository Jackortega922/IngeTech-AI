import { LoadingPanel } from '@/components/loading-panel';
import { soles } from '@/lib/contabilidad';
import { estadoPedido } from '@/lib/pedidos';
import type { ContabilidadAdmin } from '@/types/flujo';
import { Ban, BarChart3, Coins, Download, FileText, Landmark, Receipt, ShoppingBag, Tag } from 'lucide-react';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Aporte de Contabilidad: ventas REALES desde los pedidos (no cancelados), con el IGV
 * desglosado, ventas por mes y por marca, boletas y el registro de ventas exportable.
 * Ver ContabilidadController.
 */
export function PanelContabilidad({ datos }: { datos: ContabilidadAdmin | null }) {
    if (!datos) {
        return <LoadingPanel />;
    }

    const kpis = [
        { label: 'Ventas (con IGV)', valor: soles(datos.ventas_total, 2), descripcion: `${datos.numero_ventas} ventas válidas`, icon: Coins },
        { label: 'Base imponible', valor: soles(datos.base_imponible, 2), descripcion: 'Ventas sin IGV', icon: Landmark },
        {
            label: `IGV (${datos.igv_porcentaje}%)`,
            valor: soles(datos.igv, 2),
            descripcion: 'Impuesto incluido en las ventas',
            icon: Receipt,
        },
        { label: 'Ticket promedio', valor: soles(datos.ticket_promedio, 2), descripcion: 'Monto promedio por venta', icon: ShoppingBag },
    ];

    const meses = Object.entries(datos.por_mes);
    const maxMes = Math.max(1, ...meses.map(([, m]) => m.monto));
    const marcas = Object.entries(datos.por_marca);
    const maxMarca = Math.max(1, ...marcas.map(([, m]) => m.monto));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                    Ventas reales de la tienda. Los precios incluyen IGV ({datos.igv_porcentaje}%); se muestra desglosado.
                </p>
                {/* Enlace normal (no fetch): el navegador descarga el archivo con la sesión del admin. */}
                <a
                    href="/api/admin/contabilidad/registro-ventas.csv"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-emerald-500/10"
                >
                    <Download className="h-4 w-4" /> Exportar registro de ventas (CSV)
                </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k) => (
                    <div key={k.label} className="bg-card rounded-2xl border p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{k.label}</p>
                                <p className="mt-2 text-2xl font-bold">{k.valor}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                                <k.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-3 text-xs">{k.descripcion}</p>
                    </div>
                ))}
            </div>

            {datos.descuentos.cantidad > 0 && (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
                    <Tag className="h-4 w-4 text-emerald-500" />
                    {datos.descuentos.cantidad} {datos.descuentos.cantidad === 1 ? 'venta usó' : 'ventas usaron'} cupón: S/{' '}
                    {datos.descuentos.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })} descontados (gasto de Marketing). Las ventas ya
                    están netas de descuento.
                </p>
            )}

            {datos.anulaciones.cantidad > 0 && (
                <p className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm">
                    <Ban className="h-4 w-4 text-rose-500" />
                    {datos.anulaciones.cantidad} {datos.anulaciones.cantidad === 1 ? 'pedido anulado' : 'pedidos anulados'} por{' '}
                    {soles(datos.anulaciones.monto, 2)} (no se cuentan como ventas).
                </p>
            )}

            {datos.numero_ventas === 0 ? (
                <div className="bg-card rounded-2xl border p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                        <BarChart3 className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 font-bold">Aún no hay ventas</h3>
                    <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
                        En cuanto un cliente compre una laptop, aquí aparecerán las ventas, el IGV y las boletas.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                        <h3 className="font-bold">Ventas por mes</h3>
                        <p className="text-muted-foreground text-xs">Últimos 6 meses, con IGV</p>
                        <div className="mt-6 flex h-44 items-end gap-3">
                            {meses.map(([mes, m]) => (
                                <div key={mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                                    <span className="text-[10px] font-bold text-emerald-600">{m.monto > 0 ? soles(m.monto) : ''}</span>
                                    <div
                                        className="w-full rounded-t-md bg-emerald-500/80"
                                        style={{ height: `${Math.max((m.monto / maxMes) * 100, m.monto > 0 ? 4 : 1)}%` }}
                                    />
                                    <span className="text-muted-foreground text-[11px]">{MESES[Number(mes.slice(5)) - 1]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                        <h3 className="font-bold">Ventas por marca</h3>
                        <p className="text-muted-foreground text-xs">Monto vendido y número de ventas</p>
                        <div className="mt-6 space-y-4">
                            {marcas.map(([marca, m]) => (
                                <div key={marca}>
                                    <div className="mb-1.5 flex justify-between text-xs">
                                        <span className="font-medium">{marca}</span>
                                        <span className="font-bold text-emerald-600">
                                            {soles(m.monto)} · {m.ventas} {m.ventas === 1 ? 'venta' : 'ventas'}
                                        </span>
                                    </div>
                                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(m.monto / maxMarca) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {datos.ultimas.length > 0 && (
                <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="p-5">
                        <h3 className="font-bold">Últimos comprobantes</h3>
                        <p className="text-muted-foreground text-xs">Boletas de venta (simuladas) de los pedidos más recientes</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-5 py-3">Comprobante</th>
                                    <th className="px-5 py-3">Fecha</th>
                                    <th className="px-5 py-3">Cliente</th>
                                    <th className="px-5 py-3">Laptop</th>
                                    <th className="px-5 py-3 text-right">Total</th>
                                    <th className="px-5 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datos.ultimas.map((v) => {
                                    const estado = estadoPedido(v.estado);
                                    return (
                                        <tr key={v.codigo} className="border-t">
                                            <td className="px-5 py-3">
                                                <a
                                                    href={`/pedido/${v.codigo}/boleta`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-emerald-600 hover:underline"
                                                >
                                                    <FileText className="h-3.5 w-3.5" /> {v.comprobante}
                                                </a>
                                            </td>
                                            <td className="text-muted-foreground px-5 py-3">
                                                {new Date(v.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3">{v.cliente}</td>
                                            <td className="text-muted-foreground px-5 py-3">{v.laptop}</td>
                                            <td
                                                className={`px-5 py-3 text-right font-mono font-bold ${v.estado === 'cancelado' ? 'text-muted-foreground line-through' : ''}`}
                                            >
                                                {soles(v.total, 2)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.clase}`}>
                                                    {estado.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
