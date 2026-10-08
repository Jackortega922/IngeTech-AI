import ChatWidget from '@/components/chat-widget';
import LaptopImage from '@/components/laptop-image';
import HeroCarousel from '@/components/tienda/hero-carousel';
import StoreFooter from '@/components/tienda/store-footer';
import WhatsappButton, { enlaceWhatsapp, WhatsappIcon } from '@/components/tienda/whatsapp-button';
import { useInitials } from '@/hooks/use-initials';
import { usoDe, type Uso } from '@/lib/filtros-vitrina';
import { flujoStorage } from '@/lib/flujo-storage';
import { disponibilidad } from '@/lib/inventario';
import { type SharedData } from '@/types';
import type { Laptop } from '@/types/flujo';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Briefcase,
    Check,
    Cpu,
    Gamepad2,
    HardDrive,
    PackageSearch,
    Scale,
    Search,
    ShoppingCart,
    Sparkles,
    Truck,
    User,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

// Categorías por uso (usoDe en lib/filtros-vitrina): se derivan de las specs, así cada laptop
// nueva que se cargue en el admin cae sola en su categoría.
const USOS: { value: Uso; titulo: string; texto: string; icon: typeof BookOpen }[] = [
    { value: 'estudio', titulo: 'Estudio y oficina', texto: 'Clases virtuales, documentos y navegación.', icon: BookOpen },
    { value: 'productividad', titulo: 'Productividad y programación', texto: 'Multitarea, código y apps pesadas.', icon: Briefcase },
    { value: 'creativo', titulo: 'Diseño, ingeniería y gaming', texto: 'Con tarjeta gráfica dedicada.', icon: Gamepad2 },
];

const soles = (n: number | string) => `S/ ${Number(n).toLocaleString('es-PE')}`;

// Cuántas laptops se muestran en la portada; el resto está en el catálogo completo (/hardware).
const DESTACADAS = 8;

type Vista = 'pedidas' | 'novedades';

export default function Welcome({ laptops, pedidas }: { laptops: Laptop[]; pedidas: Record<number, number> }) {
    const { auth, contacto } = usePage<SharedData>().props;
    const [busqueda, setBusqueda] = useState('');
    const [comparar, setComparar] = useState<number[]>([]);

    // "Más pedidas" solo tiene sentido cuando ya hay pedidos; mientras tanto, novedades.
    const hayPedidos = Object.keys(pedidas).length > 0;
    const [vista, setVista] = useState<Vista>(hayPedidos ? 'pedidas' : 'novedades');

    const destacadas = useMemo(() => {
        // Novedades: las últimas cargadas en el admin (id más alto = más reciente).
        const novedades = [...laptops].sort((a, b) => b.id - a.id);
        if (vista === 'novedades') return novedades.slice(0, DESTACADAS);
        return novedades
            .filter((l) => (pedidas[l.id] ?? 0) > 0)
            .sort((a, b) => pedidas[b.id] - pedidas[a.id])
            .slice(0, DESTACADAS);
    }, [laptops, pedidas, vista]);

    useEffect(() => {
        setComparar(flujoStorage.leerComparar());
    }, []);

    function irAProductos() {
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    }

    // El buscador, las categorías por uso y el carrusel llevan al catálogo completo ya filtrado.
    function buscar() {
        const q = busqueda.trim();
        router.visit(q ? `/hardware?q=${encodeURIComponent(q)}` : '/hardware');
    }

    function filtrarUso(u: Uso) {
        router.visit(`/hardware?uso=${u}`);
    }

    function toggleComparar(id: number) {
        setComparar((prev) => {
            const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id];
            flujoStorage.guardarComparar(next);
            return next;
        });
    }

    // Comprar no pide cuenta: se elige la configuración en /personalizar y se paga en /checkout.
    function personalizar(l: Laptop) {
        flujoStorage.guardarSeleccionada({ laptop_id: l.id, laptop: l, badges: [], compatibilidad_pct: 0, recomendacion_id: 0 });
        router.visit('/personalizar');
    }

    const getInitials = useInitials();
    const barraRef = useRef<HTMLDivElement>(null);
    const cabeceraRef = useRef<HTMLElement>(null);
    const [altoCabecera, setAltoCabecera] = useState(110);

    // Alto real de la barra superior + cabecera (cambia con el ancho de la pantalla).
    useLayoutEffect(() => {
        const medir = () => setAltoCabecera((barraRef.current?.offsetHeight ?? 0) + (cabeceraRef.current?.offsetHeight ?? 0));
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);
    const cuentaHref = auth.user ? (auth.user.es_personal ? '/admin' : '/dashboard') : '/login';
    const iaHref = auth.user ? '/perfil' : '/register';

    return (
        <>
            <Head title="Laptops con recomendación inteligente" />

            <div className="min-h-screen bg-[#07111f] text-white">
                {/* Barra superior */}
                <div ref={barraRef} className="bg-cyan-400 text-[#07111f]">
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-2 text-xs font-semibold sm:justify-between lg:px-10">
                        <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" /> Envíos a todo el Perú
                        </span>
                        <span className="hidden sm:inline">{contacto.horario ?? 'Asesoría gratuita para elegir tu laptop'}</span>
                        <Link href="/seguimiento" className="flex items-center gap-1.5 hover:underline">
                            <PackageSearch className="h-3.5 w-3.5" /> Sigue tu pedido
                        </Link>
                        {contacto.whatsapp && (
                            <a
                                href={enlaceWhatsapp(contacto.whatsapp, 'Hola, quiero información sobre sus laptops.')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 hover:underline"
                            >
                                <WhatsappIcon className="h-3.5 w-3.5" /> +{contacto.whatsapp}
                            </a>
                        )}
                    </div>
                </div>

                {/* Encabezado */}
                <header ref={cabeceraRef} className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 lg:px-10">
                        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-lg text-[#07111f]">✦</span>
                            <span className="hidden sm:inline">
                                Inge<span className="text-cyan-400">Tech</span> AI
                            </span>
                        </Link>

                        <label className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && buscar()}
                                placeholder="¿Qué laptop estás buscando?"
                                className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-2.5 pr-3 pl-9 text-sm placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                            />
                        </label>

                        <nav className="flex shrink-0 items-center gap-2 text-sm">
                            <Link
                                href="/comparador"
                                className="relative hidden rounded-lg p-2.5 text-slate-300 hover:text-cyan-400 md:block"
                                title="Comparador"
                            >
                                <Scale className="h-5 w-5" />
                                {comparar.length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-cyan-400 text-[10px] font-bold text-[#07111f]">
                                        {comparar.length}
                                    </span>
                                )}
                            </Link>
                            <Link
                                href={cuentaHref}
                                title={auth.user ? `Sesión iniciada: ${auth.user.name}` : undefined}
                                className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-slate-200 hover:border-cyan-400"
                            >
                                {auth.user ? (
                                    // Con sesión: iniciales y nombre de quien entró, para que se vea a simple vista.
                                    <>
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-400 text-xs font-bold text-[#07111f]">
                                            {getInitials(auth.user.name)}
                                        </span>
                                        <span className="hidden max-w-[10rem] truncate sm:inline">{auth.user.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <User className="h-4 w-4" />
                                        <span className="hidden sm:inline">Ingresar</span>
                                    </>
                                )}
                            </Link>
                            <Link
                                href={iaHref}
                                className="hidden items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 font-bold text-[#07111f] hover:bg-cyan-300 lg:flex"
                            >
                                <Sparkles className="h-4 w-4" /> Recomiéndame con IA
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Primera vista: en escritorio, carrusel + categorías por uso ocupan EXACTAMENTE lo que
                    queda de la pantalla bajo la cabecera (el carrusel se estira o encoge); el resto de
                    la tienda aparece bajando. La altura de la cabecera se mide en el navegador. */}
                <div
                    className="lg:flex lg:h-[calc(100svh-var(--alto-cabecera,110px))] lg:flex-col"
                    style={{ '--alto-cabecera': `${altoCabecera}px` } as CSSProperties}
                >
                    {/* Carrusel de bienvenida (diseño de Marco) */}
                    <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:min-h-0 lg:flex-1 lg:px-10 lg:pt-5">
                        <HeroCarousel onVerLaptops={irAProductos} onGamer={() => filtrarUso('creativo')} iaHref={iaHref} />
                    </div>

                    {/* Categorías por uso: abren el catálogo completo filtrado por ese uso */}
                    <section className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-10 lg:pt-5 lg:pb-6">
                        {USOS.map((u) => {
                            const deUso = laptops.filter((l) => usoDe(l) === u.value);
                            const desde = deUso.length ? Math.min(...deUso.map((l) => Number(l.precio_soles))) : null;
                            return (
                                <button
                                    key={u.value}
                                    onClick={() => filtrarUso(u.value)}
                                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-cyan-400/60"
                                >
                                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-400">
                                        <u.icon className="h-6 w-6" />
                                    </span>
                                    <span className="flex-1">
                                        <span className="block font-bold">{u.titulo}</span>
                                        <span className="block text-xs text-slate-400">
                                            {deUso.length} modelos
                                            {desde !== null && (
                                                <>
                                                    {' '}
                                                    · desde <b className="font-mono text-cyan-300">{soles(desde)}</b>
                                                </>
                                            )}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </section>
                </div>

                {/* Destacadas: una selección; el catálogo completo con filtros está en /hardware */}
                <section id="productos" className="scroll-mt-32 border-t border-white/10 bg-[#091827]">
                    <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold">{vista === 'pedidas' ? 'Las más pedidas' : 'Recién llegadas'}</h2>
                                <p className="mt-1 text-slate-400">
                                    {vista === 'pedidas'
                                        ? 'Las laptops que más eligen nuestros clientes.'
                                        : 'Los últimos modelos que sumamos al catálogo.'}
                                </p>
                            </div>
                            {hayPedidos && (
                                <div className="flex rounded-full border border-white/10 p-1 text-sm">
                                    {(
                                        [
                                            ['pedidas', 'Más pedidas'],
                                            ['novedades', 'Novedades'],
                                        ] as const
                                    ).map(([valor, etiqueta]) => (
                                        <button
                                            key={valor}
                                            type="button"
                                            onClick={() => setVista(valor)}
                                            aria-pressed={vista === valor}
                                            className={`rounded-full px-4 py-1.5 font-semibold transition ${
                                                vista === valor ? 'bg-cyan-400 text-[#07111f]' : 'text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            {etiqueta}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {destacadas.map((l) => (
                                <TarjetaProducto
                                    key={l.id}
                                    l={l}
                                    enComparar={comparar.includes(l.id)}
                                    compararLleno={comparar.length >= 3}
                                    whatsapp={contacto.whatsapp}
                                    onComparar={() => toggleComparar(l.id)}
                                    onPersonalizar={() => personalizar(l)}
                                />
                            ))}
                        </div>

                        <div className="mt-10 text-center">
                            <Link
                                href="/hardware"
                                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 px-6 py-3 font-bold text-cyan-300 transition hover:bg-cyan-400 hover:text-[#07111f]"
                            >
                                Ver catálogo completo ({laptops.length} modelos) <ArrowRight className="h-4 w-4" />
                            </Link>
                            <p className="mt-2 text-sm text-slate-500">Con filtros por precio, marca, procesador, RAM y más.</p>
                        </div>
                    </div>
                </section>

                {/* La IA como valor agregado */}
                <section className="border-t border-white/10">
                    <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:px-10">
                        <div>
                            <p className="text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">¿No sabes cuál elegir?</p>
                            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Deja que la IA te recomiende la laptop ideal</h2>
                            <p className="mt-4 text-slate-400">
                                Muchas personas pagan de más por potencia que no usan, o se quedan cortas para su software. Cuéntanos a qué te dedicas
                                y qué haces, y te mostramos qué laptops te sirven, con su porcentaje de compatibilidad y el porqué.
                            </p>
                            <Link
                                href={iaHref}
                                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 font-bold text-[#07111f] hover:bg-cyan-300"
                            >
                                <Sparkles className="h-4 w-4" /> {auth.user ? 'Pedir mi recomendación' : 'Crear cuenta gratis y probar'}
                            </Link>
                        </div>
                        <ol className="grid gap-3">
                            {[
                                ['Cuéntanos de ti', 'Tu carrera u ocupación, tus actividades y tu presupuesto.'],
                                ['Recibe tu recomendación', 'Laptops ordenadas por compatibilidad, con la explicación de por qué.'],
                                ['Personaliza y cotiza', 'Ajusta RAM, almacenamiento y accesorios; un asesor te contacta.'],
                            ].map(([titulo, texto], i) => (
                                <li key={titulo} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-400 font-bold text-[#07111f]">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold">{titulo}</p>
                                        <p className="mt-0.5 text-sm text-slate-400">{texto}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <StoreFooter />

                {/* Barra de comparación: aparece al elegir 2 o más */}
                {comparar.length >= 2 && (
                    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
                        <Link
                            href="/comparador"
                            className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#07111f] shadow-2xl hover:bg-cyan-300"
                        >
                            <Scale className="h-4 w-4" /> Comparar ({comparar.length})
                        </Link>
                    </div>
                )}

                <WhatsappButton />
                <ChatWidget />
            </div>
        </>
    );
}

function TarjetaProducto({
    l,
    enComparar,
    compararLleno,
    whatsapp,
    onComparar,
    onPersonalizar,
}: {
    l: Laptop;
    enComparar: boolean;
    compararLleno: boolean;
    whatsapp: string | null;
    onComparar: () => void;
    onPersonalizar: () => void;
}) {
    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1a2c] transition hover:-translate-y-0.5 hover:border-cyan-400/50">
            <div className="relative">
                <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="h-40 w-full" />
                {l.gpu_dedicada && (
                    <span className="absolute top-3 left-3 rounded-full bg-violet-500 px-2.5 py-0.5 text-[11px] font-bold">GPU dedicada</span>
                )}
                {disponibilidad(l.stock).texto && (
                    <span
                        className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${disponibilidad(l.stock).agotada ? 'bg-slate-700 text-slate-200' : 'bg-amber-400 text-[#07111f]'}`}
                    >
                        {disponibilidad(l.stock).texto}
                    </span>
                )}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">{l.marca}</p>
                <h3 className="mt-0.5 font-bold">{l.modelo}</h3>
                <ul className="mt-3 space-y-1 text-xs text-slate-400">
                    <li className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 shrink-0" /> {l.cpu}
                    </li>
                    <li className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 shrink-0" /> {l.ram_gb} GB RAM · {l.almacenamiento_tipo} {l.almacenamiento_gb} GB
                    </li>
                </ul>
                <p className="mt-4 font-mono text-2xl font-bold">{soles(l.precio_soles)}</p>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={onPersonalizar}
                        disabled={disponibilidad(l.stock).agotada}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-bold text-[#07111f] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ShoppingCart className="h-4 w-4" /> {disponibilidad(l.stock).agotada ? 'Agotada' : 'Comprar'}
                    </button>
                    <button
                        onClick={onComparar}
                        disabled={!enComparar && compararLleno}
                        title={enComparar ? 'Quitar del comparador' : compararLleno ? 'Máximo 3 para comparar' : 'Agregar al comparador'}
                        className={`rounded-xl border px-3 transition disabled:opacity-40 ${
                            enComparar ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/15 text-slate-300 hover:border-white/40'
                        }`}
                    >
                        {enComparar ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                    </button>
                    {whatsapp && (
                        <a
                            href={enlaceWhatsapp(whatsapp, `Hola, quiero información sobre la ${l.marca} ${l.modelo} (${soles(l.precio_soles)}).`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Consultar por WhatsApp"
                            className="grid place-items-center rounded-xl border border-white/15 px-3 text-[#25D366] hover:border-[#25D366]"
                        >
                            <WhatsappIcon className="h-4 w-4" />
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}
