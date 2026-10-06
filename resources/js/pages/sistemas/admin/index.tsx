import LaptopImage from '@/components/laptop-image';
import { LoadingPanel } from '@/components/loading-panel';
import AppLayout from '@/layouts/app-layout';
import { PUERTO_ETIQUETA } from '@/lib/guia-compra';
import { PanelInventario } from '@/pages/administracion/panel-inventario';
import { PanelUsuarios } from '@/pages/administracion/panel-usuarios';
import { PanelContabilidad } from '@/pages/contabilidad/panel-contabilidad';
import { PanelReclamos } from '@/pages/derecho/panel-reclamos';
import { PanelDashboard } from '@/pages/industrial/panel-dashboard';
import { PanelSegmentos } from '@/pages/marketing/panel-segmentos';
import { PanelPedidos } from '@/pages/sistemas/admin/panel-pedidos';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type { Carrera, Catalogos, Cliente, ContabilidadAdmin, DashboardAdmin, Laptop, Pedido, Reclamo, Software } from '@/types/flujo';
import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BookOpenText,
    Boxes,
    CheckCircle2,
    Coins,
    Database,
    Edit3,
    GraduationCap,
    Laptop as LaptopIcon,
    LayoutDashboard,
    Megaphone,
    Package,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShoppingBag,
    Trash2,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type InputHTMLAttributes, type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Administración', href: '/admin' }];

/**
 * Panel de la tienda. Diseño: Marco (PR #41) — cabecera "Centro de control", barra de pestañas,
 * tablas con buscador y formularios en ventanas emergentes. Lógica de main: cada rol ve solo sus
 * pestañas (App\Support\Roles) y cada pestaña de disciplina vive en su propio archivo.
 */
type Sub =
    | 'dashboard'
    | 'contabilidad'
    | 'clientes'
    | 'pedidos'
    | 'inventario'
    | 'reclamos'
    | 'marketing'
    | 'hardware'
    | 'software'
    | 'carreras'
    | 'usuarios';

const TABS: { value: Sub; label: string; icon: typeof LayoutDashboard }[] = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'contabilidad', label: 'Contabilidad', icon: Coins },
    { value: 'clientes', label: 'Clientes', icon: Users },
    { value: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { value: 'inventario', label: 'Inventario', icon: Boxes },
    { value: 'reclamos', label: 'Reclamos', icon: BookOpenText },
    { value: 'marketing', label: 'Marketing', icon: Megaphone },
    { value: 'hardware', label: 'Equipos', icon: LaptopIcon },
    { value: 'software', label: 'Software', icon: Package },
    { value: 'carreras', label: 'Carreras', icon: GraduationCap },
    { value: 'usuarios', label: 'Usuarios', icon: UserCog },
];

// La sección sale de la URL (/admin?tab=...), que es a donde llevan los enlaces del menú lateral.
// Cada sección se llama igual que su permiso (App\Support\Roles): el rol solo ve las suyas, y si
// la URL pide una que no le toca, se muestra la primera que sí.
function seccionDeUrl(url: string, permisos: string[]): Sub {
    const permitidas = TABS.filter((t) => permisos.includes(t.value));
    const valor = new URLSearchParams(url.split('?')[1] ?? '').get('tab');

    return permitidas.some((t) => t.value === valor) ? (valor as Sub) : (permitidas[0]?.value ?? 'dashboard');
}

const DATOS_POR_PERMISO = {
    dashboard: '/api/admin/dashboard',
    contabilidad: '/api/admin/contabilidad',
    clientes: '/api/admin/clientes',
    pedidos: '/api/admin/pedidos',
    reclamos: '/api/admin/reclamos',
} as const;

async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
        let message = 'No se pudo completar la operación.';
        try {
            const data = await res.json();
            // Error de validación: el primer campo con problema, que es lo que hay que corregir.
            const primero = data.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
            message = primero ?? data.message ?? data.error ?? message;
        } catch {
            // La respuesta no era JSON.
        }
        throw new Error(message);
    }

    return res.status === 204 ? null : res.json();
}

export default function AdminIndex() {
    const pagina = usePage<SharedData>();
    const { permisos } = pagina.props.auth;
    // Se navega con el menú lateral (antes había además una barra de pestañas con lo mismo). Los enlaces
    // del menú al panel conservan el estado (preserveState en nav-main): no se recarga todo.
    const sub = seccionDeUrl(pagina.url, permisos);
    const seccion = TABS.find((t) => t.value === sub) ?? TABS[0];
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [dashboard, setDashboard] = useState<DashboardAdmin | null>(null);
    const [contabilidad, setContabilidad] = useState<ContabilidadAdmin | null>(null);
    const [clientes, setClientes] = useState<Cliente[] | null>(null);
    const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
    const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);

    const [mensaje, setMensaje] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);

        const pedir = async (url: string) => {
            const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        };
        // Solo se piden los datos de las secciones del rol: el resto respondería 403.
        const opcional = (permiso: keyof typeof DATOS_POR_PERMISO) =>
            permisos.includes(permiso) ? pedir(DATOS_POR_PERMISO[permiso]) : Promise.resolve(null);

        // Cada sección por separado (idea de Marco): si una falla, las demás se siguen viendo.
        const [cat, dash, cont, cli, ped, rec] = await Promise.allSettled([
            pedir('/api/catalogos'),
            opcional('dashboard'),
            opcional('contabilidad'),
            opcional('clientes'),
            opcional('pedidos'),
            opcional('reclamos'),
        ]);

        const fallas: string[] = [];
        const tomar = <T,>(r: PromiseSettledResult<T>, nombre: string, guardar: (v: T) => void) => {
            if (r.status === 'fulfilled') guardar(r.value);
            else fallas.push(nombre);
        };
        tomar(cat, 'catálogo', setCatalogos);
        tomar(dash, 'dashboard', setDashboard);
        tomar(cont, 'contabilidad', setContabilidad);
        tomar(cli, 'clientes', setClientes);
        tomar(ped, 'pedidos', setPedidos);
        tomar(rec, 'reclamos', setReclamos);

        if (fallas.length) setError(`No se pudo cargar: ${fallas.join(', ')}.`);
        setCargando(false);
        // permisos no cambia mientras la página está abierta (viene del servidor al cargarla).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    function avisar(msg: string) {
        setMensaje(msg);
        setTimeout(() => setMensaje(null), 3500);
    }

    return (
        <AppLayout breadcrumbs={[...breadcrumbs, { title: seccion.label, href: `/admin?tab=${seccion.value}` }]}>
            <Head title="Administración — IngeTech AI" />
            <div className="min-h-full bg-slate-50/70 dark:bg-slate-950">
                <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-7">
                    <header className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-6 text-white shadow-xl sm:p-8">
                        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
                        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold">
                                    <Database className="h-3.5 w-3.5 text-sky-300" /> Centro de control · Administración
                                </div>
                                <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    <seccion.icon className="h-8 w-8 text-sky-300" />
                                    {seccion.label}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                    Ventas, inventario, clientes y el catálogo que alimenta las recomendaciones de IngeTech AI.
                                </p>
                            </div>
                            <button
                                onClick={() => void cargar()}
                                disabled={cargando}
                                className="it-btn rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"
                            >
                                <RefreshCw className={cargando ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Actualizar datos
                            </button>
                        </div>
                    </header>

                    {mensaje && (
                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            {mensaje}
                            <button className="ml-auto" onClick={() => setMensaje(null)} aria-label="Cerrar">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {error}
                            <button onClick={() => void cargar()} className="ml-auto rounded-lg border px-3 py-1.5 text-xs font-bold">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!catalogos || cargando ? (
                        <LoadingPanel />
                    ) : sub === 'dashboard' ? (
                        <PanelDashboard dashboard={dashboard} carreras={catalogos.carreras} />
                    ) : sub === 'contabilidad' ? (
                        <PanelContabilidad datos={contabilidad} />
                    ) : sub === 'clientes' ? (
                        <PanelClientes clientes={clientes} />
                    ) : sub === 'pedidos' ? (
                        <PanelPedidos pedidos={pedidos} avisar={avisar} soloLectura={!permisos.includes('pedidos.editar')} />
                    ) : sub === 'inventario' ? (
                        <PanelInventario avisar={avisar} />
                    ) : sub === 'reclamos' ? (
                        <PanelReclamos reclamos={reclamos} avisar={avisar} />
                    ) : sub === 'marketing' ? (
                        <PanelSegmentos avisar={avisar} />
                    ) : sub === 'usuarios' ? (
                        <PanelUsuarios avisar={avisar} />
                    ) : sub === 'hardware' ? (
                        <PanelEquipos equipos={catalogos.hardware} onCambio={cargar} avisar={avisar} />
                    ) : sub === 'software' ? (
                        <PanelSoftware items={catalogos.software} onCambio={cargar} avisar={avisar} />
                    ) : (
                        <PanelCarreras carreras={catalogos.carreras} software={catalogos.software} onCambio={cargar} avisar={avisar} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

/* ============================================================
   PIEZAS COMUNES (diseño de Marco)
============================================================ */

function Modal({
    open,
    title,
    description,
    onClose,
    children,
    footer,
}: {
    open: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
    footer: ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="it-modal-backdrop" onMouseDown={onClose}>
            <section className="it-modal" onMouseDown={(e) => e.stopPropagation()}>
                <header className="it-modal-header">
                    <div>
                        <p className="it-eyebrow">Gestión de catálogo</p>
                        <h2 className="mt-1 text-xl font-bold">{title}</h2>
                        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                    </div>
                    <button type="button" className="it-icon-btn" onClick={onClose} aria-label="Cerrar">
                        <X className="h-4 w-4" />
                    </button>
                </header>
                <div className="it-modal-body it-scrollbar">{children}</div>
                <footer className="it-modal-footer">{footer}</footer>
            </section>
        </div>
    );
}

function CatalogHeader({
    icon,
    title,
    subtitle,
    button,
    onAdd,
    query,
    setQuery,
}: {
    icon: ReactNode;
    title: string;
    subtitle: string;
    button?: string;
    onAdd?: () => void;
    query: string;
    setQuery: (v: string) => void;
}) {
    return (
        <div className="it-admin-card">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)] dark:text-sky-300">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{title}</h2>
                        <p className="text-sm text-slate-500">{subtitle}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            className="it-form-input w-full pl-10 sm:w-80"
                            placeholder={`Buscar ${title.toLowerCase()}...`}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    {button && onAdd && (
                        <button className="it-btn it-btn-primary" onClick={onAdd}>
                            <Plus className="h-4 w-4" />
                            {button}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function Vacio({ texto }: { texto: string }) {
    return (
        <div className="py-14 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">{texto}</p>
        </div>
    );
}

function Campo({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
    return (
        <label className={`it-form-label ${className ?? ''}`}>
            {label}
            {children}
        </label>
    );
}

function ErrorForm({ texto }: { texto: string | null }) {
    if (!texto) return null;
    return <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{texto}</p>;
}

function PieModal({ guardando, onCancelar, onGuardar, texto }: { guardando: boolean; onCancelar: () => void; onGuardar: () => void; texto: string }) {
    return (
        <>
            <button className="it-btn it-btn-secondary" onClick={onCancelar}>
                Cancelar
            </button>
            <button className="it-btn it-btn-primary" disabled={guardando} onClick={onGuardar}>
                <Save className="h-4 w-4" />
                {guardando ? 'Guardando…' : texto}
            </button>
        </>
    );
}

function Acciones({ onEditar, onEliminar }: { onEditar: () => void; onEliminar: () => void }) {
    return (
        <div className="flex justify-end gap-1">
            <button className="it-icon-btn" title="Editar" aria-label="Editar" onClick={onEditar}>
                <Edit3 className="h-4 w-4" />
            </button>
            <button className="it-icon-btn text-rose-500 hover:bg-rose-50" title="Eliminar" aria-label="Eliminar" onClick={onEliminar}>
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}

// Los números del formulario se editan como texto (un campo opcional puede quedar vacío) y se
// convierten al guardar: vacío → null, para que el servidor diga qué falta en vez de inventar.
const num = (v: string) => (v.trim() === '' ? null : Number(v));
const txt = (v: string) => (v.trim() === '' ? null : v.trim());
const str = (v: number | string | null | undefined) => (v === null || v === undefined ? '' : String(v));

// Un formulario en ventana emergente: borrador, guardado y su error.
function useEdicion<B>(guardarEnServidor: (b: B) => Promise<string>, onCambio: () => Promise<void>, avisar: (m: string) => void) {
    const [editando, setEditando] = useState<B | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function abrir(b: B) {
        setEditando(b);
        setError(null);
    }

    async function guardar() {
        if (!editando) return;
        setGuardando(true);
        setError(null);
        try {
            avisar(await guardarEnServidor(editando));
            setEditando(null);
            await onCambio();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        } finally {
            setGuardando(false);
        }
    }

    return { editando, setEditando, guardando, error, abrir, guardar, cerrar: () => setEditando(null) };
}

async function eliminarConfirmando(pregunta: string, url: string, hecho: string, onCambio: () => Promise<void>, avisar: (m: string) => void) {
    if (!window.confirm(pregunta)) return;
    try {
        await api(url, 'DELETE');
        avisar(hecho);
        await onCambio();
    } catch (e) {
        avisar(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
}

/* ============================================================
   EQUIPOS
============================================================ */

interface BorradorEquipo {
    id: number | null;
    marca: string;
    modelo: string;
    descripcion: string;
    imagen_url: string;
    tipo: Laptop['tipo'];
    cpu: string;
    rendimiento_score: string;
    ram_gb: string;
    ram_ampliable_gb: string;
    almacenamiento_gb: string;
    almacenamiento_tipo: string;
    gpu: string;
    gpu_dedicada: boolean;
    bateria_horas: string;
    pantalla_pulgadas: string;
    pantalla_resolucion: string;
    pantalla_hz: string;
    peso_kg: string;
    puertos: string[];
    precio_soles: string;
    tienda: string;
}

const equipoVacio = (): BorradorEquipo => ({
    id: null,
    marca: '',
    modelo: '',
    descripcion: '',
    imagen_url: '',
    tipo: 'laptop',
    cpu: '',
    rendimiento_score: '',
    ram_gb: '',
    ram_ampliable_gb: '',
    almacenamiento_gb: '',
    almacenamiento_tipo: 'SSD',
    gpu: '',
    gpu_dedicada: false,
    bateria_horas: '',
    pantalla_pulgadas: '',
    pantalla_resolucion: '',
    pantalla_hz: '',
    peso_kg: '',
    puertos: [],
    precio_soles: '',
    tienda: '',
});

const equipoABorrador = (l: Laptop): BorradorEquipo => ({
    id: l.id,
    marca: l.marca,
    modelo: l.modelo,
    descripcion: l.descripcion ?? '',
    imagen_url: l.imagen_url ?? '',
    tipo: l.tipo,
    cpu: l.cpu,
    rendimiento_score: str(l.rendimiento_score),
    ram_gb: str(l.ram_gb),
    ram_ampliable_gb: str(l.ram_ampliable_gb),
    almacenamiento_gb: str(l.almacenamiento_gb),
    almacenamiento_tipo: l.almacenamiento_tipo,
    gpu: l.gpu ?? '',
    gpu_dedicada: l.gpu_dedicada,
    bateria_horas: str(l.bateria_horas),
    pantalla_pulgadas: str(l.pantalla_pulgadas),
    pantalla_resolucion: l.pantalla_resolucion ?? '',
    pantalla_hz: str(l.pantalla_hz),
    peso_kg: str(l.peso_kg),
    puertos: l.puertos ?? [],
    precio_soles: str(l.precio_soles),
    tienda: l.tienda ?? '',
});

async function guardarEquipo(b: BorradorEquipo): Promise<string> {
    const payload = {
        marca: b.marca.trim(),
        modelo: b.modelo.trim(),
        descripcion: txt(b.descripcion),
        // Enlace a una foto, no un archivo subido: el plan gratuito de Render no guarda archivos.
        imagen_url: txt(b.imagen_url),
        tipo: b.tipo,
        cpu: b.cpu.trim(),
        rendimiento_score: num(b.rendimiento_score),
        ram_gb: num(b.ram_gb),
        ram_ampliable_gb: num(b.ram_ampliable_gb),
        almacenamiento_gb: num(b.almacenamiento_gb),
        almacenamiento_tipo: b.almacenamiento_tipo.trim(),
        gpu: txt(b.gpu),
        gpu_dedicada: b.gpu_dedicada,
        bateria_horas: num(b.bateria_horas),
        pantalla_pulgadas: num(b.pantalla_pulgadas),
        pantalla_resolucion: txt(b.pantalla_resolucion),
        pantalla_hz: num(b.pantalla_hz),
        peso_kg: num(b.peso_kg),
        puertos: b.puertos,
        precio_soles: num(b.precio_soles),
        tienda: txt(b.tienda),
    };
    if (b.id) {
        await api(`/api/admin/hardware/${b.id}`, 'PUT', payload);
        return 'Equipo actualizado.';
    }
    await api('/api/admin/hardware', 'POST', payload);
    // Sin stock no se puede vender ni se recomienda: se avisa dónde registrarlo.
    return 'Equipo creado. Registra su stock en Inventario para que se pueda vender.';
}

function PanelEquipos({ equipos, onCambio, avisar }: { equipos: Laptop[]; onCambio: () => Promise<void>; avisar: (m: string) => void }) {
    const [query, setQuery] = useState('');
    const edicion = useEdicion(guardarEquipo, onCambio, avisar);

    const filtrados = useMemo(
        () => equipos.filter((x) => `${x.marca} ${x.modelo} ${x.cpu} ${x.gpu ?? ''}`.toLowerCase().includes(query.toLowerCase())),
        [equipos, query],
    );

    return (
        <section className="space-y-5">
            <CatalogHeader
                icon={<LaptopIcon className="h-5 w-5" />}
                title="Equipos"
                subtitle={`${equipos.length} laptops en el catálogo que usa el motor de recomendación.`}
                button="Añadir equipo"
                onAdd={() => edicion.abrir(equipoVacio())}
                query={query}
                setQuery={setQuery}
            />
            <div className="it-table-shell">
                <div className="overflow-x-auto">
                    <table className="it-table min-w-[1000px]">
                        <thead>
                            <tr>
                                <th>Equipo</th>
                                <th>Rendimiento</th>
                                <th>Memoria</th>
                                <th>GPU</th>
                                <th>Stock</th>
                                <th>Precio</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((l) => (
                                <tr key={l.id} className="it-table-row">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-950">
                                                <LaptopImage imagenUrl={l.imagen_url} marca={l.marca} tipo={l.tipo} className="h-full w-full" />
                                            </div>
                                            <div>
                                                <p className="font-bold">
                                                    {l.marca} {l.modelo}
                                                </p>
                                                <p className="text-xs text-slate-500">{l.cpu}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                                            {l.rendimiento_score ?? '—'}/100
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm">
                                        {l.ram_gb} GB · {l.almacenamiento_gb} GB {l.almacenamiento_tipo}
                                    </td>
                                    <td className="p-3 text-sm">{l.gpu_dedicada ? (l.gpu ?? 'Dedicada') : 'Integrada'}</td>
                                    <td className={`p-3 text-sm font-bold ${l.stock === 0 ? 'text-rose-600' : ''}`}>{l.stock}</td>
                                    <td className="p-3 font-bold">S/ {Number(l.precio_soles).toLocaleString('es-PE')}</td>
                                    <td className="p-3">
                                        <Acciones
                                            onEditar={() => edicion.abrir(equipoABorrador(l))}
                                            onEliminar={() =>
                                                void eliminarConfirmando(
                                                    `¿Eliminar ${l.marca} ${l.modelo}? Esta acción no se puede deshacer.`,
                                                    `/api/admin/hardware/${l.id}`,
                                                    'Equipo eliminado.',
                                                    onCambio,
                                                    avisar,
                                                )
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtrados.length === 0 && <Vacio texto="No encontramos equipos con esa búsqueda." />}
            </div>

            <Modal
                open={!!edicion.editando}
                title={edicion.editando?.id ? 'Editar equipo' : 'Añadir equipo'}
                description="Lo que guardes aquí lo usan el catálogo, el comparador y el motor de recomendación."
                onClose={edicion.cerrar}
                footer={
                    <PieModal
                        guardando={edicion.guardando}
                        onCancelar={edicion.cerrar}
                        onGuardar={() => void edicion.guardar()}
                        texto="Guardar equipo"
                    />
                }
            >
                <ErrorForm texto={edicion.error} />
                {edicion.editando && <FormEquipo value={edicion.editando} onChange={edicion.setEditando} />}
            </Modal>
        </section>
    );
}

function FormEquipo({ value, onChange }: { value: BorradorEquipo; onChange: (v: BorradorEquipo) => void }) {
    const set = <K extends keyof BorradorEquipo>(k: K, v: BorradorEquipo[K]) => onChange({ ...value, [k]: v });
    const input = (k: keyof BorradorEquipo, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
        <input className="it-form-input" value={value[k] as string} onChange={(e) => set(k, e.target.value as never)} {...props} />
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="h-28 w-40 shrink-0 overflow-hidden rounded-2xl border bg-slate-100 dark:bg-slate-950">
                    <LaptopImage imagenUrl={value.imagen_url || null} marca={value.marca || 'IngeTech'} tipo={value.tipo} className="h-full w-full" />
                </div>
                <Campo label="Enlace de la foto (opcional)" className="flex-1">
                    {input('imagen_url', { type: 'url', placeholder: 'https://…' })}
                    <span className="text-xs font-normal text-slate-500">Sin foto se muestra la ilustración de la marca.</span>
                </Campo>
            </div>

            <div className="it-form-grid">
                <Campo label="Marca">{input('marca')}</Campo>
                <Campo label="Modelo">{input('modelo')}</Campo>
                <Campo label="Procesador">{input('cpu', { placeholder: 'Ryzen 5 7530U' })}</Campo>
                <Campo label="Rendimiento (0–100)">{input('rendimiento_score', { type: 'number', min: 0, max: 100 })}</Campo>
                <Campo label="RAM (GB)">{input('ram_gb', { type: 'number', min: 1 })}</Campo>
                <Campo label="RAM ampliable hasta (GB)">{input('ram_ampliable_gb', { type: 'number', min: 1 })}</Campo>
                <Campo label="Almacenamiento (GB)">{input('almacenamiento_gb', { type: 'number', min: 1 })}</Campo>
                <Campo label="Tipo de almacenamiento">{input('almacenamiento_tipo', { placeholder: 'SSD' })}</Campo>
                <Campo label="GPU">{input('gpu', { placeholder: 'RTX 4050 / Radeon integrada' })}</Campo>
                <Campo label="Batería (horas)">{input('bateria_horas', { type: 'number', min: 0 })}</Campo>
                <Campo label="Precio (S/)">{input('precio_soles', { type: 'number', min: 0 })}</Campo>
                <Campo label="Tienda de referencia">{input('tienda')}</Campo>
            </div>
            <label className="flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold">
                <input type="checkbox" checked={value.gpu_dedicada} onChange={(e) => set('gpu_dedicada', e.target.checked)} /> GPU dedicada
            </label>

            <div>
                <h3 className="text-sm font-bold">Pantalla, peso y puertos</h3>
                <p className="text-xs text-slate-500">Los usan la guía para decidir del comparador y la afinidad del motor.</p>
                <div className="it-form-grid mt-3">
                    <Campo label="Pantalla (pulgadas)">{input('pantalla_pulgadas', { type: 'number', step: 0.1 })}</Campo>
                    <Campo label="Resolución">{input('pantalla_resolucion', { placeholder: '1920x1080' })}</Campo>
                    <Campo label="Frecuencia (Hz)">{input('pantalla_hz', { type: 'number' })}</Campo>
                    <Campo label="Peso (kg)">{input('peso_kg', { type: 'number', step: 0.01 })}</Campo>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(PUERTO_ETIQUETA).map(([clave, etiqueta]) => (
                        <label key={clave} className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold">
                            <input
                                type="checkbox"
                                checked={value.puertos.includes(clave)}
                                onChange={(e) =>
                                    set('puertos', e.target.checked ? [...value.puertos, clave] : value.puertos.filter((p) => p !== clave))
                                }
                            />
                            {etiqueta}
                        </label>
                    ))}
                </div>
            </div>

            <Campo label="Descripción">
                <textarea
                    className="min-h-24 rounded-xl border bg-white p-3 text-sm outline-none focus:border-slate-400 dark:bg-slate-950"
                    value={value.descripcion}
                    maxLength={500}
                    onChange={(e) => set('descripcion', e.target.value)}
                />
            </Campo>
        </div>
    );
}

/* ============================================================
   SOFTWARE
============================================================ */

interface BorradorSoftware {
    id: number | null;
    clave: string;
    nombre: string;
    categoria: string;
    descripcion: string;
    min_ram_gb: string;
    min_cpu_score: string;
    min_gpu_dedicada: boolean;
    rec_ram_gb: string;
    rec_cpu_score: string;
    rec_gpu_dedicada: boolean;
}

const softwareVacio = (): BorradorSoftware => ({
    id: null,
    clave: '',
    nombre: '',
    categoria: '',
    descripcion: '',
    min_ram_gb: '',
    min_cpu_score: '',
    min_gpu_dedicada: false,
    rec_ram_gb: '',
    rec_cpu_score: '',
    rec_gpu_dedicada: false,
});

const softwareABorrador = (s: Software): BorradorSoftware => ({
    id: s.id,
    clave: s.clave,
    nombre: s.nombre,
    categoria: s.categoria,
    descripcion: s.descripcion ?? '',
    min_ram_gb: str(s.min_ram_gb),
    min_cpu_score: str(s.min_cpu_score),
    min_gpu_dedicada: s.min_gpu_dedicada,
    rec_ram_gb: str(s.rec_ram_gb),
    rec_cpu_score: str(s.rec_cpu_score),
    rec_gpu_dedicada: s.rec_gpu_dedicada,
});

async function guardarSoftware(b: BorradorSoftware): Promise<string> {
    const payload = {
        clave: b.clave.trim(),
        nombre: b.nombre.trim(),
        categoria: b.categoria.trim(),
        descripcion: txt(b.descripcion),
        min_ram_gb: num(b.min_ram_gb),
        min_cpu_score: num(b.min_cpu_score),
        min_gpu_dedicada: b.min_gpu_dedicada,
        rec_ram_gb: num(b.rec_ram_gb),
        rec_cpu_score: num(b.rec_cpu_score),
        rec_gpu_dedicada: b.rec_gpu_dedicada,
    };
    await (b.id ? api(`/api/admin/software/${b.id}`, 'PUT', payload) : api('/api/admin/software', 'POST', payload));
    return b.id ? 'Software actualizado.' : 'Software creado.';
}

function PanelSoftware({ items, onCambio, avisar }: { items: Software[]; onCambio: () => Promise<void>; avisar: (m: string) => void }) {
    const [query, setQuery] = useState('');
    const edicion = useEdicion(guardarSoftware, onCambio, avisar);
    const b = edicion.editando;

    const filtrados = useMemo(
        () => items.filter((x) => `${x.nombre} ${x.categoria} ${x.clave}`.toLowerCase().includes(query.toLowerCase())),
        [items, query],
    );

    const set = <K extends keyof BorradorSoftware>(k: K, v: BorradorSoftware[K]) => b && edicion.setEditando({ ...b, [k]: v });
    const input = (k: keyof BorradorSoftware, props: InputHTMLAttributes<HTMLInputElement> = {}) =>
        b && <input className="it-form-input" value={b[k] as string} onChange={(e) => set(k, e.target.value as never)} {...props} />;

    return (
        <section className="space-y-5">
            <CatalogHeader
                icon={<Package className="h-5 w-5" />}
                title="Software"
                subtitle="Requisitos de cada programa: el motor toma el más exigente de los que usa la persona."
                button="Añadir software"
                onAdd={() => edicion.abrir(softwareVacio())}
                query={query}
                setQuery={setQuery}
            />
            <div className="it-table-shell">
                <div className="overflow-x-auto">
                    <table className="it-table min-w-[900px]">
                        <thead>
                            <tr>
                                <th>Programa</th>
                                <th>Categoría</th>
                                <th>Mínimo</th>
                                <th>Recomendado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((s) => (
                                <tr key={s.id} className="it-table-row">
                                    <td className="p-3">
                                        <p className="font-bold">{s.nombre}</p>
                                        <p className="font-mono text-xs text-slate-500">{s.clave}</p>
                                    </td>
                                    <td className="p-3 text-sm">{s.categoria}</td>
                                    <td className="p-3 text-sm">
                                        {s.min_ram_gb} GB · CPU {s.min_cpu_score}
                                        {s.min_gpu_dedicada ? ' · GPU' : ''}
                                    </td>
                                    <td className="p-3 text-sm font-semibold">
                                        {s.rec_ram_gb} GB · CPU {s.rec_cpu_score}
                                        {s.rec_gpu_dedicada ? ' · GPU' : ''}
                                    </td>
                                    <td className="p-3">
                                        <Acciones
                                            onEditar={() => edicion.abrir(softwareABorrador(s))}
                                            onEliminar={() =>
                                                void eliminarConfirmando(
                                                    `¿Eliminar ${s.nombre}? Las carreras que lo usan dejarán de tenerlo.`,
                                                    `/api/admin/software/${s.id}`,
                                                    'Software eliminado.',
                                                    onCambio,
                                                    avisar,
                                                )
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtrados.length === 0 && <Vacio texto="No encontramos software con esa búsqueda." />}
            </div>

            <Modal
                open={!!b}
                title={b?.id ? 'Editar software' : 'Añadir software'}
                description="El motor compara estos requisitos con cada laptop."
                onClose={edicion.cerrar}
                footer={
                    <PieModal
                        guardando={edicion.guardando}
                        onCancelar={edicion.cerrar}
                        onGuardar={() => void edicion.guardar()}
                        texto="Guardar software"
                    />
                }
            >
                <ErrorForm texto={edicion.error} />
                {b && (
                    <div className="space-y-6">
                        <div className="it-form-grid">
                            <Campo label="Nombre">{input('nombre')}</Campo>
                            <Campo label="Clave (sin espacios)">{input('clave', { placeholder: 'autocad' })}</Campo>
                            <Campo label="Categoría">{input('categoria', { placeholder: 'Diseño / CAD' })}</Campo>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {(['min', 'rec'] as const).map((n) => (
                                <div key={n} className="rounded-2xl border p-4">
                                    <p className="text-sm font-bold">{n === 'min' ? 'Requisitos mínimos' : 'Requisitos recomendados'}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <Campo label="RAM (GB)">{input(`${n}_ram_gb`, { type: 'number', min: 1 })}</Campo>
                                        <Campo label="CPU (0–100)">{input(`${n}_cpu_score`, { type: 'number', min: 0, max: 100 })}</Campo>
                                    </div>
                                    <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                                        <input
                                            type="checkbox"
                                            checked={b[`${n}_gpu_dedicada`]}
                                            onChange={(e) => set(`${n}_gpu_dedicada`, e.target.checked)}
                                        />
                                        Necesita GPU dedicada
                                    </label>
                                </div>
                            ))}
                        </div>
                        <Campo label="Descripción">
                            <textarea
                                className="min-h-20 rounded-xl border bg-white p-3 text-sm outline-none focus:border-slate-400 dark:bg-slate-950"
                                value={b.descripcion}
                                maxLength={500}
                                onChange={(e) => set('descripcion', e.target.value)}
                            />
                        </Campo>
                    </div>
                )}
            </Modal>
        </section>
    );
}

/* ============================================================
   CARRERAS
============================================================ */

interface BorradorCarrera {
    id: number | null;
    clave: string;
    nombre: string;
    facultad: string;
    software_claves: string[];
}

async function guardarCarrera(b: BorradorCarrera): Promise<string> {
    const payload = { clave: b.clave.trim(), nombre: b.nombre.trim(), facultad: b.facultad.trim(), software_claves: b.software_claves };
    await (b.id ? api(`/api/admin/carreras/${b.id}`, 'PUT', payload) : api('/api/admin/carreras', 'POST', payload));
    return b.id ? 'Carrera actualizada.' : 'Carrera creada.';
}

function PanelCarreras({
    carreras,
    software,
    onCambio,
    avisar,
}: {
    carreras: Carrera[];
    software: Software[];
    onCambio: () => Promise<void>;
    avisar: (m: string) => void;
}) {
    const [query, setQuery] = useState('');
    const edicion = useEdicion(guardarCarrera, onCambio, avisar);
    const b = edicion.editando;

    const filtradas = carreras.filter((c) => `${c.nombre} ${c.facultad}`.toLowerCase().includes(query.toLowerCase()));
    const nombreSoftware = (clave: string) => software.find((s) => s.clave === clave)?.nombre ?? clave;

    return (
        <section className="space-y-5">
            <CatalogHeader
                icon={<GraduationCap className="h-5 w-5" />}
                title="Carreras"
                subtitle="Cada carrera trae los programas típicos que la IA considera si la persona la elige."
                button="Añadir carrera"
                onAdd={() => edicion.abrir({ id: null, clave: '', nombre: '', facultad: '', software_claves: [] })}
                query={query}
                setQuery={setQuery}
            />
            <div className="it-table-shell">
                <div className="overflow-x-auto">
                    <table className="it-table min-w-[900px]">
                        <thead>
                            <tr>
                                <th>Carrera</th>
                                <th>Facultad</th>
                                <th>Programas</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtradas.map((c) => (
                                <tr key={c.id} className="it-table-row">
                                    <td className="p-3 font-bold">{c.nombre}</td>
                                    <td className="p-3 text-sm">{c.facultad}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {c.software.map((s) => (
                                                <span key={s.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-slate-800">
                                                    {nombreSoftware(s.clave)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Acciones
                                            onEditar={() =>
                                                edicion.abrir({
                                                    id: c.id,
                                                    clave: c.clave,
                                                    nombre: c.nombre,
                                                    facultad: c.facultad,
                                                    software_claves: c.software.map((s) => s.clave),
                                                })
                                            }
                                            onEliminar={() =>
                                                void eliminarConfirmando(
                                                    `¿Eliminar ${c.nombre}?`,
                                                    `/api/admin/carreras/${c.id}`,
                                                    'Carrera eliminada.',
                                                    onCambio,
                                                    avisar,
                                                )
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtradas.length === 0 && <Vacio texto="No encontramos carreras con esa búsqueda." />}
            </div>

            <Modal
                open={!!b}
                title={b?.id ? 'Editar carrera' : 'Añadir carrera'}
                onClose={edicion.cerrar}
                footer={
                    <PieModal
                        guardando={edicion.guardando}
                        onCancelar={edicion.cerrar}
                        onGuardar={() => void edicion.guardar()}
                        texto="Guardar carrera"
                    />
                }
            >
                <ErrorForm texto={edicion.error} />
                {b && (
                    <div className="space-y-5">
                        <div className="it-form-grid">
                            <Campo label="Nombre">
                                <input
                                    className="it-form-input"
                                    value={b.nombre}
                                    onChange={(e) => edicion.setEditando({ ...b, nombre: e.target.value })}
                                />
                            </Campo>
                            <Campo label="Clave (sin espacios)">
                                <input
                                    className="it-form-input"
                                    value={b.clave}
                                    onChange={(e) => edicion.setEditando({ ...b, clave: e.target.value })}
                                />
                            </Campo>
                            <Campo label="Facultad">
                                <input
                                    className="it-form-input"
                                    value={b.facultad}
                                    onChange={(e) => edicion.setEditando({ ...b, facultad: e.target.value })}
                                />
                            </Campo>
                        </div>
                        <div>
                            <p className="text-sm font-bold">Programas que usa</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {software.map((s) => (
                                    <label key={s.id} className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold">
                                        <input
                                            type="checkbox"
                                            checked={b.software_claves.includes(s.clave)}
                                            onChange={(e) =>
                                                edicion.setEditando({
                                                    ...b,
                                                    software_claves: e.target.checked
                                                        ? [...b.software_claves, s.clave]
                                                        : b.software_claves.filter((k) => k !== s.clave),
                                                })
                                            }
                                        />
                                        {s.nombre}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </section>
    );
}

/* ============================================================
   CLIENTES (solo lectura)
============================================================ */

function PanelClientes({ clientes }: { clientes: Cliente[] | null }) {
    const [query, setQuery] = useState('');

    if (!clientes) return <LoadingPanel />;

    const filtrados = clientes.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(query.trim().toLowerCase()));

    return (
        <section className="space-y-5">
            <CatalogHeader
                icon={<Users className="h-5 w-5" />}
                title="Clientes"
                subtitle={`${clientes.length} clientes registrados. Los roles del personal se asignan en Usuarios.`}
                query={query}
                setQuery={setQuery}
            />
            <div className="it-table-shell">
                <div className="overflow-x-auto">
                    <table className="it-table min-w-[900px]">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Correo</th>
                                <th>Carrera u ocupación</th>
                                <th>Registrado</th>
                                <th className="text-right">Recomendaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((c) => (
                                <tr key={c.id} className="it-table-row">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--it-primary-soft)] font-bold text-[var(--it-primary)] dark:text-sky-300">
                                                {c.name.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="font-semibold">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-slate-500">{c.email}</td>
                                    <td className="p-3 text-sm text-slate-500">{[c.carrera, c.cargo].filter(Boolean).join(' · ') || '—'}</td>
                                    <td className="p-3 text-sm text-slate-500">
                                        {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-3 text-right">
                                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                                            {c.perfiles_count}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtrados.length === 0 && <Vacio texto={clientes.length === 0 ? 'Todavía no hay clientes.' : 'No se encontraron clientes.'} />}
            </div>
        </section>
    );
}
