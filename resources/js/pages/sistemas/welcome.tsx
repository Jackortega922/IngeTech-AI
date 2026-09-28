import ChatWidget from '@/components/chat-widget';
import LaptopImage from '@/components/laptop-image';
import StoreFooter from '@/components/tienda/store-footer';
import WhatsappButton, { enlaceWhatsapp, WhatsappIcon } from '@/components/tienda/whatsapp-button';
import { flujoStorage } from '@/lib/flujo-storage';
import { type SharedData } from '@/types';
import type { Laptop } from '@/types/flujo';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, Briefcase, Check, Cpu, Gamepad2, HardDrive, Scale, Search, ShoppingCart, Sparkles, Truck, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Categorías por uso, derivadas de las specs (no hay columna "categoría" en la BD): así cada
// laptop nueva que se cargue en el admin cae sola en su categoría.
type Uso = 'estudio' | 'productividad' | 'creativo';

const USOS: { value: Uso; titulo: string; texto: string; icon: typeof BookOpen }[] = [
    { value: 'estudio', titulo: 'Estudio y oficina', texto: 'Clases virtuales, documentos y navegación.', icon: BookOpen },
    { value: 'productividad', titulo: 'Productividad y programación', texto: 'Multitarea, código y apps pesadas.', icon: Briefcase },
    { value: 'creativo', titulo: 'Diseño, ingeniería y gaming', texto: 'Con tarjeta gráfica dedicada.', icon: Gamepad2 },
];

function usoDe(l: Laptop): Uso {
    if (l.gpu_dedicada) return 'creativo';
    return (l.rendimiento_score ?? 0) >= 60 ? 'productividad' : 'estudio';
}

const soles = (n: number | string) => `S/ ${Number(n).toLocaleString('es-PE')}`;

export default function Welcome({ laptops }: { laptops: Laptop[] }) {
    const { auth, contacto } = usePage<SharedData>().props;
    const [busqueda, setBusqueda] = useState('');
    const [marca, setMarca] = useState<string | null>(null);
    const [uso, setUso] = useState<Uso | null>(null);
    const [orden, setOrden] = useState<'precio_asc' | 'precio_desc' | 'rendimiento'>('precio_asc');
    const [comparar, setComparar] = useState<number[]>([]);

    const marcas = useMemo(() => Array.from(new Set(laptops.map((l) => l.marca))), [laptops]);

    useEffect(() => {
        setComparar(flujoStorage.leerComparar());
        // El footer enlaza "Laptops Lenovo" como /?marca=Lenovo#productos.
        const m = new URLSearchParams(window.location.search).get('marca');
        if (m) setMarca(m);
    }, []);

    const visibles = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const lista = laptops.filter(
            (l) =>
                (!marca || l.marca === marca) &&
                (!uso || usoDe(l) === uso) &&
                (!q || `${l.marca} ${l.modelo} ${l.cpu} ${l.gpu ?? ''}`.toLowerCase().includes(q)),
        );
        return lista.sort((a, b) =>
            orden === 'rendimiento'
                ? (b.rendimiento_score ?? 0) - (a.rendimiento_score ?? 0)
                : (Number(a.precio_soles) - Number(b.precio_soles)) * (orden === 'precio_asc' ? 1 : -1),
        );
    }, [laptops, busqueda, marca, uso, orden]);

    function irAProductos() {
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    }

    function filtrarMarca(m: string | null) {
        setMarca(m);
        irAProductos();
    }

    function filtrarUso(u: Uso) {
        setUso(u);
        irAProductos();
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

    const cuentaHref = auth.user ? (auth.user.is_admin ? '/admin' : '/dashboard') : '/login';
    const iaHref = auth.user ? '/perfil' : '/register';

    return (
        <>
            <Head title="Laptops con recomendación inteligente" />

            <div className="min-h-screen bg-[#07111f] text-white">
                {/* Barra superior */}
                <div className="bg-cyan-400 text-[#07111f]">
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-2 text-xs font-semibold sm:justify-between lg:px-10">
                        <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" /> Envíos a todo el Perú
                        </span>
                        <span className="hidden sm:inline">{contacto.horario ?? 'Asesoría gratuita para elegir tu laptop'}</span>
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
                <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/95 backdrop-blur">
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
                                onKeyDown={(e) => e.key === 'Enter' && irAProductos()}
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
                                className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-slate-200 hover:border-cyan-400"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">{auth.user ? 'Mi cuenta' : 'Ingresar'}</span>
                            </Link>
                            <Link
                                href={iaHref}
                                className="hidden items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 font-bold text-[#07111f] hover:bg-cyan-300 lg:flex"
                            >
                                <Sparkles className="h-4 w-4" /> Recomiéndame con IA
                            </Link>
                        </nav>
                    </div>

                    {/* Marcas */}
                    <div className="border-t border-white/5">
                        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 py-2 text-sm lg:px-10">
                            <button
                                onClick={() => filtrarMarca(null)}
                                className={`shrink-0 rounded-lg px-3 py-1.5 ${marca === null ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Todas las laptops
                            </button>
                            {marcas.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => filtrarMarca(m)}
                                    className={`shrink-0 rounded-lg px-3 py-1.5 ${marca === m ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="absolute -top-20 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.2fr_1fr] lg:px-10 lg:py-20">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-300">
                                <Sparkles className="h-4 w-4" /> Te decimos cuál te conviene, no solo cuánto cuesta
                            </p>
                            <h1 className="mt-5 text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">
                                Laptops para estudiar, trabajar y crear. <span className="text-cyan-400">Elegidas con inteligencia.</span>
                            </h1>
                            <p className="mt-5 max-w-xl text-lg text-slate-400">
                                {laptops.length} modelos de {marcas.join(', ')} con precios desde{' '}
                                {laptops.length > 0 ? soles(Math.min(...laptops.map((l) => Number(l.precio_soles)))) : '—'}. Y si no sabes cuál
                                elegir, nuestra IA te recomienda la ideal según lo que haces.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <button
                                    onClick={irAProductos}
                                    className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-[#07111f] hover:bg-cyan-300"
                                >
                                    Ver laptops <ArrowRight className="h-4 w-4" />
                                </button>
                                <Link
                                    href={iaHref}
                                    className="flex items-center gap-2 rounded-xl border border-cyan-400/50 px-6 py-3.5 font-semibold text-cyan-300 hover:bg-cyan-400/10"
                                >
                                    <Sparkles className="h-4 w-4" /> Recomiéndame una
                                </Link>
                            </div>
                        </div>

                        {/* Categorías por uso */}
                        <div className="grid gap-3">
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
                                            <span className="block text-sm text-slate-400">{u.texto}</span>
                                        </span>
                                        <span className="text-right text-xs text-slate-400">
                                            {deUso.length} modelos
                                            {desde !== null && (
                                                <span className="block font-mono text-sm font-bold text-cyan-300">desde {soles(desde)}</span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Productos */}
                <section id="productos" className="scroll-mt-32 border-t border-white/10 bg-[#091827]">
                    <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold">{marca ? `Laptops ${marca}` : 'Nuestras laptops'}</h2>
                                <p className="mt-1 text-slate-400">
                                    {visibles.length} de {laptops.length} modelos
                                    {uso && ` · ${USOS.find((u) => u.value === uso)?.titulo}`}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                {USOS.map((u) => (
                                    <button
                                        key={u.value}
                                        onClick={() => setUso(uso === u.value ? null : u.value)}
                                        className={`rounded-full border px-3 py-1.5 ${
                                            uso === u.value
                                                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                                                : 'border-white/10 text-slate-300 hover:border-white/30'
                                        }`}
                                    >
                                        {u.titulo}
                                    </button>
                                ))}
                                <select
                                    value={orden}
                                    onChange={(e) => setOrden(e.target.value as typeof orden)}
                                    className="rounded-full border border-white/10 bg-[#07111f] px-3 py-1.5 text-slate-300"
                                    aria-label="Ordenar"
                                >
                                    <option value="precio_asc">Menor precio</option>
                                    <option value="precio_desc">Mayor precio</option>
                                    <option value="rendimiento">Más potentes</option>
                                </select>
                            </div>
                        </div>

                        {visibles.length === 0 ? (
                            <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
                                No encontramos laptops con esos filtros.{' '}
                                <button
                                    onClick={() => {
                                        setBusqueda('');
                                        setMarca(null);
                                        setUso(null);
                                    }}
                                    className="text-cyan-400 underline"
                                >
                                    Ver todas
                                </button>
                            </div>
                        ) : (
                            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {visibles.map((l) => (
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
                        )}
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
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-bold text-[#07111f] hover:bg-cyan-300"
                    >
                        <ShoppingCart className="h-4 w-4" /> Comprar
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
