import LaptopImage from '@/components/laptop-image';
import type { Cotizacion } from '@/types/flujo';
import { Mail, Receipt } from 'lucide-react';

// Lista de trabajo del asesor: cada personalización que un cliente confirmó, con sus datos
// de contacto, para escribirle y cerrar la compra (no hay pago en línea).
export function PanelCotizaciones({ cotizaciones }: { cotizaciones: Cotizacion[] | null }) {
    if (!cotizaciones) return null;

    const total = cotizaciones.reduce((suma, c) => suma + Number(c.precio_total), 0);

    return (
        <div className="space-y-4">
            <div className="bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-cyan-500" />
                        <h2 className="text-xl font-bold">Cotizaciones</h2>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Personalizaciones que confirmaron los clientes. Escríbeles para cerrar la compra.
                    </p>
                </div>
                <div className="flex gap-2 text-sm font-bold">
                    <span className="rounded-xl bg-cyan-500/10 px-4 py-2 text-cyan-600">{cotizaciones.length} cotizaciones</span>
                    <span className="rounded-xl bg-emerald-500/10 px-4 py-2 text-emerald-600">S/ {total.toLocaleString('es-PE')}</span>
                </div>
            </div>

            {cotizaciones.length === 0 ? (
                <div className="bg-card text-muted-foreground rounded-2xl border p-12 text-center text-sm shadow-sm">
                    Todavía no hay cotizaciones. Aparecen aquí cuando un cliente confirma una personalización.
                </div>
            ) : (
                <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-5 py-4">Cliente</th>
                                    <th className="px-5 py-4">Laptop</th>
                                    <th className="px-5 py-4">Configuración</th>
                                    <th className="px-5 py-4">Origen</th>
                                    <th className="px-5 py-4">Fecha</th>
                                    <th className="px-5 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cotizaciones.map((c) => (
                                    <tr key={c.id} className="hover:bg-muted/30 border-t align-top transition">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold">{c.user?.name}</p>
                                            <a
                                                href={`mailto:${c.user?.email}`}
                                                className="mt-0.5 inline-flex items-center gap-1 text-xs text-cyan-600 hover:underline"
                                            >
                                                <Mail className="h-3 w-3" /> {c.user?.email}
                                            </a>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <LaptopImage
                                                    imagenUrl={c.laptop.imagen_url}
                                                    marca={c.laptop.marca}
                                                    tipo={c.laptop.tipo}
                                                    className="h-10 w-10 shrink-0 rounded-lg"
                                                />
                                                <span className="font-medium">
                                                    {c.laptop.marca} {c.laptop.modelo}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground px-5 py-4">
                                            {c.ram_gb} GB RAM · {c.almacenamiento_gb} GB
                                            {c.items.length > 0 && (
                                                <p className="mt-0.5 text-xs">
                                                    {c.items
                                                        .map((i) => i.item?.nombre)
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    c.recomendacion_id ? 'bg-violet-500/10 text-violet-600' : 'bg-slate-500/10 text-slate-600'
                                                }`}
                                            >
                                                {c.recomendacion_id ? 'Recomendación IA' : 'Catálogo'}
                                            </span>
                                        </td>
                                        <td className="text-muted-foreground px-5 py-4">
                                            {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono font-bold">
                                            S/ {Number(c.precio_total).toLocaleString('es-PE')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
