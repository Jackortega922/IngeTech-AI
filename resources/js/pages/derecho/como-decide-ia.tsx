import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpenText,
    Bot,
    Brain,
    CheckCircle2,
    Filter,
    Gauge,
    HeartHandshake,
    ListChecks,
    MessageSquareText,
    Scale,
    ShieldCheck,
    Target,
    XCircle,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Cómo decide la IA', href: '/como-decide-la-ia' }];

/**
 * Transparencia de la IA (Derecho + IA). Describe lo que hace el código de verdad: si cambia el
 * motor (ml-engine/recommender/scoring.py, PESO_AFINIDAD en preferencias.py) o lo que Laravel le
 * envía (RecomendacionController), hay que actualizar esta página.
 */
const USA = [
    'Tu carrera u ocupación (si la indicas)',
    'Tu nivel de experiencia con la tecnología',
    'Las actividades que harás y los programas que usarás',
    'Tu presupuesto',
    'Si respondiste el cuestionario de bienvenida: cómo la llevarás, cuántos años esperas que dure, qué valoras más y qué marcas prefieres o evitas',
];

const NO_USA = ['Tu nombre, correo o documento', 'Tu dirección o teléfono', 'Tus compras anteriores', 'Tu edad, género u otros datos sensibles'];

const PASOS = [
    {
        icon: Filter,
        titulo: 'Descarta lo que no puedes pagar',
        texto: 'Primero se quitan las laptops que cuestan más que tu presupuesto y las marcas que dijiste que quieres evitar. Es una regla fija, no IA.',
    },
    {
        icon: Brain,
        titulo: 'Reconoce tu perfil',
        texto: 'Un modelo de clasificación (regresión logística, entrenado con scikit-learn) mira tus actividades y te ubica en un perfil técnico: desarrollo de software, ciencia de datos e IA, diseño creativo o uso general. Si no marcaste actividades, este paso se omite.',
    },
    {
        icon: Target,
        titulo: 'Calcula qué necesitas',
        texto: 'Tus actividades, tus programas y tu perfil se traducen en cuánta memoria RAM, procesador y tarjeta gráfica necesitas. Si un programa pide más que tus actividades, manda el programa.',
    },
    {
        icon: Gauge,
        titulo: 'Mide la compatibilidad',
        texto: 'Compara lo que necesitas con lo que ofrece cada laptop usando similitud coseno, una medida matemática de qué tan parecidos son dos conjuntos de datos. El resultado es el porcentaje de compatibilidad técnica.',
    },
    {
        icon: HeartHandshake,
        titulo: 'Ajusta a cómo eres',
        texto: 'Si respondiste el cuestionario, el porcentaje final combina 70% compatibilidad técnica y 30% afinidad contigo (peso, batería, durabilidad, marcas). Si no lo respondiste, cuenta solo la parte técnica.',
    },
    {
        icon: ListChecks,
        titulo: 'Te explica el porqué',
        texto: 'Cada resultado muestra cuánto aportó cada factor y avisa lo que no encaja (por ejemplo, poca batería si trabajas lejos de un enchufe). No hay un porcentaje sin explicación.',
    },
];

const LIMITES = [
    'El modelo que reconoce tu perfil se entrenó con 200 perfiles de ejemplo creados para el proyecto, no con datos de clientes reales. Cuando haya suficientes recomendaciones reales, se volverá a entrenar.',
    'La parte técnica compara memoria, procesador y gráficos. Pantalla, peso y batería solo cuentan si respondiste el cuestionario.',
    'Los precios y especificaciones son los que la tienda cargó en el catálogo; si un dato está mal, la recomendación también lo estará.',
    'Es una sugerencia, no una obligación: puedes comprar cualquier laptop del catálogo sin usar la IA.',
];

export default function ComoDecideIa() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cómo decide la IA" />

            <main className="it-container max-w-5xl space-y-6 py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-7 text-white shadow-xl sm:p-9">
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.18),transparent_55%)]" />
                    <div className="relative max-w-3xl">
                        <span className="it-badge border-white/10 bg-white/10 text-sky-200">TRANSPARENCIA</span>
                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Cómo decide la IA</h1>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                            Tienes derecho a saber por qué te recomendamos una laptop. Aquí explicamos qué datos usa el sistema, cómo calcula el
                            resultado y qué no puede hacer.
                        </p>
                    </div>
                </section>

                <section className="grid gap-5 md:grid-cols-2">
                    <article className="it-card p-6">
                        <h2 className="flex items-center gap-2 text-lg font-black">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Lo que usa
                        </h2>
                        <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                            {USA.map((x) => (
                                <li key={x} className="flex gap-2">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /> {x}
                                </li>
                            ))}
                        </ul>
                    </article>
                    <article className="it-card p-6">
                        <h2 className="flex items-center gap-2 text-lg font-black">
                            <XCircle className="h-5 w-5 text-rose-500" /> Lo que no usa
                        </h2>
                        <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                            {NO_USA.map((x) => (
                                <li key={x} className="flex gap-2">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /> {x}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            El motor de recomendación recibe tu perfil sin nombre ni correo, y funciona en nuestros propios servidores.
                        </p>
                    </article>
                </section>

                <section className="it-card p-6 sm:p-7">
                    <p className="it-eyebrow">Paso a paso</p>
                    <h2 className="mt-1 text-2xl font-black">Cómo se calcula tu recomendación</h2>
                    <ol className="mt-6 grid gap-4 md:grid-cols-2">
                        {PASOS.map((p, i) => (
                            <li key={p.titulo} className="flex gap-4 rounded-2xl border p-4">
                                <div className="flex shrink-0 flex-col items-center gap-1">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--it-primary-soft)] text-[var(--it-primary)] dark:text-sky-300">
                                        <p.icon className="h-5 w-5" />
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400">0{i + 1}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold">{p.titulo}</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{p.texto}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="it-card p-6 sm:p-7">
                    <h2 className="flex items-center gap-2 text-xl font-black">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Sus límites
                    </h2>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {LIMITES.map((x) => (
                            <li key={x} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> {x}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="it-card p-6 sm:p-7">
                    <h2 className="flex items-center gap-2 text-xl font-black">
                        <MessageSquareText className="h-5 w-5 text-sky-500" /> El asistente del chat
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        El chat es distinto del motor de recomendación. Para responder, envía tu mensaje y los últimos mensajes de la conversación a{' '}
                        <b>DeepSeek</b>, un proveedor externo de inteligencia artificial con servidores fuera del Perú. Le indicamos que solo hable de
                        las laptops del catálogo, con sus precios reales. Si DeepSeek no responde, contesta un asistente más simple que funciona en
                        nuestro servidor. Por eso, <b>no escribas en el chat tu DNI, teléfono, dirección ni datos de tarjetas</b>.
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Bot className="h-4 w-4" /> Las respuestas generadas por DeepSeek llevan la marca «Respuesta generada con IA».
                    </p>
                </section>

                <section className="grid gap-5 md:grid-cols-2">
                    <article className="it-card p-6">
                        <h2 className="flex items-center gap-2 text-lg font-black">
                            <ShieldCheck className="h-5 w-5 text-sky-500" /> Tus derechos
                        </h2>
                        <ul className="mt-4 space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            <li>La IA sugiere; la decisión de compra siempre es tuya.</li>
                            <li>Cada recomendación incluye su explicación.</li>
                            <li>
                                Puedes ver, corregir o eliminar tus datos (derechos ARCO).{' '}
                                <Link href="/derecho" className="font-semibold text-sky-600 underline dark:text-sky-400">
                                    Ver cómo
                                </Link>
                            </li>
                            <li>
                                Si algo salió mal, puedes dejar constancia en el{' '}
                                <Link href="/libro-reclamaciones" className="font-semibold text-sky-600 underline dark:text-sky-400">
                                    Libro de Reclamaciones
                                </Link>
                                .
                            </li>
                        </ul>
                    </article>
                    <article className="it-card p-6">
                        <h2 className="flex items-center gap-2 text-lg font-black">
                            <Scale className="h-5 w-5 text-sky-500" /> Marco legal
                        </h2>
                        <ul className="mt-4 space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            <li>
                                <b>Ley N.° 31814</b>, que promueve el uso de la inteligencia artificial: pide que su uso sea transparente, responsable
                                y respetuoso de los derechos de las personas.
                            </li>
                            <li>
                                <b>Ley N.° 29733</b>, de Protección de Datos Personales: tus datos se usan solo con tu consentimiento y para lo que
                                aceptaste.
                            </li>
                            <li>
                                <b>Ley N.° 29571</b>, Código de Protección y Defensa del Consumidor: derecho a información veraz y suficiente antes de
                                comprar.
                            </li>
                        </ul>
                    </article>
                </section>

                <div className="flex flex-wrap gap-3">
                    <Link href="/derecho" className="it-btn it-btn-secondary">
                        Términos y garantía
                    </Link>
                    <Link href="/libro-reclamaciones" className="it-btn it-btn-secondary">
                        <BookOpenText className="h-4 w-4" /> Libro de Reclamaciones
                    </Link>
                </div>
            </main>
        </AppLayout>
    );
}
