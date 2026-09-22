import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Carrera, Catalogos, Cliente, DashboardAdmin, Laptop, Software } from '@/types/flujo';
import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Database,
    GraduationCap,
    Laptop as LaptopIcon,
    LayoutDashboard,
    Package,
    Plus,
    RefreshCw,
    Search,
    Settings2,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Administración', href: '/admin' }];

type Sub = 'dashboard' | 'clientes' | 'hardware' | 'software' | 'carreras';

const TABS = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'clientes', label: 'Estudiantes', icon: Users },
    { value: 'hardware', label: 'Equipos', icon: LaptopIcon },
    { value: 'software', label: 'Software', icon: Package },
    { value: 'carreras', label: 'Carreras', icon: GraduationCap },
] as const;

function tabInicial(): Sub {
    if (typeof window === 'undefined') return 'dashboard';

    const valor = new URLSearchParams(window.location.search).get('tab');

    return TABS.some((t) => t.value === valor) ? (valor as Sub) : 'dashboard';
}

async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let message = 'Ocurrió un error en la solicitud.';

        try {
            const data = await res.json();
            message = data.message ?? data.error ?? message;
        } catch {
            // La respuesta no era JSON.
        }

        throw new Error(message);
    }

    if (res.status === 204) {
        return null;
    }

    return res.json();
}

export default function AdminIndex() {
    const [sub, setSub] = useState<Sub>(tabInicial);
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [dashboard, setDashboard] = useState<DashboardAdmin | null>(null);
    const [clientes, setClientes] = useState<Cliente[] | null>(null);

    const [mensaje, setMensaje] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            setError(null);

            const [catalogosRes, dashboardRes, clientesRes] = await Promise.all([
                fetch('/api/catalogos', {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                }),
                fetch('/api/admin/dashboard', {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                }),
                fetch('/api/admin/clientes', {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                }),
            ]);

            if (!catalogosRes.ok || !dashboardRes.ok || !clientesRes.ok) {
                throw new Error('No se pudieron cargar los datos del panel.');
            }

            const [catalogosData, dashboardData, clientesData] = await Promise.all([catalogosRes.json(), dashboardRes.json(), clientesRes.json()]);

            setCatalogos(catalogosData);
            setDashboard(dashboardData);
            setClientes(clientesData);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    function avisar(msg: string) {
        setMensaje(msg);
        setTimeout(() => setMensaje(null), 3000);
    }

    function cambiarTab(s: Sub) {
        setSub(s);
        window.history.replaceState(null, '', `/admin?tab=${s}`);
    }

    const tituloTab = TABS.find((t) => t.value === sub)?.label ?? 'Administración';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Administración - IngeTech AI" />

            <div className="bg-background min-h-full flex-1">
                <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-4 md:p-6 lg:p-8">
                    {/* HEADER */}
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                                    <Database className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">IngeTech AI</p>
                                    <p className="text-muted-foreground text-xs">Sistema inteligente de recomendación</p>
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Panel de administración</h1>

                            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                                Gestiona el catálogo tecnológico, estudiantes, software y carreras utilizadas por el sistema.
                            </p>
                        </div>

                        <button
                            onClick={() => void cargar()}
                            disabled={cargando}
                            className="bg-card hover:bg-muted inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>

                    {/* MENSAJES */}
                    {mensaje && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <span>{mensaje}</span>
                            <button className="ml-auto" onClick={() => setMensaje(null)}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                            <button
                                onClick={() => void cargar()}
                                className="ml-auto rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-semibold hover:bg-rose-500/10"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* NAVEGACION */}
                    <div className="bg-card rounded-2xl border p-2 shadow-sm">
                        <div className="flex gap-2 overflow-x-auto">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const activo = sub === tab.value;

                                return (
                                    <button
                                        key={tab.value}
                                        onClick={() => cambiarTab(tab.value)}
                                        className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                            activo
                                                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TITULO DE SECCION */}
                    {sub !== 'dashboard' && (
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">{tituloTab}</h2>
                                <p className="text-muted-foreground text-sm">Administra la información de esta sección.</p>
                            </div>
                        </div>
                    )}

                    {/* CONTENIDO */}
                    {!catalogos || cargando ? (
                        <LoadingPanel />
                    ) : sub === 'dashboard' ? (
                        <PanelDashboard dashboard={dashboard} carreras={catalogos.carreras} />
                    ) : sub === 'clientes' ? (
                        <PanelClientes clientes={clientes} />
                    ) : sub === 'hardware' ? (
                        <TablaHardware equipos={catalogos.hardware} onCambio={cargar} avisar={avisar} />
                    ) : sub === 'software' ? (
                        <TablaSoftware items={catalogos.software} onCambio={cargar} avisar={avisar} />
                    ) : (
                        <TablaCarreras carreras={catalogos.carreras} software={catalogos.software} onCambio={cargar} avisar={avisar} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingPanel() {
    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-muted/40 h-32 animate-pulse rounded-2xl border" />
                ))}
            </div>

            <div className="bg-muted/40 h-96 animate-pulse rounded-2xl border" />
        </div>
    );
}

/* ============================================================
   HARDWARE
============================================================ */

function TablaHardware({ equipos, onCambio, avisar }: { equipos: Laptop[]; onCambio: () => void; avisar: (m: string) => void }) {
    const [filas, setFilas] = useState<Laptop[]>(equipos);

    const [busqueda, setBusqueda] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState('todos');

    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setFilas(equipos);
    }, [equipos]);

    function set(i: number, campo: keyof Laptop, valor: unknown) {
        setFilas((f) =>
            f.map((r, idx) =>
                idx === i
                    ? {
                          ...r,
                          [campo]: valor,
                      }
                    : r,
            ),
        );
    }

    const equiposFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return filas.filter((f) => {
            const contenido = `${f.marca} ${f.modelo} ${f.cpu} ${f.gpu}`.toLowerCase();

            const coincideBusqueda = !texto || contenido.includes(texto);

            const coincideTipo = tipoFiltro === 'todos' || f.tipo === tipoFiltro;

            return coincideBusqueda && coincideTipo;
        });
    }, [filas, busqueda, tipoFiltro]);

    async function guardarTodo() {
        try {
            setGuardando(true);

            for (const f of filas) {
                await api(`/api/admin/hardware/${f.id}`, 'PUT', {
                    marca: f.marca,
                    modelo: f.modelo,
                    descripcion: f.descripcion,
                    tipo: f.tipo,
                    cpu: f.cpu,
                    rendimiento_score: Number(f.rendimiento_score),
                    ram_gb: Number(f.ram_gb),
                    ram_ampliable_gb: f.ram_ampliable_gb ? Number(f.ram_ampliable_gb) : null,
                    almacenamiento_gb: Number(f.almacenamiento_gb),
                    almacenamiento_tipo: f.almacenamiento_tipo,
                    gpu: f.gpu,
                    gpu_dedicada: f.gpu_dedicada,
                    bateria_horas: f.bateria_horas ? Number(f.bateria_horas) : null,
                    precio_soles: Number(f.precio_soles),
                    tienda: f.tienda,
                });
            }

            avisar('Cambios guardados correctamente.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.');
        } finally {
            setGuardando(false);
        }
    }

    async function agregar() {
        try {
            await api('/api/admin/hardware', 'POST', {
                marca: 'Nueva',
                modelo: 'Nuevo equipo',
                descripcion: '',
                tipo: 'laptop',
                cpu: '—',
                rendimiento_score: 50,
                ram_gb: 8,
                almacenamiento_gb: 512,
                almacenamiento_tipo: 'SSD',
                gpu: '—',
                gpu_dedicada: false,
                bateria_horas: 8,
                precio_soles: 2000,
                tienda: '—',
            });

            avisar('Nuevo equipo agregado.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo agregar el equipo.');
        }
    }

    async function eliminar(id: number) {
        const confirmar = window.confirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.');

        if (!confirmar) return;

        try {
            await api(`/api/admin/hardware/${id}`, 'DELETE');

            avisar('Equipo eliminado correctamente.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo eliminar el equipo.');
        }
    }

    return (
        <div className="space-y-5">
            {/* HEADER */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <LaptopIcon className="h-5 w-5 text-cyan-500" />
                        <h2 className="text-xl font-bold">Catálogo de equipos</h2>
                    </div>

                    <p className="text-muted-foreground mt-1 text-sm">{filas.length} equipos registrados en el catálogo.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={agregar}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-600"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo equipo
                    </button>

                    <button
                        onClick={guardarTodo}
                        disabled={guardando}
                        className="bg-card hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm md:flex-row">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

                    <input
                        className="bg-background w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                        placeholder="Buscar por marca, modelo, CPU o GPU..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <select
                    className="bg-background rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-cyan-500"
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                >
                    <option value="todos">Todos los equipos</option>
                    <option value="laptop">Laptops</option>
                    <option value="escritorio">Escritorio</option>
                </select>

                <div className="text-muted-foreground flex items-center justify-center rounded-xl border px-4 text-sm">
                    {equiposFiltrados.length} resultados
                </div>
            </div>

            {/* TABLA */}
            <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                            <tr>
                                <th className="px-4 py-3">Equipo</th>
                                <th className="px-4 py-3">CPU</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">RAM</th>
                                <th className="px-4 py-3">Almacenamiento</th>
                                <th className="px-4 py-3">GPU</th>
                                <th className="px-4 py-3">Precio</th>
                                <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {equiposFiltrados.map((f) => {
                                const i = filas.findIndex((x) => x.id === f.id);

                                return (
                                    <tr key={f.id} className="hover:bg-muted/30 border-t transition">
                                        <td className="p-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
                                                    <LaptopIcon className="h-5 w-5" />
                                                </div>

                                                <div className="min-w-[210px]">
                                                    <input
                                                        className="campo bg-background w-full rounded-lg border px-2 py-1 font-semibold"
                                                        value={f.marca}
                                                        onChange={(e) => set(i, 'marca', e.target.value)}
                                                    />

                                                    <input
                                                        className="campo bg-background text-muted-foreground mt-1 w-full rounded-lg border px-2 py-1 text-xs"
                                                        value={f.modelo}
                                                        onChange={(e) => set(i, 'modelo', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="campo bg-background w-48 rounded-lg border px-2 py-2"
                                                value={f.cpu}
                                                onChange={(e) => set(i, 'cpu', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="campo bg-background w-20 rounded-lg border px-2 py-2"
                                                type="number"
                                                min="0"
                                                value={f.rendimiento_score ?? 0}
                                                onChange={(e) => set(i, 'rendimiento_score', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    className="campo bg-background w-16 rounded-lg border px-2 py-2"
                                                    type="number"
                                                    min="1"
                                                    value={f.ram_gb}
                                                    onChange={(e) => set(i, 'ram_gb', e.target.value)}
                                                />
                                                <span className="text-muted-foreground text-xs">GB</span>
                                            </div>
                                        </td>

                                        <td className="p-2">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    className="campo bg-background w-20 rounded-lg border px-2 py-2"
                                                    type="number"
                                                    min="1"
                                                    value={f.almacenamiento_gb}
                                                    onChange={(e) => set(i, 'almacenamiento_gb', e.target.value)}
                                                />
                                                <span className="text-muted-foreground text-xs">GB</span>
                                            </div>
                                        </td>

                                        <td className="p-2">
                                            <div className="space-y-1">
                                                <input
                                                    className="campo bg-background w-40 rounded-lg border px-2 py-2"
                                                    value={f.gpu ?? ''}
                                                    onChange={(e) => set(i, 'gpu', e.target.value)}
                                                />

                                                <select
                                                    className="bg-background w-40 rounded-lg border px-2 py-1 text-xs"
                                                    value={String(f.gpu_dedicada)}
                                                    onChange={(e) => set(i, 'gpu_dedicada', e.target.value === 'true')}
                                                >
                                                    <option value="true">GPU dedicada</option>
                                                    <option value="false">GPU integrada</option>
                                                </select>
                                            </div>
                                        </td>

                                        <td className="p-2">
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground text-xs">S/</span>

                                                <input
                                                    className="campo bg-background w-24 rounded-lg border px-2 py-2 font-semibold"
                                                    type="number"
                                                    min="0"
                                                    value={Number(f.precio_soles)}
                                                    onChange={(e) => set(i, 'precio_soles', e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        <td className="p-2 text-right">
                                            <button
                                                title="Eliminar equipo"
                                                onClick={() => void eliminar(f.id)}
                                                className="text-muted-foreground rounded-lg p-2 transition hover:bg-rose-500/10 hover:text-rose-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {equiposFiltrados.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <Search className="text-muted-foreground mb-3 h-8 w-8" />
                        <p className="font-semibold">No se encontraron equipos</p>
                        <p className="text-muted-foreground mt-1 text-sm">Prueba con otro término de búsqueda.</p>
                    </div>
                )}
            </div>

            {/* DESCRIPCIONES */}
            <div className="bg-card rounded-2xl border p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-cyan-500" />
                    <div>
                        <h3 className="font-bold">Descripciones del catálogo</h3>
                        <p className="text-muted-foreground text-xs">Texto utilizado para presentar cada equipo.</p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    {filas.map((f, i) => (
                        <label key={f.id} className="block">
                            <span className="text-muted-foreground mb-1 block text-xs font-medium">
                                {f.marca} {f.modelo}
                            </span>

                            <input
                                className="campo bg-background w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                                value={f.descripcion ?? ''}
                                onChange={(e) => set(i, 'descripcion', e.target.value)}
                                placeholder="Descripción corta del equipo..."
                            />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   SOFTWARE
============================================================ */

function TablaSoftware({ items, onCambio, avisar }: { items: Software[]; onCambio: () => void; avisar: (m: string) => void }) {
    const [filas, setFilas] = useState<Software[]>(items);
    const [busqueda, setBusqueda] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setFilas(items);
    }, [items]);

    function set(i: number, campo: keyof Software, valor: unknown) {
        setFilas((f) =>
            f.map((r, idx) =>
                idx === i
                    ? {
                          ...r,
                          [campo]: valor,
                      }
                    : r,
            ),
        );
    }

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return filas;

        return filas.filter((f) => `${f.nombre} ${f.categoria} ${f.clave}`.toLowerCase().includes(texto));
    }, [filas, busqueda]);

    async function guardarTodo() {
        try {
            setGuardando(true);

            for (const f of filas) {
                await api(`/api/admin/software/${f.id}`, 'PUT', {
                    clave: f.clave,
                    nombre: f.nombre,
                    descripcion: f.descripcion,
                    categoria: f.categoria,
                    min_ram_gb: Number(f.min_ram_gb),
                    min_cpu_score: Number(f.min_cpu_score),
                    min_gpu_dedicada: f.min_gpu_dedicada,
                    rec_ram_gb: Number(f.rec_ram_gb),
                    rec_cpu_score: Number(f.rec_cpu_score),
                    rec_gpu_dedicada: f.rec_gpu_dedicada,
                });
            }

            avisar('Software actualizado correctamente.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.');
        } finally {
            setGuardando(false);
        }
    }

    async function agregar() {
        try {
            await api('/api/admin/software', 'POST', {
                clave: `nuevo_${Date.now()}`,
                nombre: 'Nuevo software',
                descripcion: '',
                categoria: 'General',
                min_ram_gb: 4,
                min_cpu_score: 20,
                min_gpu_dedicada: false,
                rec_ram_gb: 8,
                rec_cpu_score: 30,
                rec_gpu_dedicada: false,
            });

            avisar('Nuevo software agregado.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo agregar el software.');
        }
    }

    async function eliminar(id: number) {
        const confirmar = window.confirm('¿Estás seguro de eliminar este software?');

        if (!confirmar) return;

        try {
            await api(`/api/admin/software/${id}`, 'DELETE');

            avisar('Software eliminado correctamente.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo eliminar el software.');
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-cyan-500" />
                        <h2 className="text-xl font-bold">Catálogo de software</h2>
                    </div>

                    <p className="text-muted-foreground mt-1 text-sm">Configura los requisitos mínimos y recomendados.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={agregar}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-600"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo software
                    </button>

                    <button
                        onClick={guardarTodo}
                        disabled={guardando}
                        className="hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

                <input
                    className="bg-card w-full rounded-xl border py-3 pr-4 pl-10 text-sm shadow-sm outline-none focus:border-cyan-500"
                    placeholder="Buscar software, categoría o clave..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                            <tr>
                                <th className="px-4 py-3">Software</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3">RAM mínima</th>
                                <th className="px-4 py-3">CPU mínima</th>
                                <th className="px-4 py-3">RAM recomendada</th>
                                <th className="px-4 py-3">CPU recomendada</th>
                                <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtrados.map((f) => {
                                const i = filas.findIndex((x) => x.id === f.id);

                                return (
                                    <tr key={f.id} className="hover:bg-muted/30 border-t transition">
                                        <td className="p-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                                                    <Package className="h-5 w-5" />
                                                </div>

                                                <div className="min-w-[220px]">
                                                    <input
                                                        className="bg-background w-full rounded-lg border px-2 py-1 font-semibold"
                                                        value={f.nombre}
                                                        onChange={(e) => set(i, 'nombre', e.target.value)}
                                                    />

                                                    <p className="text-muted-foreground mt-1 text-xs">{f.clave}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="bg-background w-36 rounded-lg border px-2 py-2"
                                                value={f.categoria}
                                                onChange={(e) => set(i, 'categoria', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="bg-background w-20 rounded-lg border px-2 py-2"
                                                type="number"
                                                value={f.min_ram_gb}
                                                onChange={(e) => set(i, 'min_ram_gb', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="bg-background w-20 rounded-lg border px-2 py-2"
                                                type="number"
                                                value={f.min_cpu_score}
                                                onChange={(e) => set(i, 'min_cpu_score', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="bg-background w-20 rounded-lg border px-2 py-2"
                                                type="number"
                                                value={f.rec_ram_gb}
                                                onChange={(e) => set(i, 'rec_ram_gb', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="bg-background w-20 rounded-lg border px-2 py-2"
                                                type="number"
                                                value={f.rec_cpu_score}
                                                onChange={(e) => set(i, 'rec_cpu_score', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2 text-right">
                                            <button
                                                title="Eliminar software"
                                                onClick={() => void eliminar(f.id)}
                                                className="text-muted-foreground rounded-lg p-2 transition hover:bg-rose-500/10 hover:text-rose-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filtrados.length === 0 && <div className="text-muted-foreground p-12 text-center text-sm">No se encontró software.</div>}
            </div>

            <div className="bg-card rounded-2xl border p-5 shadow-sm">
                <h3 className="mb-4 font-bold">Descripciones</h3>

                <div className="grid gap-3 md:grid-cols-2">
                    {filas.map((f, i) => (
                        <label key={f.id} className="block">
                            <span className="text-muted-foreground mb-1 block text-xs font-medium">{f.nombre}</span>

                            <input
                                className="bg-background w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                                value={f.descripcion ?? ''}
                                onChange={(e) => set(i, 'descripcion', e.target.value)}
                                placeholder="Descripción..."
                            />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   CARRERAS
============================================================ */

function TablaCarreras({
    carreras,
    software,
    onCambio,
    avisar,
}: {
    carreras: Carrera[];
    software: Software[];
    onCambio: () => void;
    avisar: (m: string) => void;
}) {
    const [filas, setFilas] = useState(
        carreras.map((c) => ({
            ...c,
            software_claves: c.software.map((s) => software.find((x) => x.id === s.id)?.clave ?? '').join(', '),
        })),
    );

    const [busqueda, setBusqueda] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setFilas(
            carreras.map((c) => ({
                ...c,
                software_claves: c.software.map((s) => software.find((x) => x.id === s.id)?.clave ?? '').join(', '),
            })),
        );
    }, [carreras, software]);

    function set(i: number, campo: string, valor: string) {
        setFilas((f) =>
            f.map((r, idx) =>
                idx === i
                    ? {
                          ...r,
                          [campo]: valor,
                      }
                    : r,
            ),
        );
    }

    const filtradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return filas;

        return filas.filter((f) => `${f.nombre} ${f.facultad} ${f.clave}`.toLowerCase().includes(texto));
    }, [filas, busqueda]);

    async function guardarTodo() {
        try {
            setGuardando(true);

            for (const f of filas) {
                await api(`/api/admin/carreras/${f.id}`, 'PUT', {
                    clave: f.clave,
                    nombre: f.nombre,
                    facultad: f.facultad,
                    software_claves: f.software_claves
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                });
            }

            avisar('Carreras actualizadas correctamente.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudieron guardar las carreras.');
        } finally {
            setGuardando(false);
        }
    }

    async function agregar() {
        try {
            await api('/api/admin/carreras', 'POST', {
                clave: `nueva_${Date.now()}`,
                nombre: 'Nueva carrera',
                facultad: '—',
                software_claves: [],
            });

            avisar('Nueva carrera agregada.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo agregar la carrera.');
        }
    }

    async function eliminar(id: number) {
        const confirmar = window.confirm('¿Estás seguro de eliminar esta carrera?');

        if (!confirmar) return;

        try {
            await api(`/api/admin/carreras/${id}`, 'DELETE');

            avisar('Carrera eliminada correctamente.');

            onCambio();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo eliminar la carrera.');
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-cyan-500" />
                        <h2 className="text-xl font-bold">Carreras</h2>
                    </div>

                    <p className="text-muted-foreground mt-1 text-sm">Relaciona las carreras con el software utilizado.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={agregar}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-600"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva carrera
                    </button>

                    <button
                        onClick={guardarTodo}
                        disabled={guardando}
                        className="hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

                <input
                    className="bg-card w-full rounded-xl border py-3 pr-4 pl-10 text-sm shadow-sm outline-none focus:border-cyan-500"
                    placeholder="Buscar carrera o facultad..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                            <tr>
                                <th className="px-4 py-3">Carrera</th>
                                <th className="px-4 py-3">Facultad</th>
                                <th className="px-4 py-3">Software relacionado</th>
                                <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtradas.map((f) => {
                                const i = filas.findIndex((x) => x.id === f.id);

                                return (
                                    <tr key={f.id} className="hover:bg-muted/30 border-t transition">
                                        <td className="p-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                                    <GraduationCap className="h-5 w-5" />
                                                </div>

                                                <input
                                                    className="bg-background w-72 rounded-lg border px-3 py-2 font-semibold"
                                                    value={f.nombre}
                                                    onChange={(e) => set(i, 'nombre', e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="bg-background w-52 rounded-lg border px-3 py-2"
                                                value={f.facultad}
                                                onChange={(e) => set(i, 'facultad', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-2">
                                            <input
                                                className="bg-background w-full rounded-lg border px-3 py-2"
                                                value={f.software_claves}
                                                onChange={(e) => set(i, 'software_claves', e.target.value)}
                                                placeholder="autocad, matlab, ..."
                                            />
                                        </td>

                                        <td className="p-2 text-right">
                                            <button
                                                title="Eliminar carrera"
                                                onClick={() => void eliminar(f.id)}
                                                className="text-muted-foreground rounded-lg p-2 transition hover:bg-rose-500/10 hover:text-rose-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filtradas.length === 0 && <div className="text-muted-foreground p-12 text-center text-sm">No se encontraron carreras.</div>}
            </div>

            <div className="bg-card rounded-2xl border p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-cyan-500" />
                    <div>
                        <h3 className="font-bold">Claves de software disponibles</h3>
                        <p className="text-muted-foreground text-xs">Usa estas claves al relacionar software con una carrera.</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {software.map((s) => (
                        <span key={s.id} className="bg-muted/40 rounded-full border px-3 py-1.5 text-xs font-medium">
                            {s.clave}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   DASHBOARD
============================================================ */

function PanelDashboard({ dashboard, carreras }: { dashboard: DashboardAdmin | null; carreras: Carrera[] }) {
    if (!dashboard) {
        return <LoadingPanel />;
    }

    const kpis = [
        {
            label: 'Equipos',
            valor: dashboard.total_equipos,
            descripcion: 'Equipos disponibles',
            icon: LaptopIcon,
        },
        {
            label: 'Software',
            valor: dashboard.total_software,
            descripcion: 'Programas registrados',
            icon: Package,
        },
        {
            label: 'Carreras',
            valor: dashboard.total_carreras,
            descripcion: 'Carreras configuradas',
            icon: GraduationCap,
        },
        {
            label: 'Estudiantes',
            valor: dashboard.total_usuarios,
            descripcion: 'Usuarios registrados',
            icon: Users,
        },
        {
            label: 'Consultas',
            valor: dashboard.total_consultas,
            descripcion: 'Recomendaciones generadas',
            icon: BarChart3,
        },
    ];

    const hayConsultas = dashboard.total_consultas > 0;

    const maxCarrera = hayConsultas ? Math.max(...Object.values(dashboard.por_carrera), 1) : 1;

    const maxBucket = hayConsultas ? Math.max(...Object.values(dashboard.por_presupuesto), 1) : 1;

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {kpis.map((k) => {
                    const Icon = k.icon;

                    return (
                        <div
                            key={k.label}
                            className="group bg-card rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{k.label}</p>

                                    <p className="mt-2 text-3xl font-bold">{k.valor}</p>
                                </div>

                                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-600 dark:text-cyan-400">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>

                            <p className="text-muted-foreground mt-3 text-xs">{k.descripcion}</p>
                        </div>
                    );
                })}
            </div>

            {!hayConsultas ? (
                <div className="bg-card rounded-2xl border p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
                        <BarChart3 className="h-7 w-7" />
                    </div>

                    <h3 className="mt-4 font-bold">Aún no hay consultas registradas</h3>

                    <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
                        Cuando los estudiantes utilicen el recomendador, aquí aparecerán estadísticas del sistema.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* CARRERAS */}
                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">Consultas por carrera</h3>
                                <p className="text-muted-foreground text-xs">Distribución de recomendaciones</p>
                            </div>

                            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-600">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(dashboard.por_carrera)
                                .sort((a, b) => b[1] - a[1])
                                .map(([clave, v]) => (
                                    <div key={clave}>
                                        <div className="mb-1.5 flex justify-between text-xs">
                                            <span className="font-medium">{carreras.find((c) => c.clave === clave)?.nombre ?? clave}</span>

                                            <span className="font-bold text-cyan-600">{v}</span>
                                        </div>

                                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                                            <div
                                                className="h-full rounded-full bg-cyan-500 transition-all"
                                                style={{
                                                    width: `${(v / maxCarrera) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* PRESUPUESTO */}
                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">Rangos de presupuesto</h3>
                                <p className="text-muted-foreground text-xs">Presupuestos más consultados</p>
                            </div>

                            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(dashboard.por_presupuesto).map(([k, v]) => (
                                <div key={k}>
                                    <div className="mb-1.5 flex justify-between text-xs">
                                        <span className="font-medium">{k}</span>

                                        <span className="font-bold text-violet-600">{v}</span>
                                    </div>

                                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                                        <div
                                            className="h-full rounded-full bg-violet-500 transition-all"
                                            style={{
                                                width: `${(v / maxBucket) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   CLIENTES
============================================================ */

function PanelClientes({ clientes }: { clientes: Cliente[] | null }) {
    const [busqueda, setBusqueda] = useState('');

    if (!clientes) {
        return <LoadingPanel />;
    }

    const filtrados = clientes.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(busqueda.trim().toLowerCase()));

    return (
        <div className="space-y-5">
            {/* HEADER */}
            <div className="bg-card rounded-2xl border p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-cyan-500" />
                            <h2 className="text-xl font-bold">Estudiantes registrados</h2>
                        </div>

                        <p className="text-muted-foreground mt-1 text-sm">Usuarios que utilizan el sistema de recomendaciones.</p>
                    </div>

                    <div className="rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-600">{clientes.length} registrados</div>
                </div>
            </div>

            {/* BUSCADOR */}
            <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

                <input
                    className="bg-card w-full rounded-xl border py-3 pr-4 pl-10 text-sm shadow-sm outline-none focus:border-cyan-500"
                    placeholder="Buscar estudiante por nombre o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {clientes.length === 0 ? (
                <div className="bg-card rounded-2xl border p-12 text-center shadow-sm">
                    <Users className="text-muted-foreground mx-auto h-9 w-9" />

                    <h3 className="mt-4 font-bold">Todavía no hay estudiantes</h3>

                    <p className="text-muted-foreground mt-1 text-sm">Los usuarios registrados aparecerán aquí.</p>
                </div>
            ) : (
                <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-5 py-4">Estudiante</th>
                                    <th className="px-5 py-4">Email</th>
                                    <th className="px-5 py-4">Registrado</th>
                                    <th className="px-5 py-4">Recomendaciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtrados.map((c) => (
                                    <tr key={c.id} className="hover:bg-muted/30 border-t transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 font-bold text-cyan-600">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>

                                                <span className="font-semibold">{c.name}</span>
                                            </div>
                                        </td>

                                        <td className="text-muted-foreground px-5 py-4">{c.email}</td>

                                        <td className="text-muted-foreground px-5 py-4">
                                            {new Date(c.created_at).toLocaleDateString('es-PE', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                                                {c.perfiles_count}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filtrados.length === 0 && <div className="text-muted-foreground p-12 text-center text-sm">No se encontraron estudiantes.</div>}
                </div>
            )}
        </div>
    );
}
