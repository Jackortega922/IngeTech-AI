import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BookOpenText, Brain, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Términos y Garantía', href: '/derecho' }];

/**
 * Aporte de Derecho: términos de uso, garantía y política de devoluciones
 * de una tienda de tecnología. Ver docs/contexto-proyecto.md §5.1.
 */
const SECCIONES = [
    {
        titulo: 'Términos de uso',
        texto: 'IngeTech AI es una tienda de laptops con un asesor de compra con inteligencia artificial: recomienda equipos según tus actividades, tus programas y tu presupuesto, y explica por qué. La recomendación es una sugerencia; la decisión de compra es tuya. Los precios y la disponibilidad son referenciales y pueden variar.',
    },
    {
        // Garantía y devoluciones también están en las reglas del chat (GeminiAsistente): si cambian
        // aquí, actualizarlas allá para que la IA no diga otra cosa.
        titulo: 'Garantía de los equipos',
        texto: 'Todo equipo recomendado mantiene la garantía de fábrica del fabricante (típicamente 12 meses contra defectos de fabricación). La garantía cubre fallas de hardware bajo uso normal; no cubre daños por mal uso, líquidos, o modificaciones no autorizadas.',
    },
    {
        titulo: 'Política de devoluciones',
        texto: 'Puedes solicitar el cambio o devolución de un equipo dentro de los 7 días calendario posteriores a la compra, siempre que esté en las mismas condiciones en que se entregó (empaque original, sin señales de uso). Pasado ese plazo, aplica solo la garantía de fábrica.',
    },
    {
        titulo: 'Protección de tus datos personales (Ley N.° 29733)',
        texto: 'Para recomendarte un equipo usamos los datos de tu perfil: carrera, nivel de experiencia, actividades, presupuesto y preferencia de portabilidad. Solo los tratamos si lo aceptas expresamente antes de enviar el formulario, y registramos la fecha en que lo hiciste. Los usamos para generar tu recomendación, mostrarte tu historial y calcular estadísticas anónimas de uso del sistema. No los vendemos ni los cedemos a terceros; se almacenan en los servidores de nuestros proveedores de alojamiento.',
    },
    {
        titulo: 'Reclamos y quejas',
        texto: 'Si no estás conforme con un producto o con la atención, puedes presentar una hoja en el Libro de Reclamaciones virtual, con o sin cuenta. La tienda debe responderte en un plazo máximo de 15 días hábiles. Presentar un reclamo no te impide acudir a otras vías ni denunciar ante el INDECOPI.',
    },
    {
        // Describe lo que el sistema hace de verdad: al eliminar la cuenta, perfiles_usuario.user_id
        // pasa a NULL (nullOnDelete) — el perfil se conserva, pero ya sin nada que identifique a la persona.
        titulo: 'Tus derechos: acceso, rectificación, cancelación y oposición (ARCO)',
        texto: 'Puedes ver en cualquier momento las recomendaciones generadas con tus datos en «Mis recomendaciones», y corregir tu nombre o correo desde Ajustes → Perfil. Si eliminas tu cuenta (Ajustes → Perfil), tus perfiles dejan de estar vinculados a ti y se conservan solo como datos estadísticos anónimos, sin nombre ni correo. Si no aceptas el tratamiento de tus datos, puedes seguir consultando el catálogo y las promociones, pero no generar una recomendación.',
    },
];

export default function DerechoIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Términos y Garantía" />
            <main className="it-container max-w-5xl space-y-6 py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-7 text-white shadow-xl sm:p-9">
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.18),transparent_55%)]" />
                    <div className="relative max-w-3xl">
                        <span className="it-badge border-white/10 bg-white/10 text-sky-200">TUS DERECHOS</span>
                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Términos, garantía y devoluciones</h1>
                        <p className="mt-3 text-sm leading-7 text-slate-300">Lo que necesitas saber antes de comprar una laptop en IngeTech AI.</p>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Link href="/como-decide-la-ia" className="it-card it-card-hover flex gap-4 p-5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)] dark:text-sky-300">
                            <Brain className="h-6 w-6" />
                        </span>
                        <span>
                            <b className="block">Cómo decide la IA</b>
                            <span className="mt-1 block text-sm text-slate-500">Qué datos usa, cómo calcula tu recomendación y sus límites.</span>
                        </span>
                    </Link>
                    <Link href="/libro-reclamaciones" className="it-card it-card-hover flex gap-4 p-5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)] dark:text-sky-300">
                            <BookOpenText className="h-6 w-6" />
                        </span>
                        <span>
                            <b className="block">Libro de Reclamaciones</b>
                            <span className="mt-1 block text-sm text-slate-500">Presenta un reclamo o una queja, o consulta la respuesta.</span>
                        </span>
                    </Link>
                </div>

                <div className="space-y-3">
                    {SECCIONES.map((s) => (
                        <details key={s.titulo} className="group it-card p-5">
                            <summary className="cursor-pointer list-none font-bold marker:content-none">
                                <span className="flex items-center justify-between gap-3">
                                    {s.titulo}
                                    <Plus className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-45" />
                                </span>
                            </summary>
                            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{s.texto}</p>
                        </details>
                    ))}
                </div>
            </main>
        </AppLayout>
    );
}
