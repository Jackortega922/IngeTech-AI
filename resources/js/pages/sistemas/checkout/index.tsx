import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import LaptopImage from '@/components/laptop-image';
import { flujoStorage } from '@/lib/flujo-storage';
import { luhnValido, marcaDe, soles, TARJETAS_PRUEBA, vencimientoValido } from '@/lib/pedidos';
import { type SharedData } from '@/types';
import type { Catalogos, Configuracion, Tarjeta } from '@/types/flujo';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CreditCard, FlaskConical, Lock, Truck } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

// Debe coincidir con config/tienda.php (costo_envio).
const COSTO_ENVIO = 0;

type Errores = Record<string, string>;

export default function CheckoutIndex({ departamentos }: { departamentos: string[] }) {
    const { auth } = usePage<SharedData>().props;
    const [config, setConfig] = useState<Configuracion | null>(null);
    const [seleccionada, setSeleccionada] = useState<Tarjeta | null>(null);
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);

    const [datos, setDatos] = useState({
        nombre: auth.user?.name ?? '',
        email: auth.user?.email ?? '',
        telefono: '',
        departamento: 'Huánuco',
        ciudad: '',
        direccion: '',
        referencia: '',
    });
    const [tarjeta, setTarjeta] = useState({ numero: '', titular: '', vence: '', cvv: '' });
    const [acepta, setAcepta] = useState(false);
    const [errores, setErrores] = useState<Errores>({});
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
    const [pagando, setPagando] = useState(false);

    useEffect(() => {
        const c = flujoStorage.leerConfiguracion();
        const s = flujoStorage.leerSeleccionada();
        if (!c || !s) {
            router.visit('/#productos');
            return;
        }
        setConfig(c);
        setSeleccionada(s);
        fetch('/api/catalogos', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then(setCatalogos)
            .catch(() => {});
    }, []);

    if (!config || !seleccionada) return null;
    const laptop = seleccionada.laptop;
    const flujo = config.recomendacion_id ? 'ia' : 'tienda';
    const kit = catalogos?.kits.find((k) => k.id === config.kit_id);
    const accesorios = catalogos?.accesorios.filter((a) => config.accesorio_ids.includes(a.id)) ?? [];
    const numero = tarjeta.numero.replace(/\D/g, '');
    const marca = marcaDe(numero);

    function validarLocal(): Errores {
        const e: Errores = {};
        if (datos.nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo.';
        if (!/^\S+@\S+\.\S+$/.test(datos.email)) e.email = 'Correo no válido.';
        if (!/^9\d{8}$/.test(datos.telefono)) e.telefono = 'Celular de 9 dígitos que empiece en 9.';
        if (!datos.ciudad.trim()) e.ciudad = 'Indica tu ciudad o distrito.';
        if (datos.direccion.trim().length < 5) e.direccion = 'Indica la dirección de entrega.';
        if (!marca || !luhnValido(numero)) e.numero = 'Número de tarjeta no válido.';
        if (tarjeta.titular.trim().length < 3) e.titular = 'Nombre como figura en la tarjeta.';
        if (!vencimientoValido(tarjeta.vence)) e.vence = 'Fecha MM/AA vigente.';
        if (!new RegExp(marca === 'amex' ? '^\\d{4}$' : '^\\d{3}$').test(tarjeta.cvv)) e.cvv = marca === 'amex' ? '4 dígitos.' : '3 dígitos.';
        if (!acepta) e.acepta_terminos = 'Debes aceptar para continuar.';
        return e;
    }

    async function pagar(ev: React.FormEvent) {
        ev.preventDefault();
        setErrorGeneral(null);
        const e = validarLocal();
        setErrores(e);
        if (Object.keys(e).length > 0 || !config) return;

        setPagando(true);
        try {
            const res = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    laptop_id: config.laptop_id,
                    recomendacion_id: config.recomendacion_id,
                    ram_gb: config.ram_gb,
                    almacenamiento_gb: config.almacenamiento_gb,
                    kit_id: config.kit_id,
                    accesorio_ids: config.accesorio_ids,
                    ...datos,
                    referencia: datos.referencia || null,
                    // Solo marca y últimos 4: el número completo no sale del navegador.
                    pago: { marca, ultimos4: numero.slice(-4) },
                    acepta_terminos: acepta,
                }),
            });
            const data = await res.json();

            if (res.status === 201) {
                flujoStorage.limpiarCompra();
                router.visit(`/pedido/${data.codigo}`);
                return;
            }
            if (res.status === 422 && data.errors) {
                setErrores(Object.fromEntries(Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [k, v[0]])));
                setErrorGeneral('Revisa los datos marcados.');
            } else {
                setErrorGeneral(data.message ?? 'No pudimos procesar el pago. Inténtalo de nuevo.');
            }
        } catch {
            setErrorGeneral('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.');
        } finally {
            setPagando(false);
        }
    }

    const setD = (k: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setDatos({ ...datos, [k]: e.target.value });

    return (
        <>
            <Head title="Finalizar compra — IngeTech AI" />
            <div className="min-h-screen bg-[#07111f] text-white">
                <FlowHeader pasoActual={4} flujo={flujo} />

                <main className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
                    <h1 className="text-3xl font-bold sm:text-4xl">Finalizar compra</h1>
                    <p className="mt-2 text-slate-400">
                        {auth.user ? 'Tus datos ya están cargados; revisa la dirección de entrega.' : 'No necesitas cuenta para comprar.'}{' '}
                        {!auth.user && (
                            <Link href="/login" className="text-cyan-400 underline">
                                ¿Ya tienes cuenta? Ingresa
                            </Link>
                        )}
                    </p>

                    <form onSubmit={pagar} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
                        <div className="space-y-8">
                            <Seccion titulo="1. Tus datos">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Campo label="Nombre completo" error={errores.nombre} className="sm:col-span-2">
                                        <input value={datos.nombre} onChange={setD('nombre')} autoComplete="name" className={input} />
                                    </Campo>
                                    <Campo label="Correo" error={errores.email}>
                                        <input type="email" value={datos.email} onChange={setD('email')} autoComplete="email" className={input} />
                                    </Campo>
                                    <Campo label="Celular" error={errores.telefono}>
                                        <input
                                            inputMode="numeric"
                                            maxLength={9}
                                            value={datos.telefono}
                                            onChange={(e) => setDatos({ ...datos, telefono: e.target.value.replace(/\D/g, '') })}
                                            placeholder="9XXXXXXXX"
                                            autoComplete="tel-national"
                                            className={input}
                                        />
                                    </Campo>
                                </div>
                            </Seccion>

                            <Seccion titulo="2. Envío" icono={<Truck className="h-4 w-4" />}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Campo label="Departamento" error={errores.departamento}>
                                        <select value={datos.departamento} onChange={setD('departamento')} className={input}>
                                            {departamentos.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    </Campo>
                                    <Campo label="Ciudad / distrito" error={errores.ciudad}>
                                        <input value={datos.ciudad} onChange={setD('ciudad')} autoComplete="address-level2" className={input} />
                                    </Campo>
                                    <Campo label="Dirección" error={errores.direccion} className="sm:col-span-2">
                                        <input
                                            value={datos.direccion}
                                            onChange={setD('direccion')}
                                            placeholder="Av., jirón o calle, número"
                                            autoComplete="street-address"
                                            className={input}
                                        />
                                    </Campo>
                                    <Campo label="Referencia (opcional)" error={errores.referencia} className="sm:col-span-2">
                                        <input
                                            value={datos.referencia}
                                            onChange={setD('referencia')}
                                            placeholder="Frente al parque, casa verde…"
                                            className={input}
                                        />
                                    </Campo>
                                </div>
                            </Seccion>

                            <Seccion titulo="3. Pago" icono={<CreditCard className="h-4 w-4" />}>
                                <div className="mb-4 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
                                    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="font-semibold">Pago simulado: no se cobra nada.</p>
                                        <p className="mt-1 text-xs text-amber-200/80">
                                            Es una demostración sin pasarela de pago real. Usa una tarjeta de prueba con cualquier fecha futura y
                                            cualquier CVV:
                                        </p>
                                        <ul className="mt-1 space-y-0.5 font-mono text-xs">
                                            {TARJETAS_PRUEBA.map((t) => (
                                                <li key={t.numero}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTarjeta({ ...tarjeta, numero: t.numero })}
                                                        className="underline decoration-amber-200/40 hover:text-white"
                                                    >
                                                        {t.numero}
                                                    </button>{' '}
                                                    → {t.resultado}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Campo label="Número de tarjeta" error={errores.numero} className="sm:col-span-2">
                                        <div className="relative">
                                            <input
                                                inputMode="numeric"
                                                autoComplete="cc-number"
                                                value={tarjeta.numero}
                                                onChange={(e) =>
                                                    setTarjeta({
                                                        ...tarjeta,
                                                        numero: e.target.value
                                                            .replace(/\D/g, '')
                                                            .slice(0, 19)
                                                            .replace(/(\d{4})(?=\d)/g, '$1 '),
                                                    })
                                                }
                                                placeholder="0000 0000 0000 0000"
                                                className={`${input} pr-24 font-mono`}
                                            />
                                            {marca && (
                                                <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded bg-white/10 px-2 py-0.5 text-xs font-bold uppercase">
                                                    {marca}
                                                </span>
                                            )}
                                        </div>
                                    </Campo>
                                    <Campo label="Nombre en la tarjeta" error={errores.titular} className="sm:col-span-2">
                                        <input
                                            value={tarjeta.titular}
                                            onChange={(e) => setTarjeta({ ...tarjeta, titular: e.target.value })}
                                            autoComplete="cc-name"
                                            className={input}
                                        />
                                    </Campo>
                                    <Campo label="Vence (MM/AA)" error={errores.vence}>
                                        <input
                                            inputMode="numeric"
                                            autoComplete="cc-exp"
                                            value={tarjeta.vence}
                                            onChange={(e) => {
                                                const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setTarjeta({ ...tarjeta, vence: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
                                            }}
                                            placeholder="MM/AA"
                                            className={`${input} font-mono`}
                                        />
                                    </Campo>
                                    <Campo label="CVV" error={errores.cvv}>
                                        <input
                                            inputMode="numeric"
                                            autoComplete="cc-csc"
                                            maxLength={4}
                                            value={tarjeta.cvv}
                                            onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value.replace(/\D/g, '') })}
                                            placeholder="123"
                                            className={`${input} font-mono`}
                                        />
                                    </Campo>
                                </div>
                            </Seccion>

                            <label className="flex items-start gap-3 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={acepta}
                                    onChange={(e) => setAcepta(e.target.checked)}
                                    className="mt-1 h-4 w-4 accent-cyan-400"
                                />
                                <span>
                                    Acepto los{' '}
                                    <a href="/derecho" target="_blank" className="text-cyan-400 underline">
                                        términos, la garantía y la política de privacidad
                                    </a>
                                    . Mis datos se usan solo para procesar y enviar este pedido.
                                    {errores.acepta_terminos && <span className="mt-1 block text-xs text-rose-400">{errores.acepta_terminos}</span>}
                                </span>
                            </label>
                        </div>

                        {/* Resumen */}
                        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-6">
                            <p className="text-sm text-slate-400">Tu pedido</p>
                            <div className="mt-3 flex items-center gap-3">
                                <LaptopImage
                                    imagenUrl={laptop.imagen_url}
                                    marca={laptop.marca}
                                    tipo={laptop.tipo}
                                    className="h-14 w-14 shrink-0 rounded-lg"
                                />
                                <div>
                                    <p className="font-bold">
                                        {laptop.marca} {laptop.modelo}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {config.ram_gb} GB RAM · {config.almacenamiento_gb} GB
                                    </p>
                                </div>
                            </div>
                            {(kit || accesorios.length > 0) && (
                                <ul className="mt-3 space-y-1 text-xs text-slate-400">
                                    {kit && <li>+ {kit.nombre}</li>}
                                    {accesorios.map((a) => (
                                        <li key={a.id}>+ {a.nombre}</li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                                <Fila label="Subtotal" valor={soles(config.precio_estimado)} />
                                <Fila label="Envío" valor={COSTO_ENVIO === 0 ? 'Gratis' : soles(COSTO_ENVIO)} />
                            </div>
                            <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
                                <span className="text-sm text-slate-300">Total</span>
                                <span className="font-mono text-2xl font-bold text-cyan-400">{soles(config.precio_estimado + COSTO_ENVIO)}</span>
                            </div>

                            {errorGeneral && (
                                <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-200">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {errorGeneral}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={pagando}
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 font-bold text-[#07111f] transition hover:bg-cyan-300 disabled:opacity-60"
                            >
                                <Lock className="h-4 w-4" /> {pagando ? 'Procesando pago…' : `Pagar ${soles(config.precio_estimado + COSTO_ENVIO)}`}
                            </button>
                            <Link
                                href="/personalizar"
                                className="mt-3 block text-center text-xs text-slate-400 underline decoration-white/20 hover:text-white"
                            >
                                ← Cambiar la configuración
                            </Link>
                        </aside>
                    </form>
                </main>
                <ChatWidget />
            </div>
        </>
    );
}

// color-scheme dark: la lista desplegable de un <select> la dibuja el navegador, y con el fondo
// semitransparente del campo salía blanca con letra blanca (ilegible). Así la dibuja oscura; el
// fondo explícito de las opciones cubre a los navegadores que no respetan color-scheme.
const input =
    'w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white [color-scheme:dark] placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none [&_option]:bg-[#0d1d31] [&_option]:text-white';

function Seccion({ titulo, icono, children }: { titulo: string; icono?: ReactNode; children: ReactNode }) {
    return (
        <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                {icono}
                {titulo}
            </h2>
            {children}
        </section>
    );
}

function Campo({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
    return (
        <label className={`block ${className ?? ''}`}>
            <span className="mb-1.5 block text-sm text-slate-300">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
        </label>
    );
}

function Fila({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="flex justify-between text-slate-300">
            <span>{label}</span>
            <span className="font-mono">{valor}</span>
        </div>
    );
}
