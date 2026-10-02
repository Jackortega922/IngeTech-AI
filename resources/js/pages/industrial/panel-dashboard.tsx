import { LoadingPanel } from '@/components/loading-panel';
import type { Carrera, DashboardAdmin } from '@/types/flujo';
import { BarChart3, GraduationCap, Laptop as LaptopIcon, Package, Users } from 'lucide-react';

/**
 * Aporte de Ingeniería Industrial: KPIs y analítica del sistema (consultas
 * por carrera, por rango de presupuesto). Ver docs/contexto-proyecto.md §5.1.
 */
export function PanelDashboard({ dashboard, carreras }: { dashboard: DashboardAdmin | null; carreras: Carrera[] }) {
    if (!dashboard) {
        return <LoadingPanel />;
    }

    const kpis = [
        {
            label: 'Equipos',
            valor: dashboard.total_equipos,
            descripcion: 'Equipos disponibles',
            icon: LaptopIcon,
        },
        {
            label: 'Software',
            valor: dashboard.total_software,
            descripcion: 'Programas registrados',
            icon: Package,
        },
        {
            label: 'Carreras',
            valor: dashboard.total_carreras,
            descripcion: 'Carreras configuradas',
            icon: GraduationCap,
        },
        {
            label: 'Estudiantes',
            valor: dashboard.total_usuarios,
            descripcion: 'Usuarios registrados',
            icon: Users,
        },
        {
            label: 'Consultas',
            valor: dashboard.total_consultas,
            descripcion: 'Recomendaciones generadas',
            icon: BarChart3,
        },
    ];

    const hayConsultas = dashboard.total_consultas > 0;

    const maxCarrera = hayConsultas ? Math.max(...Object.values(dashboard.por_carrera), 1) : 1;

    const maxBucket = hayConsultas ? Math.max(...Object.values(dashboard.por_presupuesto), 1) : 1;

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

                                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-600 dark:text-cyan-400">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>

                            <p className="text-muted-foreground mt-3 text-xs">{k.descripcion}</p>
                        </div>
                    );
                })}
            </div>

            {!hayConsultas ? (
                <div className="bg-card rounded-2xl border p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
                        <BarChart3 className="h-7 w-7" />
                    </div>

                    <h3 className="mt-4 font-bold">Aún no hay consultas registradas</h3>

                    <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
                        Cuando los estudiantes utilicen el recomendador, aquí aparecerán estadísticas del sistema.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* CARRERAS */}
                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">Consultas por carrera</h3>
                                <p className="text-muted-foreground text-xs">Distribución de recomendaciones</p>
                            </div>

                            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-600">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(dashboard.por_carrera)
                                .sort((a, b) => b[1] - a[1])
                                .map(([clave, v]) => (
                                    <div key={clave}>
                                        <div className="mb-1.5 flex justify-between text-xs">
                                            <span className="font-medium">{carreras.find((c) => c.clave === clave)?.nombre ?? clave}</span>

                                            <span className="font-bold text-cyan-600">{v}</span>
                                        </div>

                                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                                            <div
                                                className="h-full rounded-full bg-cyan-500 transition-all"
                                                style={{
                                                    width: `${(v / maxCarrera) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* PRESUPUESTO */}
                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">Rangos de presupuesto</h3>
                                <p className="text-muted-foreground text-xs">Presupuestos más consultados</p>
                            </div>

                            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(dashboard.por_presupuesto).map(([k, v]) => (
                                <div key={k}>
                                    <div className="mb-1.5 flex justify-between text-xs">
                                        <span className="font-medium">{k}</span>

                                        <span className="font-bold text-violet-600">{v}</span>
                                    </div>

                                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                                        <div
                                            className="h-full rounded-full bg-violet-500 transition-all"
                                            style={{
                                                width: `${(v / maxBucket) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
