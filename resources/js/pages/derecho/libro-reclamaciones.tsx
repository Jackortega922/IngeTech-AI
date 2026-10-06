import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { EmisorTienda } from '@/types/flujo';
import { Head, Link, useForm } from '@inertiajs/react';
import { BookOpenText, FileSearch, Info, Send } from 'lucide-react';
import type { ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Libro de Reclamaciones', href: '/libro-reclamaciones' }];

interface Inicial {
    nombre: string;
    email: string;
    telefono?: string;
    pedido_codigo: string;
    monto_reclamado?: string;
    descripcion_bien?: string;
}

/**
 * Libro de Reclamaciones virtual (Derecho). Sigue la hoja del Anexo I del reglamento (D.S.
 * 011-2011-PCM): 1) datos del consumidor, 2) bien contratado, 3) detalle y pedido. La parte 4
 * (respuesta del proveedor) la completa la tienda desde el panel de administración.
 */
export default function LibroReclamaciones({ inicial, proveedor, plazoDias }: { inicial: Inicial; proveedor: EmisorTienda; plazoDias: number }) {
    const form = useForm({
        tipo: 'reclamo' as 'reclamo' | 'queja',
        nombre: inicial.nombre,
        tipo_documento: 'DNI' as 'DNI' | 'CE' | 'Pasaporte',
        numero_documento: '',
        domicilio: '',
        telefono: inicial.telefono ?? '',
        email: inicial.email,
        menor_de_edad: false,
        apoderado: '',
        bien: 'producto' as 'producto' | 'servicio',
        pedido_codigo: inicial.pedido_codigo,
        monto_reclamado: inicial.monto_reclamado ?? '',
        descripcion_bien: inicial.descripcion_bien ?? '',
        detalle: '',
        pedido_consumidor: '',
        declara_veracidad: false,
    });
    const { data, setData, errors, processing } = form;

    const porConfigurar = <span className="text-slate-400 italic">por configurar</span>;
    const hoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Libro de Reclamaciones" />

            <main className="it-container max-w-4xl py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-7 text-white shadow-xl sm:p-9">
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.18),transparent_55%)]" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10">
                            <BookOpenText className="h-8 w-8 text-sky-200" />
                        </span>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Libro de Reclamaciones</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N.° 29571), esta tienda cuenta con
                                un Libro de Reclamaciones virtual a tu disposición.
                            </p>
                        </div>
                    </div>
                </section>

                <p className="mt-4 text-sm text-slate-500">
                    ¿Solo quieres ver cómo va tu hoja?{' '}
                    <Link href="/libro-reclamaciones/consultar" className="font-semibold text-sky-600 underline dark:text-sky-400">
                        Consultar mi reclamo
                    </Link>
                </p>

                <div className="it-card mt-6 grid gap-3 p-5 text-sm sm:grid-cols-3">
                    <Dato label="Proveedor">{proveedor.razon_social ?? 'IngeTech AI'}</Dato>
                    <Dato label="RUC">{proveedor.ruc ?? porConfigurar}</Dato>
                    <Dato label="Fecha">{hoy}</Dato>
                    <div className="sm:col-span-3">
                        <Dato label="Domicilio">{proveedor.direccion ?? porConfigurar}</Dato>
                    </div>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/libro-reclamaciones');
                    }}
                    className="mt-6 space-y-6"
                >
                    <Seccion n={1} titulo="Identificación del consumidor reclamante">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Campo label="Nombre completo" error={errors.nombre} className="sm:col-span-2">
                                <input className="it-input" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} />
                            </Campo>
                            <Campo label="Tipo de documento" error={errors.tipo_documento}>
                                <select
                                    className="it-input"
                                    value={data.tipo_documento}
                                    onChange={(e) => setData('tipo_documento', e.target.value as typeof data.tipo_documento)}
                                >
                                    <option value="DNI">DNI</option>
                                    <option value="CE">Carné de extranjería</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                </select>
                            </Campo>
                            <Campo label="Número de documento" error={errors.numero_documento}>
                                <input
                                    className="it-input"
                                    inputMode={data.tipo_documento === 'DNI' ? 'numeric' : 'text'}
                                    maxLength={data.tipo_documento === 'DNI' ? 8 : 12}
                                    value={data.numero_documento}
                                    onChange={(e) => setData('numero_documento', e.target.value.trim())}
                                />
                            </Campo>
                            <Campo label="Domicilio" error={errors.domicilio} className="sm:col-span-2">
                                <input
                                    className="it-input"
                                    placeholder="Dirección, distrito, provincia y departamento"
                                    value={data.domicilio}
                                    onChange={(e) => setData('domicilio', e.target.value)}
                                />
                            </Campo>
                            <Campo label="Correo electrónico" error={errors.email}>
                                <input type="email" className="it-input" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            </Campo>
                            <Campo label="Celular (opcional)" error={errors.telefono}>
                                <input
                                    className="it-input"
                                    inputMode="numeric"
                                    maxLength={9}
                                    placeholder="9XXXXXXXX"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value.replace(/\D/g, ''))}
                                />
                            </Campo>
                        </div>
                        <label className="mt-4 flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-sky-500"
                                checked={data.menor_de_edad}
                                onChange={(e) => setData('menor_de_edad', e.target.checked)}
                            />
                            Soy menor de edad
                        </label>
                        {data.menor_de_edad && (
                            <Campo label="Nombre del padre, madre o tutor" error={errors.apoderado} className="mt-3">
                                <input className="it-input" value={data.apoderado} onChange={(e) => setData('apoderado', e.target.value)} />
                            </Campo>
                        )}
                    </Seccion>

                    <Seccion n={2} titulo="Identificación del bien contratado">
                        <div className="flex gap-2">
                            {(['producto', 'servicio'] as const).map((b) => (
                                <Opcion key={b} activa={data.bien === b} onClick={() => setData('bien', b)}>
                                    {b === 'producto' ? 'Producto' : 'Servicio'}
                                </Opcion>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Campo label="Código del pedido (si compraste)" error={errors.pedido_codigo}>
                                <input
                                    className="it-input uppercase"
                                    placeholder="IT-XXXXXXXX"
                                    value={data.pedido_codigo}
                                    onChange={(e) => setData('pedido_codigo', e.target.value)}
                                />
                            </Campo>
                            <Campo label="Monto reclamado en S/ (opcional)" error={errors.monto_reclamado}>
                                <input
                                    className="it-input"
                                    inputMode="decimal"
                                    value={data.monto_reclamado}
                                    onChange={(e) => setData('monto_reclamado', e.target.value.replace(/[^\d.]/g, ''))}
                                />
                            </Campo>
                            <Campo label="Descripción" error={errors.descripcion_bien} className="sm:col-span-2">
                                <input
                                    className="it-input"
                                    placeholder="Ej.: Laptop Lenovo IdeaPad, envío, atención del asesor"
                                    value={data.descripcion_bien}
                                    onChange={(e) => setData('descripcion_bien', e.target.value)}
                                />
                            </Campo>
                        </div>
                    </Seccion>

                    <Seccion n={3} titulo="Detalle de la reclamación y pedido del consumidor">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Opcion activa={data.tipo === 'reclamo'} onClick={() => setData('tipo', 'reclamo')}>
                                <b>Reclamo</b>
                                <span className="mt-1 block text-xs font-normal text-slate-500">Disconformidad con el producto o servicio.</span>
                            </Opcion>
                            <Opcion activa={data.tipo === 'queja'} onClick={() => setData('tipo', 'queja')}>
                                <b>Queja</b>
                                <span className="mt-1 block text-xs font-normal text-slate-500">
                                    Malestar que no es por el producto, p. ej. por la atención recibida.
                                </span>
                            </Opcion>
                        </div>
                        <Campo label="Detalle: ¿qué pasó?" error={errors.detalle} className="mt-4">
                            <textarea
                                rows={5}
                                maxLength={3000}
                                className="it-input h-auto py-3"
                                value={data.detalle}
                                onChange={(e) => setData('detalle', e.target.value)}
                            />
                        </Campo>
                        <Campo label="Pedido: ¿qué solución esperas?" error={errors.pedido_consumidor} className="mt-4">
                            <textarea
                                rows={3}
                                maxLength={1500}
                                className="it-input h-auto py-3"
                                placeholder="Ej.: cambio del equipo, devolución del dinero, reparación"
                                value={data.pedido_consumidor}
                                onChange={(e) => setData('pedido_consumidor', e.target.value)}
                            />
                        </Campo>
                    </Seccion>

                    <div className="it-card space-y-3 p-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        <p className="flex gap-2">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                            <span>
                                La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para
                                interponer una denuncia ante el INDECOPI.
                            </span>
                        </p>
                        <p className="flex gap-2">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                            <span>El proveedor debe dar respuesta al reclamo en un plazo no mayor a {plazoDias} días hábiles improrrogables.</span>
                        </p>
                        <p className="flex gap-2">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                            <span>
                                Tus datos se usan solo para atender esta hoja y se conservan como lo exige la ley (Ley N.° 29733, de Protección de
                                Datos Personales).
                            </span>
                        </p>
                        <label className="flex items-start gap-2 pt-1 text-sm text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-sky-500"
                                checked={data.declara_veracidad}
                                onChange={(e) => setData('declara_veracidad', e.target.checked)}
                            />
                            Declaro que los datos consignados son verdaderos.
                        </label>
                        <InputError message={errors.declara_veracidad} />
                    </div>

                    <button type="submit" disabled={processing} className="it-btn it-btn-primary w-full sm:w-auto">
                        <Send className="h-4 w-4" /> {processing ? 'Enviando…' : 'Enviar hoja de reclamación'}
                    </button>
                </form>

                <Link href="/libro-reclamaciones/consultar" className="it-card mt-10 flex items-center gap-4 p-5 transition hover:border-sky-400">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)] dark:text-sky-300">
                        <FileSearch className="h-5 w-5" />
                    </span>
                    <span>
                        <b className="block">¿Ya presentaste una hoja?</b>
                        <span className="text-sm text-slate-500">Consulta en qué estado está y la respuesta de la tienda.</span>
                    </span>
                </Link>
            </main>
        </AppLayout>
    );
}

function Seccion({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
    return (
        <section className="it-card p-5 sm:p-6">
            <h2 className="flex items-center gap-3 text-base font-black">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--it-primary-soft)] text-sm text-[var(--it-primary)] dark:text-sky-300">
                    {n}
                </span>
                {titulo}
            </h2>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function Campo({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
    return (
        <label className={`block ${className ?? ''}`}>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
            {children}
            <InputError message={error} className="mt-1" />
        </label>
    );
}

function Opcion({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={activa}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                activa
                    ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20 dark:bg-sky-950/40 dark:text-sky-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
        >
            {children}
        </button>
    );
}

function Dato({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
            <p className="mt-0.5 font-semibold">{children}</p>
        </div>
    );
}
