import LaptopImage from '@/components/laptop-image';
import { ESTADOS_PEDIDO, estadoPedido, lugarDeEnvio, soles } from '@/lib/pedidos';
import type { EstadoPedido, Pedido } from '@/types/flujo';
import { Mail, Package, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

// Pedidos de la tienda: quién compró, qué, a dónde se envía, y el estado del envío (que el
// admin avanza a mano: pagado -> preparando -> enviado -> entregado).
export function PanelPedidos({ pedidos: iniciales, avisar }: { pedidos: Pedido[] | null; avisar: (texto: string) => void }) {
    const [pedidos, setPedidos] = useState<Pedido[] | null>(iniciales);
    useEffect(() => setPedidos(iniciales), [iniciales]);

    if (!pedidos) return null;

    const vendido = pedidos.filter((p) => p.estado !== 'cancelado').reduce((s, p) => s + Number(p.total), 0);

    async function cambiarEstado(p: Pedido, estado: EstadoPedido) {
        const res = await fetch(`/api/admin/pedidos/${p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            body: JSON.stringify({ estado }),
        });
        if (!res.ok) {
            avisar('No se pudo cambiar el estado del pedido.');
            return;
        }
        setPedidos((lista) => lista?.map((x) => (x.id === p.id ? { ...x, estado } : x)) ?? null);
        avisar(`Pedido ${p.codigo}: ${estadoPedido(estado).label.toLowerCase()}.`);
    }

    return (
        <div className="space-y-4">
            <div className="bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-cyan-500" />
                        <h2 className="text-xl font-bold">Pedidos</h2>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Compras de la tienda (pago simulado). Actualiza el estado a medida que avanza el envío.
                    </p>
                </div>
                <div className="flex gap-2 text-sm font-bold">
                    <span className="rounded-xl bg-cyan-500/10 px-4 py-2 text-cyan-600">{pedidos.length} pedidos</span>
                    <span className="rounded-xl bg-emerald-500/10 px-4 py-2 text-emerald-600">{soles(vendido)} vendidos</span>
                </div>
            </div>

            {pedidos.length === 0 ? (
                <div className="bg-card text-muted-foreground rounded-2xl border p-12 text-center text-sm shadow-sm">
                    Todavía no hay pedidos. Aparecen aquí cuando alguien compra una laptop, con o sin cuenta.
                </div>
            ) : (
                <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-5 py-4">Pedido</th>
                                    <th className="px-5 py-4">Cliente</th>
                                    <th className="px-5 py-4">Laptop</th>
                                    <th className="px-5 py-4">Envío a</th>
                                    <th className="px-5 py-4 text-right">Total</th>
                                    <th className="px-5 py-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map((p) => {
                                    const l = p.personalizacion.laptop;
                                    return (
                                        <tr key={p.id} className="hover:bg-muted/30 border-t align-top transition">
                                            <td className="px-5 py-4">
                                                <a href={`/pedido/${p.codigo}`} className="font-mono font-semibold text-cyan-600 hover:underline">
                                                    {p.codigo}
                                                </a>
                                                {p.comprobante && (
                                                    <a
                                                        href={`/pedido/${p.codigo}/boleta`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground block font-mono text-xs hover:underline"
                                                    >
                                                        Boleta {p.comprobante}
                                                    </a>
                                                )}
                                                <p className="text-muted-foreground mt-0.5 text-xs">
                                                    {new Date(p.created_at).toLocaleDateString('es-PE', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {p.user_id ? 'Con cuenta' : 'Invitado'}
                                                    {p.personalizacion.recomendacion_id ? ' · vía IA' : ''}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold">{p.nombre}</p>
                                                <a
                                                    href={`mailto:${p.email}`}
                                                    className="mt-0.5 flex items-center gap-1 text-xs text-cyan-600 hover:underline"
                                                >
                                                    <Mail className="h-3 w-3" /> {p.email}
                                                </a>
                                                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    <Phone className="h-3 w-3" /> {p.telefono}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <LaptopImage
                                                        imagenUrl={l.imagen_url}
                                                        marca={l.marca}
                                                        tipo={l.tipo}
                                                        className="h-10 w-10 shrink-0 rounded-lg"
                                                    />
                                                    <div>
                                                        <p className="font-medium">
                                                            {l.marca} {l.modelo}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {p.personalizacion.ram_gb} GB · {p.personalizacion.almacenamiento_gb} GB
                                                            {p.personalizacion.items.length > 0 &&
                                                                ` · ${p.personalizacion.items
                                                                    .map((i) => i.item?.nombre)
                                                                    .filter(Boolean)
                                                                    .join(', ')}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted-foreground px-5 py-4 text-xs">
                                                <p>{p.direccion}</p>
                                                <p>{lugarDeEnvio(p)}</p>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold">{soles(p.total)}</td>
                                            <td className="px-5 py-4">
                                                <select
                                                    value={p.estado}
                                                    onChange={(e) => cambiarEstado(p, e.target.value as EstadoPedido)}
                                                    aria-label={`Estado del pedido ${p.codigo}`}
                                                    className={`rounded-full border-0 px-3 py-1 text-xs font-bold ${estadoPedido(p.estado).clase}`}
                                                >
                                                    {ESTADOS_PEDIDO.map((e) => (
                                                        <option key={e.value} value={e.value}>
                                                            {e.label}
                                                        </option>
                                                    ))}
                                                </select>
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
