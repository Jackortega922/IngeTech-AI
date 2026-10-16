import { LoadingPanel } from '@/components/loading-panel';
import { Estrellas } from '@/components/tienda/encuesta-satisfaccion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { estadoPedido, soles } from '@/lib/pedidos';
import type { EstadoPedido } from '@/types/flujo';
import {
    BookOpenText,
    CheckCircle2,
    ClipboardList,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    UserPlus,
    Users,
    UserX,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Respuestas de /api/admin/clientes (App\Http\Controllers\Api\Admin\ClienteController).
interface Registrado {
    id: number;
    nombre: string;
    email: string;
    telefono: string | null;
    ubicacion: string | null;
    registrado_at: string;
    verificado: boolean;
    acepta_ofertas: boolean;
    carrera: string | null;
    cargo: string | null;
    recomendaciones: number;
    compras: number;
    gasto: number;
    ultima_actividad: string | null;
    cuestionario: boolean;
}

interface Invitado {
    email: string;
    nombre: string;
    telefono: string | null;
    ubicacion: string | null;
    compras: number;
    gasto: number;
    ultima_compra: string;
}

interface Datos {
    resumen: { registrados: number; nuevos_30_dias: number; con_compras: number; solo_consultan: number; cuestionario: number; invitados: number };
    registrados: Registrado[];
    invitados: Invitado[];
}

interface PedidoFicha {
    codigo: string;
    comprobante: string | null;
    fecha: string;
    laptop: string | null;
    total: number;
    descuento: number;
    estado: EstadoPedido;
    // Encuesta después de la entrega (1 a 5), si la respondió.
    satisfaccion: number | null;
    telefono: string | null;
    ubicacion: string | null;
}

interface Ficha {
    nombre?: string;
    email: string;
    registrado_at?: string;
    verificado?: boolean;
    acepta_ofertas?: boolean;
    cuestionario?: boolean;
    consultas?: {
        fecha: string;
        carrera: string | null;
        cargo: string | null;
        presupuesto: number;
        mejor_opcion: string | null;
        compatibilidad: number | null;
    }[];
    pedidos: PedidoFicha[];
    reclamos: { numero: string; tipo: 'reclamo' | 'queja'; estado: 'pendiente' | 'respondido'; fecha: string }[];
}

type Filtro = 'todos' | 'compradores' | 'consultan' | 'nuevos' | 'invitados';

const FILTROS: { value: Filtro; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'compradores', label: 'Con compras' },
    { value: 'consultan', label: 'Solo consultan' },
    { value: 'nuevos', label: 'Nuevos (30 días)' },
    { value: 'invitados', label: 'Sin cuenta' },
];

const fecha = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const hace30Dias = () => Date.now() - 30 * 24 * 60 * 60 * 1000;

/**
 * Clientes (Administración): todos los clientes con lo que consultaron y compraron, y quienes
 * compraron sin cuenta. Al pulsar uno se abre su ficha con el detalle.
 */
export function PanelClientes() {
    const [datos, setDatos] = useState<Datos | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<Filtro>('todos');
    const [busqueda, setBusqueda] = useState('');
    const [abierto, setAbierto] = useState<{ url: string; nombre: string } | null>(null);

    useEffect(() => {
        fetch('/api/admin/clientes', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then(setDatos)
            .catch(() => setError('No se pudo cargar la lista de clientes.'));
    }, []);

    if (error) return <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>;
    if (!datos) return <LoadingPanel />;

    const { resumen } = datos;
    const q = busqueda.trim().toLowerCase();
    const coincide = (texto: string) => texto.toLowerCase().includes(q);
    const registrados = datos.registrados
        .filter((c) =>
            filtro === 'compradores'
                ? c.compras > 0
                : filtro === 'consultan'
                  ? c.compras === 0 && c.recomendaciones > 0
                  : filtro === 'nuevos'
                    ? new Date(c.registrado_at).getTime() >= hace30Dias()
                    : true,
        )
        .filter((c) => coincide(`${c.nombre} ${c.email} ${c.telefono ?? ''} ${c.carrera ?? ''}`));
    const invitados = datos.invitados.filter((c) => coincide(`${c.nombre} ${c.email} ${c.telefono ?? ''}`));

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Tarjeta icon={Users} label="Clientes registrados" valor={resumen.registrados} />
                <Tarjeta icon={UserPlus} label="Nuevos (30 días)" valor={resumen.nuevos_30_dias} />
                <Tarjeta
                    icon={ShoppingBag}
                    label="Ya compraron"
                    valor={resumen.con_compras}
                    detalle={pct(resumen.con_compras, resumen.registrados)}
                />
                <Tarjeta
                    icon={Sparkles}
                    label="Consultan, sin comprar"
                    valor={resumen.solo_consultan}
                    detalle="Pidieron recomendación y aún no compran"
                />
                <Tarjeta icon={UserX} label="Compraron sin cuenta" valor={resumen.invitados} detalle="Agrupados por su correo" />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                    {FILTROS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFiltro(f.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                                filtro === f.value ? 'border-transparent bg-[var(--it-primary)] text-white' : 'hover:bg-muted'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <label className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, correo o teléfono"
                        className="bg-card w-full rounded-xl border py-2 pr-3 pl-9 text-sm lg:w-80"
                    />
                </label>
            </div>

            <div className="it-table-shell">
                <div className="overflow-x-auto">
                    {filtro === 'invitados' ? (
                        <table className="it-table min-w-[900px]">
                            <thead>
                                <tr>
                                    <th>Comprador</th>
                                    <th>Teléfono</th>
                                    <th>Ubicación</th>
                                    <th className="text-right">Compras</th>
                                    <th className="text-right">Gasto</th>
                                    <th>Última compra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitados.map((c) => (
                                    <tr
                                        key={c.email}
                                        className="it-table-row cursor-pointer"
                                        onClick={() =>
                                            setAbierto({ url: `/api/admin/clientes/invitado?email=${encodeURIComponent(c.email)}`, nombre: c.nombre })
                                        }
                                    >
                                        <td className="p-3">
                                            <Persona nombre={c.nombre} email={c.email} />
                                        </td>
                                        <td className="p-3 text-sm text-slate-500">{c.telefono ?? '—'}</td>
                                        <td className="p-3 text-sm text-slate-500">{c.ubicacion ?? '—'}</td>
                                        <td className="p-3 text-right font-semibold">{c.compras}</td>
                                        <td className="p-3 text-right font-semibold">{soles(c.gasto)}</td>
                                        <td className="p-3 text-sm text-slate-500">{fecha(c.ultima_compra)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="it-table min-w-[1100px]">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Carrera u ocupación</th>
                                    <th className="text-right">Consultas IA</th>
                                    <th className="text-right">Compras</th>
                                    <th className="text-right">Gasto</th>
                                    <th>Cuestionario</th>
                                    <th>Registrado</th>
                                    <th>Última actividad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrados.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="it-table-row cursor-pointer"
                                        onClick={() => setAbierto({ url: `/api/admin/clientes/${c.id}`, nombre: c.nombre })}
                                    >
                                        <td className="p-3">
                                            <Persona nombre={c.nombre} email={c.email} />
                                        </td>
                                        <td className="p-3 text-sm text-slate-500">{[c.carrera, c.cargo].filter(Boolean).join(' · ') || '—'}</td>
                                        <td className="p-3 text-right font-semibold">{c.recomendaciones}</td>
                                        <td className="p-3 text-right font-semibold">{c.compras}</td>
                                        <td className="p-3 text-right font-semibold whitespace-nowrap">{c.gasto ? soles(c.gasto) : '—'}</td>
                                        <td className="p-3 text-sm">
                                            {c.cuestionario ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-4 w-4" /> Respondió
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">No</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-sm text-slate-500">{fecha(c.registrado_at)}</td>
                                        <td className="p-3 text-sm text-slate-500">{fecha(c.ultima_actividad)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {(filtro === 'invitados' ? invitados : registrados).length === 0 && (
                    <p className="p-8 text-center text-sm text-slate-500">No hay clientes que coincidan.</p>
                )}
            </div>

            <p className="text-muted-foreground flex items-start gap-2 text-xs leading-5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Datos para atender a los clientes (Ley 29733): solo los ve el personal con permiso. Lo que cada persona respondió en el cuestionario
                de bienvenida no se muestra aquí; las cifras de conjunto están en «Perfil de clientes».
            </p>

            <Dialog open={abierto !== null} onOpenChange={(v) => !v && setAbierto(null)}>
                {abierto && <FichaCliente key={abierto.url} url={abierto.url} nombre={abierto.nombre} />}
            </Dialog>
        </div>
    );
}

function FichaCliente({ url, nombre }: { url: string; nombre: string }) {
    const [ficha, setFicha] = useState<Ficha | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then(setFicha)
            .catch(() => setError(true));
    }, [url]);

    const contacto = ficha?.pedidos[0];

    return (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogTitle className="pr-8">{nombre}</DialogTitle>
            <DialogDescription>
                {ficha ? (
                    <>
                        {ficha.email}
                        {contacto?.telefono && ` · ${contacto.telefono}`}
                        {contacto?.ubicacion && ` · ${contacto.ubicacion}`}
                    </>
                ) : (
                    'Cargando ficha…'
                )}
            </DialogDescription>

            {error && <p className="text-sm text-rose-600">No se pudo cargar la ficha.</p>}
            {ficha && (
                <div className="space-y-5">
                    <div className="flex flex-wrap gap-2 text-xs">
                        {ficha.registrado_at ? (
                            <Etiqueta>Cliente desde {fecha(ficha.registrado_at)}</Etiqueta>
                        ) : (
                            <Etiqueta>Compró sin cuenta</Etiqueta>
                        )}
                        {ficha.verificado !== undefined && <Etiqueta>{ficha.verificado ? 'Correo verificado' : 'Correo sin verificar'}</Etiqueta>}
                        {ficha.acepta_ofertas !== undefined && (
                            <Etiqueta>{ficha.acepta_ofertas ? 'Acepta ofertas por correo' : 'No recibe ofertas'}</Etiqueta>
                        )}
                        {ficha.cuestionario !== undefined && (
                            <Etiqueta>{ficha.cuestionario ? 'Respondió el cuestionario' : 'Sin cuestionario'}</Etiqueta>
                        )}
                    </div>

                    {ficha.consultas && (
                        <Seccion icon={Sparkles} titulo={`Consultas a la IA (${ficha.consultas.length})`}>
                            {ficha.consultas.length === 0 ? (
                                <Nada texto="Todavía no pidió una recomendación." />
                            ) : (
                                ficha.consultas.map((c, i) => (
                                    <Fila
                                        key={i}
                                        izquierda={[c.carrera, c.cargo].filter(Boolean).join(' · ') || 'Sin carrera (uso general)'}
                                        detalle={`${fecha(c.fecha)} · presupuesto ${soles(c.presupuesto)}`}
                                        derecha={
                                            c.mejor_opcion ? `${c.mejor_opcion}${c.compatibilidad !== null ? ` · ${c.compatibilidad}%` : ''}` : '—'
                                        }
                                    />
                                ))
                            )}
                        </Seccion>
                    )}

                    <Seccion icon={ShoppingBag} titulo={`Pedidos (${ficha.pedidos.length})`}>
                        {ficha.pedidos.length === 0 ? (
                            <Nada texto="Todavía no compró." />
                        ) : (
                            ficha.pedidos.map((p) => {
                                const estado = estadoPedido(p.estado);

                                return (
                                    <Fila
                                        key={p.codigo}
                                        izquierda={p.laptop ?? 'Laptop'}
                                        detalle={`${p.codigo}${p.comprobante ? ` · ${p.comprobante}` : ''} · ${fecha(p.fecha)}${p.descuento > 0 ? ` · descuento ${soles(p.descuento)}` : ''}`}
                                        derecha={
                                            <span className="flex items-center gap-2">
                                                {p.satisfaccion !== null && <Estrellas valor={p.satisfaccion} chica />}
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${estado.clase}`}>
                                                    {estado.label}
                                                </span>
                                                {soles(p.total)}
                                            </span>
                                        }
                                    />
                                );
                            })
                        )}
                    </Seccion>

                    <Seccion icon={BookOpenText} titulo={`Libro de Reclamaciones (${ficha.reclamos.length})`}>
                        {ficha.reclamos.length === 0 ? (
                            <Nada texto="Sin reclamos ni quejas." />
                        ) : (
                            ficha.reclamos.map((r) => (
                                <Fila
                                    key={r.numero}
                                    izquierda={`${r.numero} · ${r.tipo === 'queja' ? 'Queja' : 'Reclamo'}`}
                                    detalle={fecha(r.fecha)}
                                    derecha={r.estado === 'respondido' ? 'Respondido' : 'Pendiente'}
                                />
                            ))
                        )}
                    </Seccion>
                </div>
            )}
        </DialogContent>
    );
}

const pct = (n: number, total: number) => (total === 0 ? undefined : `${Math.round((n / total) * 100)}% de los registrados`);

function Tarjeta({ icon: Icon, label, valor, detalle }: { icon: LucideIcon; label: string; valor: number; detalle?: string }) {
    return (
        <div className="bg-card rounded-2xl border p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-xs font-bold uppercase">
                <Icon className="h-4 w-4" /> {label}
            </p>
            <p className="mt-2 text-3xl font-black">{valor}</p>
            {detalle && <p className="text-muted-foreground mt-1 text-xs">{detalle}</p>}
        </div>
    );
}

function Persona({ nombre, email }: { nombre: string; email: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--it-primary-soft)] font-bold text-[var(--it-primary)] dark:text-sky-300">
                {nombre.charAt(0).toUpperCase()}
            </span>
            <span>
                <span className="block font-semibold">{nombre}</span>
                <span className="block text-xs text-slate-500">{email}</span>
            </span>
        </div>
    );
}

function Seccion({ icon: Icon, titulo, children }: { icon: LucideIcon; titulo: string; children: React.ReactNode }) {
    return (
        <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Icon className="h-4 w-4 text-cyan-500" /> {titulo}
            </h3>
            <div className="divide-y rounded-xl border">{children}</div>
        </section>
    );
}

function Fila({ izquierda, detalle, derecha }: { izquierda: string; detalle: string; derecha: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-semibold">{izquierda}</p>
                <p className="text-xs text-slate-500">{detalle}</p>
            </div>
            <div className="font-semibold whitespace-nowrap sm:text-right">{derecha}</div>
        </div>
    );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
    return <span className="bg-muted rounded-full px-2.5 py-1 font-semibold">{children}</span>;
}

function Nada({ texto }: { texto: string }) {
    return (
        <p className="flex items-center gap-2 p-3 text-sm text-slate-500">
            <ClipboardList className="h-4 w-4" /> {texto}
        </p>
    );
}
