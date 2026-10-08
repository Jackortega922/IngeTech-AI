import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Slide = {
    eyebrow: string;
    title: string;
    text: string;
    image: string; // imagen de fondo del slide
    cardImage?: string; // imagen opcional para la card flotante (si no se define, usa `image`)
    position: string;
    cta: string;
    accion: 'ver_laptops' | 'gamer';
    tag: string;
};

const SLIDES: Slide[] = [
    {
        eyebrow: 'LAPTOPS',
        title: 'Equipos que impulsan tus ideas.',
        text: 'Encuentra una configuración para estudiar, programar, diseñar, trabajar o jugar, con una experiencia pensada para comparar sin complicaciones.',
        image: '/images/home/fondo.webp',
        position: 'left top',
        cta: 'Ver equipos',
        accion: 'ver_laptops',
        tag: 'Rendimiento + diseño',
    },
    {
        eyebrow: 'LÍNEA LAPTOPS',
        title: 'Rendimiento en cada lugar.',
        text: 'Explora equipos portátiles y descubre qué RAM, CPU, GPU y almacenamiento encajan con tus actividades y software.',
        image: '/images/home/victus.webp',
        position: '50% 12%',
        cta: 'Explorar laptops',
        accion: 'ver_laptops',
        tag: 'Portabilidad + potencia',
    },
    {
        eyebrow: 'LAPTOPS GAMER',
        title: 'Juega sin límites.',
        text: 'Compara rendimiento, gráficos y memoria para encontrar una configuración que esté a la altura de tus juegos y proyectos exigentes.',
        image: '/images/home/laptop.webp',
        position: 'right bottom',
        cta: 'Ver laptops gamer',
        accion: 'gamer',
        tag: 'GPU + alto rendimiento',
    },
];

// Carrusel de bienvenida (diseño de Marco). Los botones no cambian de página: bajan a la vitrina
// o la filtran, para que el cliente siga en la tienda. Todas las diapositivas tienen la misma
// altura fija y los mismos colores: solo cambian el texto y las imágenes.
export default function HeroCarousel({ onVerLaptops, onGamer, iaHref }: { onVerLaptops: () => void; onGamer: () => void; iaHref: string }) {
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
    const cardImage = slide.cardImage ?? slide.image;

    return (
        <section className="relative h-[640px] overflow-hidden rounded-[2.6rem] border border-white/10 bg-[#061322] shadow-[0_35px_100px_rgba(2,12,27,.25)] sm:h-[600px] lg:h-full lg:min-h-[460px]">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 via-[#061322] to-[#061322]" />
            <div className="it-home-grid absolute inset-0 opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030c18]/95 via-[#061322]/80 to-[#061322]/25" />

            {/* Imagen de fondo del slide activo */}
            <img
                src={slide.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen transition duration-700"
                style={{ objectPosition: slide.position }}
            />

            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />

            <div className="relative grid h-full lg:grid-cols-[1.03fr_.97fr]">
                <div className="flex flex-col justify-center p-7 text-white sm:p-12 lg:px-16 lg:py-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="it-badge w-fit border-white/10 bg-white/10 text-sky-200">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {slide.eyebrow}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-400">
                            {slide.tag}
                        </span>
                    </div>

                    <h1 className="mt-6 line-clamp-3 max-w-3xl text-4xl leading-[.95] font-black tracking-[-.045em] sm:text-5xl lg:text-[clamp(2.6rem,7svh,4.2rem)]">
                        {slide.title}
                    </h1>

                    <p className="mt-6 line-clamp-3 max-w-xl text-base leading-8 text-slate-300 sm:text-lg lg:mt-[clamp(.75rem,2.5svh,1.5rem)] lg:leading-7">
                        {slide.text}
                    </p>

                    <div className="mt-9 flex flex-wrap gap-3 lg:mt-[clamp(1rem,3svh,2.25rem)]">
                        <button
                            type="button"
                            onClick={slide.accion === 'gamer' ? onGamer : onVerLaptops}
                            className="it-btn h-12 rounded-2xl bg-sky-500 px-6 text-white shadow-xl shadow-sky-500/20 hover:-translate-y-0.5 hover:bg-sky-600"
                        >
                            {slide.cta}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <Link href={iaHref} className="it-btn h-12 rounded-2xl border border-white/15 bg-white/5 px-6 text-white hover:bg-white/10">
                            Crear mi recomendación
                        </Link>
                    </div>

                    <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-xs text-slate-400 lg:mt-[clamp(.75rem,2.5svh,2rem)]">
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

                    <div className="relative w-full max-w-[clamp(320px,calc(100svh-30rem),470px)] overflow-hidden rounded-[2rem] border border-white/15 bg-white/[.07] p-3 shadow-2xl backdrop-blur-xl">
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
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-300">
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
                className="absolute top-1/2 left-4 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/30 text-white shadow-lg backdrop-blur transition hover:scale-105"
            >
                <ChevronLeft />
            </button>
            <button
                aria-label="Siguiente"
                onClick={() => reset((index + 1) % SLIDES.length)}
                className="absolute top-1/2 right-4 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/30 text-white shadow-lg backdrop-blur transition hover:scale-105"
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
