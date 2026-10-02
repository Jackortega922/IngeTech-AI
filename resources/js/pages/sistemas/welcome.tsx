import ChatWidget from '@/components/chat-widget';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Cpu,
    Gamepad2,
    Laptop,
    MessageCircle,
    ShieldCheck,
    Sparkles,
    WandSparkles,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Slide = {
    eyebrow: string;
    title: string;
    text: string;
    image: string; // imagen de fondo del slide
    cardImage?: string; // imagen opcional para la card flotante (si no se define, usa `image`)
    position: string;
    cta: string;
    href: string;
    accent: string;
    tag: string;
};

const SLIDES: Slide[] = [
    {
        eyebrow: 'PC & LAPTOPS',
        title: 'Equipos que impulsan tus ideas.',
        text: 'Encuentra una configuración para estudiar, programar, diseñar, trabajar o jugar, con una experiencia pensada para comparar sin complicaciones.',
        image: '/images/home/fondo.png',
        position: 'left top',
        cta: 'Ver equipos',
        href: '/hardware',
        accent: 'from-sky-500/30 via-[#061322] to-[#061322]',
        tag: 'Rendimiento + diseño',
    },
    {
        eyebrow: 'LÍNEA LAPTOPS',
        title: 'Rendimiento en cada lugar.',
        text: 'Explora equipos portátiles y descubre qué RAM, CPU, GPU y almacenamiento encajan con tus actividades y software.',
        image: '/images/home/victus.png',
        position: '50% 12%',
        cta: 'Explorar laptops',
        href: '/hardware',
        accent: 'from-cyan-400/20 via-[#eef8ff] to-white',
        tag: 'Portabilidad + potencia',
    },
    {
        eyebrow: 'PC GAMER',
        title: 'Juega sin límites.',
        text: 'Compara rendimiento, gráficos y memoria para encontrar una configuración que esté a la altura de tus juegos y proyectos exigentes.',
        image: '/images/home/laptop.png',
        position: 'right bottom',
        cta: 'Ver PCs gamer',
        href: '/hardware',
        accent: 'from-violet-500/35 via-[#09051c] to-[#061322]',
        tag: 'GPU + alto rendimiento',
    },
];

const benefits = [
    {
        icon: WandSparkles,
        title: 'Recomendación inteligente',
        text: 'El flujo cruza actividades, software, presupuesto y características técnicas para ayudarte a encontrar opciones compatibles.',
    },
    {
        icon: Cpu,
        title: 'Catálogo administrable',
        text: 'Los equipos y programas que gestione el administrador alimentan el catálogo que consulta el usuario.',
    },
    {
        icon: ShieldCheck,
        title: 'Compara antes de decidir',
        text: 'Revisa imágenes, especificaciones, precios y alternativas antes de personalizar tu configuración.',
    },
];

function HeroCarousel() {
    const [index, setIndex] = useState(0);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    const reset = (next: number) => {
        setIndex(next);
        if (timer.current) clearInterval(timer.current);
        timer.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    };

    useEffect(() => {
        reset(0);
        return () => {
            if (timer.current) clearInterval(timer.current);
        };
    }, []);

    const slide = SLIDES[index];
    const lightSlide = index === 1;
    const cardImage = slide.cardImage ?? slide.image;

    return (
        <section
            className={`relative overflow-hidden rounded-[2.6rem] border shadow-[0_35px_100px_rgba(2,12,27,.25)] ${lightSlide ? 'border-sky-100 bg-white' : 'border-white/10 bg-[#061322]'} min-h-[620px]`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent}`} />
            <div className="it-home-grid absolute inset-0 opacity-70" />
            <div
                className={`absolute inset-0 ${lightSlide ? 'bg-gradient-to-r from-white via-white/85 to-white/30' : 'bg-gradient-to-r from-[#030c18]/95 via-[#061322]/80 to-[#061322]/25'}`}
            />

            {/* Imagen de fondo del slide activo */}
            <img
                src={slide.image}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${lightSlide ? 'opacity-25 mix-blend-multiply' : 'opacity-30 mix-blend-screen'}`}
                style={{ objectPosition: slide.position }}
            />

            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />

            <div className="relative grid min-h-[620px] lg:grid-cols-[1.03fr_.97fr]">
                <div className={`flex flex-col justify-center p-7 sm:p-12 lg:p-16 ${lightSlide ? 'text-[#0c2340]' : 'text-white'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`it-badge w-fit ${lightSlide ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-white/10 bg-white/10 text-sky-200'}`}
                        >
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {slide.eyebrow}
                        </span>
                        <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-bold ${lightSlide ? 'border-slate-200 bg-white/80 text-slate-500' : 'border-white/10 bg-white/5 text-slate-400'}`}
                        >
                            {slide.tag}
                        </span>
                    </div>

                    <h1 className="mt-6 max-w-3xl text-5xl leading-[.95] font-black tracking-[-.045em] sm:text-6xl lg:text-[4.7rem]">
                        {slide.title}
                    </h1>

                    <p className={`mt-6 max-w-xl text-base leading-8 sm:text-lg ${lightSlide ? 'text-slate-600' : 'text-slate-300'}`}>{slide.text}</p>

                    <div className="mt-9 flex flex-wrap gap-3">
                        <Link
                            href={slide.href}
                            className="it-btn h-12 rounded-2xl bg-sky-500 px-6 text-white shadow-xl shadow-sky-500/20 hover:-translate-y-0.5 hover:bg-sky-600"
                        >
                            {slide.cta}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/register"
                            className={`it-btn h-12 rounded-2xl border px-6 ${lightSlide ? 'border-slate-200 bg-white/80 text-[#0c2340] hover:bg-white' : 'border-white/15 bg-white/5 text-white hover:bg-white/10'}`}
                        >
                            Crear mi recomendación
                        </Link>
                    </div>

                    <div className={`mt-8 grid max-w-xl grid-cols-3 gap-3 text-xs ${lightSlide ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Catálogo vivo
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-sky-400" /> Comparador
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-violet-400" /> IA guiada
                        </span>
                    </div>
                </div>

                <div className="relative hidden items-center justify-center p-10 lg:flex">
                    <div className="absolute top-16 right-14 h-72 w-72 rounded-full border border-sky-300/15 bg-sky-300/5 blur-[1px]" />

                    <div
                        className={`relative w-full max-w-[470px] overflow-hidden rounded-[2rem] border p-3 shadow-2xl backdrop-blur-xl ${lightSlide ? 'border-white/80 bg-white/70' : 'border-white/15 bg-white/[.07]'}`}
                    >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-slate-100">
                            {/* Imagen de la card flotante (sincronizada con el slide) */}
                            <img
                                src={cardImage}
                                alt="Catálogo IngeTech AI"
                                className="h-full w-full object-cover transition duration-700"
                                style={{ objectPosition: slide.position }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#061322]/80 via-transparent to-transparent" />
                            <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between text-white">
                                <div>
                                    <p className="text-[10px] font-black tracking-[.2em] text-sky-200 uppercase">IngeTech AI</p>
                                    <p className="mt-1 text-xl font-black">Tecnología que encaja contigo.</p>
                                </div>
                                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 backdrop-blur">
                                    <Zap className="h-5 w-5 text-amber-300" />
                                </div>
                            </div>
                        </div>
                        <div
                            className={`mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold ${lightSlide ? 'text-slate-600' : 'text-slate-300'}`}
                        >
                            <span className="rounded-xl bg-black/5 px-3 py-2">CPU</span>
                            <span className="rounded-xl bg-black/5 px-3 py-2">RAM</span>
                            <span className="rounded-xl bg-black/5 px-3 py-2">GPU</span>
                        </div>
                    </div>

                    <div className="absolute bottom-12 left-2 rounded-2xl border border-white/10 bg-[#0b2442]/95 px-4 py-3 text-white shadow-xl backdrop-blur-xl">
                        <p className="text-[10px] font-bold text-sky-200">COMPATIBILIDAD</p>
                        <div className="mt-1 flex items-end gap-1">
                            <b className="text-3xl">94</b>
                            <span className="mb-1 text-xs text-slate-400">%</span>
                        </div>
                    </div>
                    <div className="absolute top-24 right-0 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-white shadow-xl backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-sky-300" />
                            <span className="font-bold">Recomendación lista</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                aria-label="Anterior"
                onClick={() => reset((index - 1 + SLIDES.length) % SLIDES.length)}
                className={`absolute top-1/2 left-4 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border shadow-lg backdrop-blur transition hover:scale-105 ${lightSlide ? 'border-slate-200 bg-white/90 text-[#0c2340]' : 'border-white/10 bg-black/30 text-white'}`}
            >
                <ChevronLeft />
            </button>
            <button
                aria-label="Siguiente"
                onClick={() => reset((index + 1) % SLIDES.length)}
                className={`absolute top-1/2 right-4 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border shadow-lg backdrop-blur transition hover:scale-105 ${lightSlide ? 'border-slate-200 bg-white/90 text-[#0c2340]' : 'border-white/10 bg-black/30 text-white'}`}
            >
                <ChevronRight />
            </button>

            <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-xl">
                {SLIDES.map((item, i) => (
                    <button
                        key={item.title}
                        aria-label={`Slide ${i + 1}`}
                        onClick={() => reset(i)}
                        className={`h-1.5 rounded-full transition-all ${i === index ? 'w-10 bg-sky-300' : 'w-2 bg-white/40'}`}
                    />
                ))}
            </div>
        </section>
    );
}

export default function Welcome() {
    const [assistant, setAssistant] = useState(false);

    return (
        <>
            <Head title="IngeTech AI — Inicio" />
            <main className="min-h-screen overflow-hidden bg-[#061322] text-white">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
                    <Link href="/" className="flex items-center gap-3 text-xl font-black">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#0c2340] shadow-lg">IT</span>
                        <span className="text-sky-300"> IngeTech</span> AI
                    </Link>
                    <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
                        <a href="#categorias" className="transition hover:text-white">
                            Categorías
                        </a>
                        <a href="#como-funciona" className="transition hover:text-white">
                            Cómo funciona
                        </a>
                        <a href="#beneficios" className="transition hover:text-white">
                            Beneficios
                        </a>
                        <button onClick={() => setAssistant(true)} className="flex items-center gap-2 transition hover:text-white">
                            <MessageCircle className="h-4 w-4" /> Asistente
                        </button>
                        <Link href="/login" className="rounded-xl border border-white/15 px-5 py-2.5 font-semibold transition hover:bg-white/10">
                            Ingresar
                        </Link>
                    </div>
                    <Link href="/register" className="rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#0c2340] md:hidden">
                        Crear cuenta
                    </Link>
                </nav>

                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-5 lg:px-10 lg:py-8">
                    <HeroCarousel />
                </div>

                <section id="categorias" className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <p className="text-xs font-black tracking-[.2em] text-sky-300 uppercase">Explora por necesidad</p>
                            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Una portada con más vida y más producto.</h2>
                        </div>
                        <Link href="/hardware" className="it-btn w-fit rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10">
                            Ver catálogo completo <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="mt-7 grid gap-4 md:grid-cols-3">
                        <CategoryCard
                            icon={<Laptop />}
                            title="Laptops"
                            text="Portabilidad, batería y potencia para estudiar y trabajar."
                            tone="cyan"
                        />
                        <CategoryCard
                            icon={<Gamepad2 />}
                            title="PC Gamer"
                            text="Gráficos y rendimiento para juegos y creación de contenido."
                            tone="violet"
                        />
                        <CategoryCard
                            icon={<Cpu />}
                            title="Trabajo y estudio"
                            text="Equipos equilibrados para oficina, programación y proyectos."
                            tone="blue"
                        />
                    </div>
                </section>

                <section id="como-funciona" className="border-y border-white/10 bg-white/[.03]">
                    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
                        <p className="text-xs font-black tracking-[.2em] text-sky-300 uppercase">Cómo funciona</p>
                        <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                            De tu necesidad a una configuración concreta.
                        </h2>
                        <div className="mt-9 grid gap-4 md:grid-cols-3">
                            {['Perfil', 'Recomendación', 'Personalización'].map((title, i) => (
                                <article
                                    key={title}
                                    className="group rounded-[1.7rem] border border-white/10 bg-white/[.04] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white/[.07]"
                                >
                                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-400/10 font-black text-sky-300">
                                        0{i + 1}
                                    </span>
                                    <h3 className="mt-6 text-xl font-bold">{title}</h3>
                                    <p className="mt-2 text-sm leading-7 text-slate-400">
                                        {
                                            [
                                                'Selecciona actividades, software, presupuesto y portabilidad.',
                                                'Recibe equipos compatibles y compara sus características.',
                                                'Ajusta memoria, almacenamiento y accesorios según tu caso.',
                                            ][i]
                                        }
                                    </p>
                                    <ArrowRight className="mt-6 h-5 w-5 text-sky-300 opacity-0 transition group-hover:opacity-100" />
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="beneficios" className="bg-white text-[#0c2340]">
                    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                            <div>
                                <p className="text-xs font-black tracking-[.2em] text-sky-700 uppercase">Diseñado para crecer</p>
                                <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                                    Una experiencia tecnológica que se siente como producto real.
                                </h2>
                            </div>
                            <Link href="/register" className="it-btn it-btn-primary w-fit rounded-2xl">
                                Empezar ahora <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="mt-10 grid gap-5 md:grid-cols-3">
                            {benefits.map(({ icon: Icon, title, text }) => (
                                <article
                                    key={title}
                                    className="rounded-[1.7rem] border border-slate-200 bg-slate-50/70 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0c2340] text-sky-300">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-6 text-xl font-black">{title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t border-slate-200 bg-slate-50 text-[#0c2340]">
                    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
                        <div>
                            <p className="text-lg font-black">¿No sabes qué equipo necesitas?</p>
                            <p className="mt-1 text-sm text-slate-500">Déjale el análisis al flujo de IngeTech AI y empieza con tus actividades.</p>
                        </div>
                        <button onClick={() => setAssistant(true)} className="it-btn it-btn-primary rounded-2xl">
                            <MessageCircle className="h-4 w-4" /> Hablar con el asistente
                        </button>
                    </div>
                </section>

                <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-slate-500">
                    IngeTech AI · Recomendación inteligente de equipos tecnológicos · UNHEVAL
                </footer>
            </main>

            {assistant && <ChatWidget forzarAbierto onCerrado={() => setAssistant(false)} />}
        </>
    );
}

function CategoryCard({ icon, title, text, tone }: { icon: ReactNode; title: string; text: string; tone: 'cyan' | 'violet' | 'blue' }) {
    const styles = {
        cyan: 'from-cyan-500/20 to-sky-500/5 text-cyan-300',
        violet: 'from-violet-500/20 to-fuchsia-500/5 text-violet-300',
        blue: 'from-blue-500/20 to-sky-500/5 text-sky-300',
    }[tone];

    return (
        <Link
            href="/hardware"
            className={`group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${styles} p-6 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl`}
        >
            <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/10">{icon}</div>
            <h3 className="relative mt-5 text-xl font-black text-white">{title}</h3>
            <p className="relative mt-2 text-sm leading-6 text-slate-400">{text}</p>
            <span className="relative mt-5 inline-flex items-center gap-2 text-xs font-black text-white">
                Explorar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
        </Link>
    );
}
