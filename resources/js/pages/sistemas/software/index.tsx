import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Catalogos } from '@/types/flujo';
import { Head } from '@inertiajs/react';
import { Code2, Cpu, GraduationCap, LayoutGrid, Network, Palette, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Catálogo de software', href: '/software' }];

const ICONO_POR_CATEGORIA: Record<string, { icon: typeof Code2; color: string }> = {
    Ofimática: { icon: LayoutGrid, color: '#0891b2' },
    Desarrollo: { icon: Code2, color: '#7c3aed' },
    Redes: { icon: Network, color: '#0284c7' },
    Simulación: { icon: Cpu, color: '#d97706' },
    'Diseño / CAD': { icon: Palette, color: '#db2777' },
    'Cálculo / Simulación': { icon: Cpu, color: '#d97706' },
    Salud: { icon: Stethoscope, color: '#16a34a' },
    'Análisis de datos': { icon: GraduationCap, color: '#4f46e5' },
};

export default function SoftwareIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);

    useEffect(() => {
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catálogo de software" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Catálogo de software</h1>
                    <p className="text-muted-foreground">Programas típicos por carrera, con requisitos mínimos y recomendados.</p>
                </div>

                {!catalogos ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-muted h-40 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {catalogos.software.map((s) => {
                            const carreras = catalogos.carreras.filter((c) => c.software.some((ref) => ref.id === s.id)).map((c) => c.nombre);
                            const { icon: Icono, color } = ICONO_POR_CATEGORIA[s.categoria] ?? { icon: Code2, color: '#0891b2' };

                            return (
                                <div key={s.id} className="flex flex-col rounded-xl border p-5">
                                    <div className="flex items-start gap-3">
                                        <span
                                            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                                            style={{ background: `${color}1a`, color }}
                                        >
                                            <Icono className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-muted-foreground text-xs">{s.categoria}</p>
                                            <h3 className="font-bold">{s.nombre}</h3>
                                        </div>
                                    </div>

                                    {s.descripcion && <p className="text-muted-foreground mt-3 text-sm">{s.descripcion}</p>}

                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {carreras.map((c) => (
                                            <span key={c} className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px]">
                                                {c}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                                        <div>
                                            <p className="text-muted-foreground">Mínimo</p>
                                            <p className="font-mono font-semibold">
                                                {s.min_ram_gb}GB · CPU≥{s.min_cpu_score}
                                                {s.min_gpu_dedicada ? ' · GPU' : ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Recomendado</p>
                                            <p className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                                                {s.rec_ram_gb}GB · CPU≥{s.rec_cpu_score}
                                                {s.rec_gpu_dedicada ? ' · GPU' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
