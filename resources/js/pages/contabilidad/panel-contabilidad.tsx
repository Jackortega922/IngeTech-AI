import { LoadingPanel } from '@/components/loading-panel';
import type { ContabilidadAdmin } from '@/types/flujo';
import { BarChart3, Coins, Receipt, TrendingUp } from 'lucide-react';

/**
 * Aporte de Contabilidad: métricas financieras básicas (ingreso potencial,
 * ticket promedio, distribución por rango de precio) derivadas de las
 * recomendaciones generadas. Ver docs/contexto-proyecto.md §5.1.
 */
export function PanelContabilidad({ datos }: { datos: ContabilidadAdmin | null }) {
    if (!datos) {
        return <LoadingPanel />;
    }

    const kpis = [
        {
            label: 'Ingreso potencial',
            valor: `S/ ${datos.ingreso_potencial_total.toLocaleString('es-PE')}`,
            descripcion: 'Suma del precio de todo lo recomendado',
            icon: Coins,
        },
        {
            label: 'Ticket promedio',
            valor: `S/ ${datos.ticket_promedio.toLocaleString('es-PE')}`,
            descripcion: 'Precio promedio por recomendación',
            icon: Receipt,
        },
        {
            label: 'Recomendaciones',
            valor: datos.total_recomendaciones,
            descripcion: 'Equipos recomendados en total',
            icon: TrendingUp,
        },
    ];

    const maxBucket = Math.max(...Object.values(datos.por_rango_precio), 1);
    const hayDatos = datos.total_recomendaciones > 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                {kpis.map((k) => {
                    const Icon = k.icon;

                    return (
                        <div
                            key={k.label}
                            className="group bg-card rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{k.label}</p>
                                    <p className="mt-2 text-3xl font-bold">{k.valor}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-muted-foreground mt-3 text-xs">{k.descripcion}</p>
                        </div>
                    );
                })}
            </div>

            {!hayDatos ? (
                <div className="bg-card rounded-2xl border p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                        <BarChart3 className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 font-bold">Aún no hay recomendaciones registradas</h3>
                    <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
                        En cuanto se generen recomendaciones, aquí aparecerán las métricas financieras.
                    </p>
                </div>
            ) : (
                <div className="bg-card rounded-2xl border p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold">Recomendaciones por rango de precio</h3>
                            <p className="text-muted-foreground text-xs">Distribución del valor recomendado</p>
                        </div>
                        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(datos.por_rango_precio).map(([rango, v]) => (
                            <div key={rango}>
                                <div className="mb-1.5 flex justify-between text-xs">
                                    <span className="font-medium">{rango}</span>
                                    <span className="font-bold text-emerald-600">{v}</span>
                                </div>
                                <div className="bg-muted h-2 overflow-hidden rounded-full">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                        style={{ width: `${(v / maxBucket) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
