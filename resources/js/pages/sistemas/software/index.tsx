import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Catalogos, Software } from '@/types/flujo';
import { Head } from '@inertiajs/react';
import { Check, Code2, Cpu, GraduationCap, LayoutGrid, Network, Palette, Search, Stethoscope, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Catálogo de software', href: '/software' }];

// Diseño: Marco (PR #41). Sin sus imágenes guardadas en el navegador (localStorage): cada
// programa se muestra con el ícono de su categoría. Se conservan de main las carreras que usan
// cada programa.
const icons: Record<string, typeof Code2> = {
    Ofimática: LayoutGrid,
    Desarrollo: Code2,
    Redes: Network,
    Simulación: Cpu,
    'Diseño / CAD': Palette,
    'Cálculo / Simulación': Cpu,
    Salud: Stethoscope,
    'Análisis de datos': GraduationCap,
};

export default function SoftwareIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Software | null>(null);
    useEffect(() => {
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos);
    }, []);
    const filtered = useMemo(
        () => catalogos?.software.filter((x) => `${x.nombre} ${x.categoria} ${x.clave}`.toLowerCase().includes(query.toLowerCase())) ?? [],
        [catalogos, query],
    );
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catálogo de software" />
            <main className="it-container py-7 sm:py-9">
                <section className="rounded-[2rem] border bg-white p-7 shadow-sm sm:p-9 dark:bg-slate-900">
                    <span className="it-eyebrow">CATÁLOGO SOFTWARE</span>
                    <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <h1 className="text-3xl font-black sm:text-4xl">Software y requisitos técnicos.</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                                Consulta qué necesita cada programa y descubre por qué influye en la recomendación de tu equipo.
                            </p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                className="it-input pl-10"
                                placeholder="Buscar software..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </section>
                {!catalogos ? (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="it-skeleton h-60" />
                        ))}
                    </div>
                ) : (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((item) => (
                            <SoftwareCard key={item.id} item={item} onOpen={() => setSelected(item)} />
                        ))}
                    </div>
                )}
                <SoftwareModal
                    item={selected}
                    carreras={
                        selected && catalogos
                            ? catalogos.carreras.filter((c) => c.software.some((ref) => ref.id === selected.id)).map((c) => c.nombre)
                            : []
                    }
                    onClose={() => setSelected(null)}
                />
            </main>
        </AppLayout>
    );
}
function SoftwareCard({ item, onOpen }: { item: Software; onOpen: () => void }) {
    const Icon = icons[item.categoria] ?? Code2;
    return (
        <article className="it-card it-card-hover overflow-hidden">
            <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-950">
                <div className="grid h-full place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-3xl bg-[var(--it-primary-soft)] text-[var(--it-primary)]">
                        <Icon className="h-8 w-8" />
                    </span>
                </div>
                <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-slate-700 uppercase shadow-sm">
                    {item.categoria}
                </span>
            </div>
            <div className="p-5">
                <h2 className="text-xl font-black">{item.nombre}</h2>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
                    {item.descripcion || 'Software disponible para análisis de compatibilidad.'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                        <small className="text-xs text-slate-400">Mínimo</small>
                        <p className="mt-1 text-sm font-bold">
                            {item.min_ram_gb} GB · CPU {item.min_cpu_score}
                        </p>
                    </div>
                    <div className="rounded-xl bg-[var(--it-primary-soft)] p-3">
                        <small className="text-xs text-[var(--it-primary)]">Recomendado</small>
                        <p className="mt-1 text-sm font-bold">
                            {item.rec_ram_gb} GB · CPU {item.rec_cpu_score}
                        </p>
                    </div>
                </div>
                <button onClick={onOpen} className="it-btn it-btn-secondary mt-4 w-full">
                    Ver requisitos <Check className="h-4 w-4" />
                </button>
            </div>
        </article>
    );
}
function SoftwareModal({ item, carreras, onClose }: { item: Software | null; carreras: string[]; onClose: () => void }) {
    if (!item) return null;
    const Icon = icons[item.categoria] ?? Code2;
    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <div className="it-modal max-w-2xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-4 border-b p-6 dark:border-slate-800">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)]">
                        <Icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                        <p className="it-eyebrow">{item.categoria}</p>
                        <h2 className="mt-1 text-2xl font-black">{item.nombre}</h2>
                        <p className="text-xs text-slate-500">{item.clave}</p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar" className="it-icon-btn">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm leading-7 text-slate-500">{item.descripcion || 'Este software forma parte del catálogo de IngeTech AI.'}</p>
                    {carreras.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {carreras.map((c) => (
                                <span
                                    key={c}
                                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border p-5">
                            <p className="font-bold">Requisitos mínimos</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-500">
                                <li>RAM: {item.min_ram_gb} GB</li>
                                <li>CPU score: {item.min_cpu_score}</li>
                                <li>GPU dedicada: {item.min_gpu_dedicada ? 'Sí' : 'No'}</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-[var(--it-primary)]/20 bg-[var(--it-primary-soft)] p-5">
                            <p className="font-bold text-[var(--it-primary)]">Recomendado</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <li>RAM: {item.rec_ram_gb} GB</li>
                                <li>CPU score: {item.rec_cpu_score}</li>
                                <li>GPU dedicada: {item.rec_gpu_dedicada ? 'Sí' : 'No'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
