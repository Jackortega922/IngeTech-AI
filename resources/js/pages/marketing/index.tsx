import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Catalogos, Kit } from '@/types/flujo';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BadgePercent, CheckCircle2, Gift, Sparkles, Tag, Zap } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Promociones', href: '/marketing' }];
const PROMO_IMAGE = '/images/home/promo1.png';

function ahorroDeKit(kit: Kit) {
    const precioSuelto = kit.accesorios.reduce((sum, a) => sum + Number(a.precio_soles), 0);
    const precioKit = Number(kit.precio_soles);
    const ahorro = Math.max(0, precioSuelto - precioKit);
    const porcentaje = precioSuelto > 0 ? Math.round((ahorro / precioSuelto) * 100) : 0;
    return { precioSuelto, precioKit, ahorro, porcentaje };
}

export default function MarketingIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    
    useEffect(() => { 
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos)
            .catch(() => setCatalogos({ carreras: [], software: [], hardware: [], actividades: [], accesorios: [], kits: [] })); 
    }, []);
    
    const kits = useMemo(() => catalogos?.kits ?? [], [catalogos]);
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promociones" />
            <main className="it-container py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2.3rem] bg-[#0c2340] p-7 text-white shadow-2xl sm:p-10 lg:p-12">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,.22),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(99,102,241,.18),transparent_30%)]" />
                    <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_430px]">
                        <div>
                            <span className="it-badge border-white/10 bg-white/10 text-sky-200">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> OFERTAS INGETECH
                            </span>
                            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
                                Más tecnología.<br />
                                <span className="text-sky-300">Más por tu presupuesto.</span>
                            </h1>
                            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                Descubre kits y oportunidades pensadas para complementar tu equipo. Ahorra al combinar accesorios y lleva tu configuración un paso más allá.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link href="/hardware" className="it-btn rounded-xl bg-sky-500 text-white hover:bg-sky-600">Ver equipos <ArrowRight className="h-4 w-4" /></Link>
                                <Link href="/software" className="it-btn rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10">Explorar software</Link>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-300">
                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Ahorro calculado</span>
                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-300" /> Catálogo actualizado</span>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/10 p-3 shadow-2xl">
                            <img src={PROMO_IMAGE} alt="Promociones IngeTech" className="aspect-[4/3] w-full rounded-[1.3rem] object-cover" style={{ objectPosition: 'left top' }} />
                            <div className="absolute bottom-6 left-6 rounded-2xl bg-[#0c2340]/90 px-4 py-3 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wider text-sky-300">Promoción destacada</p>
                                <p className="mt-1 font-black">Arma tu setup ideal.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="mt-8 grid gap-4 sm:grid-cols-3">
                    <PromoPill icon={<BadgePercent />} title="Ahorro real" text="Comparamos el precio del kit con comprar cada accesorio." />
                    <PromoPill icon={<Gift />} title="Complementa tu equipo" text="Accesorios pensados para estudio, trabajo y entretenimiento." />
                    <PromoPill icon={<Zap />} title="Listo para usar" text="Revisa el catálogo y continúa con tu recomendación." />
                </section>
                
                <section className="mt-10">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="it-eyebrow">Promociones disponibles</p>
                            <h2 className="mt-2 text-3xl font-black tracking-tight">Ofertas que sí tienen contexto.</h2>
                        </div>
                        <span className="hidden rounded-full bg-[var(--it-primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--it-primary)] sm:inline-flex">{kits.length} kits</span>
                    </div>
                    {kits.length === 0 ? (
                        <div className="it-card mt-6 max-w-2xl p-10 text-center">
                            <Tag className="mx-auto h-9 w-9 text-slate-300" />
                            <h3 className="mt-4 text-lg font-black">Aún no hay kits promocionales</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Cuando el administrador agregue kits al catálogo, aparecerán aquí automáticamente.</p>
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {kits.map((kit, index) => <PromoCard key={kit.id} kit={kit} index={index} />)}
                        </div>
                    )}
                </section>
            </main>
        </AppLayout>
    );
}

function PromoPill({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { 
    return (
        <article className="it-card p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)]">{icon}</div>
            <h3 className="mt-4 font-black">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
        </article>
    ); 
}

function PromoCard({ kit, index }: { kit: Kit; index: number }) { 
    const { precioSuelto, precioKit, ahorro, porcentaje } = ahorroDeKit(kit); 
    
    // Lista de imágenes basada en tu carpeta local
    const imagenesDisponibles = [
        '/images/home/kit.png',
        '/images/home/kit2.jpg',
        '/images/home/ki.png',
        '/images/home/kit.png'
    ];
    
    // Rota entre las imágenes disponibles usando el índice
    const imagenKit = imagenesDisponibles[index % imagenesDisponibles.length];

    return (
        <article className="group relative overflow-hidden rounded-[1.8rem] border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900">
            <div className="relative aspect-[16/8] overflow-hidden bg-slate-100 dark:bg-slate-950">
                <img src={imagenKit} alt={kit.nombre} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" style={{ objectPosition: 'center bottom' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061322]/80 to-transparent" />
                {porcentaje > 0 && <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-lg">-{porcentaje}%</span>}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 backdrop-blur"><Tag className="h-4 w-4" /></span>
                    <span className="text-xs font-bold">Kit IngeTech</span>
                </div>
            </div>
            <div className="p-5">
                <h3 className="text-lg font-black">{kit.nombre}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{kit.accesorios.map((a) => a.nombre).join(' · ')}</p>
                <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs text-slate-400">Precio del kit</p>
                        <p className="text-2xl font-black">S/ {precioKit.toLocaleString('es-PE')}</p>
                        {ahorro > 0 && <p className="text-xs font-semibold text-emerald-600">Ahorras S/ {ahorro.toLocaleString('es-PE')} · antes S/ {precioSuelto.toLocaleString('es-PE')}</p>}
                    </div>
                    <Link href="/hardware" className="it-btn it-btn-secondary rounded-xl">Ver <ArrowRight className="h-4 w-4" /></Link>
                </div>
            </div>
        </article>
    ); 
}