import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Battery, Cpu, Leaf, Recycle, ShieldCheck, Truck, Wrench } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reciclaje y sostenibilidad', href: '/ing-ambiental' }];

/**
 * Aporte de Ingeniería Ambiental: educación sobre residuos electrónicos (RAEE), el programa de
 * recojo del equipo anterior al comprar y cómo la IA evita recomendar más de lo que necesitas.
 * Ver docs/contexto-proyecto.md §5.1.
 */
const TARJETAS = [
    {
        icon: Recycle,
        titulo: '¿Qué hacer con tu equipo anterior?',
        texto: 'No lo tires a la basura común: una laptop contiene metales pesados (plomo, mercurio) que contaminan el suelo y el agua si se desechan mal. Llévalo a un punto de acopio de residuos electrónicos (RAEE) — muchas tiendas de tecnología los reciben aunque no sean de su marca.',
    },
    {
        icon: Wrench,
        titulo: 'Alarga la vida útil antes de reciclar',
        texto: 'Antes de desechar un equipo, evalúa si una mejora simple (más RAM, cambiar el disco a SSD) le da 1-2 años más de vida. Personalizar en vez de reemplazar es la forma más efectiva de reducir residuo electrónico.',
    },
    {
        icon: Battery,
        titulo: 'Baterías: el residuo más peligroso',
        texto: 'Las baterías de litio no deben mezclarse con la basura común: pueden generar incendios y contienen materiales tóxicos. Se depositan por separado en puntos de acopio especializados.',
    },
    {
        icon: ShieldCheck,
        titulo: 'Borra tus datos antes de entregar el equipo',
        texto: 'Antes de reciclar o donar un equipo, haz un borrado seguro de tu información (no basta con formatear). Muchos puntos de acopio también ofrecen este servicio.',
    },
];

export default function IngAmbientalIndex({
    raee,
    ampliables,
}: {
    raee: { solicitados: number; recogidos: number };
    ampliables: { ram: number; total: number };
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reciclaje y sostenibilidad" />
            <main className="it-container max-w-5xl space-y-6 py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-7 text-white shadow-xl sm:p-9">
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(52,211,153,.18),transparent_55%)]" />
                    <div className="relative max-w-3xl">
                        <span className="it-badge border-white/10 bg-white/10 text-emerald-200">SOSTENIBILIDAD</span>
                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Reciclaje y sostenibilidad</h1>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                            Comprar una laptop nueva es también una oportunidad para desechar bien la anterior y elegir solo lo que necesitas.
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <Cifra icon={Truck} valor={raee.solicitados} texto="equipos anteriores que los clientes pidieron entregar para reciclaje" />
                    <Cifra icon={Recycle} valor={raee.recogidos} texto="ya recogidos al entregar la laptop nueva" />
                    <Cifra
                        icon={Wrench}
                        valor={`${ampliables.ram} de ${ampliables.total}`}
                        texto="laptops del catálogo permiten ampliar la RAM más adelante"
                    />
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <article className="it-card p-6">
                        <h2 className="flex items-center gap-2 text-lg font-black">
                            <Truck className="h-5 w-5 text-emerald-500" /> Entréganos tu equipo anterior
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            Al comprar, marca «Recojan mi equipo anterior para reciclarlo». Cuando te entreguemos la laptop nueva nos llevamos la
                            antigua sin costo y la enviamos a un gestor autorizado de residuos de aparatos eléctricos y electrónicos (RAEE), como pide
                            el reglamento peruano de RAEE (D.S. N.° 009-2019-MINAM).
                        </p>
                    </article>
                    <article className="it-card p-6">
                        <h2 className="flex items-center gap-2 text-lg font-black">
                            <Cpu className="h-5 w-5 text-emerald-500" /> La IA no te vende de más
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            Si una laptop trae tarjeta gráfica dedicada y tus actividades no la necesitan, la recomendación te lo advierte: gasta más
                            energía, agota antes la batería y suma componentes que luego son residuo. Y si eliges una con RAM ampliable, podrás
                            mejorarla en vez de reemplazarla.{' '}
                            <Link href="/como-decide-la-ia" className="font-semibold text-sky-600 underline dark:text-sky-400">
                                Cómo decide la IA
                            </Link>
                        </p>
                    </article>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                    {TARJETAS.map((t) => (
                        <article key={t.titulo} className="it-card p-5">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <t.icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold">{t.titulo}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.texto}</p>
                        </article>
                    ))}
                </div>

                <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Leaf className="h-4 w-4 text-emerald-500" /> Las cifras salen de los pedidos y del catálogo de la tienda, en tiempo real.
                </p>
            </main>
        </AppLayout>
    );
}

function Cifra({ icon: Icon, valor, texto }: { icon: typeof Leaf; valor: number | string; texto: string }) {
    return (
        <div className="it-card p-5">
            <Icon className="h-5 w-5 text-emerald-500" />
            <p className="mt-3 text-3xl font-black">{valor}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{texto}</p>
        </div>
    );
}
