import { LoadingPanel } from '@/components/loading-panel';
import type { CalidadRecomendacion, Carrera, DashboardAdmin } from '@/types/flujo';
import { BarChart3, Gauge, GraduationCap, Laptop as LaptopIcon, ListChecks, Package, Target, Timer, Users } from 'lucide-react';

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

            <PanelCalidad calidad={dashboard.calidad} />
        </div>
    );
}

function formatearDuracion(segundos: number): string {
    if (segundos < 60) return `${segundos} s`;
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return resto === 0 ? `${minutos} min` : `${minutos} min ${resto} s`;
}

/**
 * ¿La IA recomienda bien? KPIs de Ingeniería Industrial — definiciones, fórmulas y metas en
 * docs/gestion/kpis.md. Un valor null se muestra como "—": significa que aún no hay muestra,
 * no que el resultado sea malo.
 */
function PanelCalidad({ calidad }: { calidad: CalidadRecomendacion }) {
    const indicadores = [
        {
            label: 'Tasa de elección',
            valor: calidad.tasa_eleccion_pct === null ? '—' : `${calidad.tasa_eleccion_pct}%`,
            descripcion: `${calidad.perfiles_con_eleccion} de ${calidad.consultas_con_resultado} consultas eligieron una opción recomendada`,
            icon: Target,
        },
        {
            label: 'Tiempo de decisión',
            valor: calidad.tiempo_decision_mediana_seg === null ? '—' : formatearDuracion(calidad.tiempo_decision_mediana_seg),
            descripcion: 'Mediana entre recibir la recomendación y elegir',
            icon: Timer,
        },
        {
            label: 'Compatibilidad promedio',
            valor: calidad.compatibilidad_promedio === null ? '—' : `${calidad.compatibilidad_promedio}%`,
            descripcion: 'Qué tan bien calzan las laptops recomendadas',
            icon: Gauge,
        },
        {
            label: 'Cobertura del catálogo',
            valor: calidad.cobertura_pct === null ? '—' : `${calidad.cobertura_pct}%`,
            descripcion: 'Consultas que terminaron con al menos una opción',
            icon: ListChecks,
        },
    ];

    const totalElecciones = Object.values(calidad.elecciones_por_opcion).reduce((a, b) => a + b, 0);

    return (
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <div className="mb-6">
                <h3 className="font-bold">Calidad de la recomendación</h3>
                <p className="text-muted-foreground text-xs">¿La IA está recomendando bien? Indicadores definidos en docs/gestion/kpis.md</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map((k) => {
                    const Icon = k.icon;

                    return (
                        <div key={k.label} className="rounded-xl border p-4">
                            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                                <Icon className="h-4 w-4" />
                                <span className="text-xs font-semibold">{k.label}</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold">{k.valor}</p>
                            <p className="text-muted-foreground mt-1 text-xs">{k.descripcion}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6">
                <h4 className="text-sm font-semibold">Opción que más eligen</h4>
                <p className="text-muted-foreground mb-4 text-xs">Qué valora la gente cuando decide: precio, equilibrio o rendimiento</p>

                {totalElecciones === 0 ? (
                    <p className="text-muted-foreground text-sm">Todavía no hay elecciones registradas.</p>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(calidad.elecciones_por_opcion).map(([opcion, v]) => (
                            <div key={opcion}>
                                <div className="mb-1.5 flex justify-between text-xs">
                                    <span className="font-medium">{opcion}</span>
                                    <span className="font-bold text-cyan-600">
                                        {v} ({Math.round((v / totalElecciones) * 100)}%)
                                    </span>
                                </div>
                                <div className="bg-muted h-2 overflow-hidden rounded-full">
                                    <div
                                        className="h-full rounded-full bg-cyan-500 transition-all"
                                        style={{ width: `${(v / totalElecciones) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
