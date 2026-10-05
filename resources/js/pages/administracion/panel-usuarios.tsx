import { LoadingPanel } from '@/components/loading-panel';
import { NOMBRE_ROL } from '@/lib/roles';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Persona {
    id: number;
    name: string;
    email: string;
    rol: string;
}

interface Rol {
    valor: string;
    nombre: string;
    permisos: string[];
}

const NOMBRE_PERMISO: Record<string, string> = {
    dashboard: 'Dashboard',
    contabilidad: 'Contabilidad',
    clientes: 'Clientes',
    pedidos: 'Ver pedidos',
    'pedidos.editar': 'Cambiar estado de pedidos',
    inventario: 'Inventario',
    reclamos: 'Reclamos',
    hardware: 'Equipos',
    software: 'Software',
    carreras: 'Carreras',
    usuarios: 'Usuarios y roles',
};

async function asignar(email: string, rol: string): Promise<Persona> {
    const res = await fetch('/api/admin/usuarios/rol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, rol }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const primero = data.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
        throw new Error(primero ?? data.message ?? 'No se pudo asignar el rol.');
    }
    return data;
}

// Usuarios y roles (Administración, solo el administrador). La persona crea su cuenta en el sitio
// y aquí se le asigna un rol con su correo; para quitarle el acceso se le devuelve "Cliente".
export function PanelUsuarios({ avisar }: { avisar: (msg: string) => void }) {
    const yo = usePage<SharedData>().props.auth.user;
    const [personal, setPersonal] = useState<Persona[] | null>(null);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [email, setEmail] = useState('');
    const [rol, setRol] = useState('ventas');
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        const res = await fetch('/api/admin/usuarios', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (!res.ok) {
            setError('No se pudo cargar el personal.');
            return;
        }
        const data = await res.json();
        setPersonal(data.personal);
        setRoles(data.roles);
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    async function cambiar(correo: string, nuevo: string) {
        setGuardando(true);
        setError(null);
        try {
            const p = await asignar(correo, nuevo);
            avisar(nuevo === 'cliente' ? `${p.name} ya no es parte del personal.` : `${p.name} ahora tiene el rol ${NOMBRE_ROL[nuevo]}.`);
            setEmail('');
            await cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo asignar el rol.');
        } finally {
            setGuardando(false);
        }
    }

    if (!personal) return error ? <p className="text-sm text-rose-600">{error}</p> : <LoadingPanel />;

    return (
        <div className="space-y-6">
            <section className="bg-card rounded-2xl border p-5">
                <h3 className="flex items-center gap-2 font-bold">
                    <UserPlus className="h-4 w-4 text-cyan-500" /> Asignar un rol
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                    La persona primero crea su cuenta en el sitio. Luego escribe aquí su correo y elige su rol.
                </p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void cambiar(email, rol);
                    }}
                    className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]"
                >
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="bg-background h-10 rounded-xl border px-3 text-sm"
                    />
                    <select value={rol} onChange={(e) => setRol(e.target.value)} className="bg-background h-10 rounded-xl border px-3 text-sm">
                        {roles
                            .filter((r) => r.valor !== 'cliente')
                            .map((r) => (
                                <option key={r.valor} value={r.valor}>
                                    {r.nombre}
                                </option>
                            ))}
                    </select>
                    <button
                        type="submit"
                        disabled={guardando}
                        className="h-10 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        Asignar
                    </button>
                </form>
                {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            </section>

            <section className="bg-card overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Correo</th>
                            <th className="px-4 py-3">Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {personal.map((p) => (
                            <tr key={p.id} className="border-t">
                                <td className="px-4 py-3 font-semibold">{p.name}</td>
                                <td className="text-muted-foreground px-4 py-3">{p.email}</td>
                                <td className="px-4 py-3">
                                    {p.id === yo?.id ? (
                                        <span className="text-muted-foreground text-xs">{NOMBRE_ROL[p.rol]} (tú)</span>
                                    ) : (
                                        <select
                                            value={p.rol}
                                            disabled={guardando}
                                            onChange={(e) => void cambiar(p.email, e.target.value)}
                                            aria-label={`Rol de ${p.name}`}
                                            className="bg-background h-9 rounded-lg border px-2 text-sm"
                                        >
                                            {roles.map((r) => (
                                                <option key={r.valor} value={r.valor}>
                                                    {r.valor === 'cliente' ? 'Quitar acceso (cliente)' : r.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                {roles
                    .filter((r) => r.valor !== 'cliente')
                    .map((r) => (
                        <article key={r.valor} className="bg-card rounded-2xl border p-5">
                            <h3 className="flex items-center gap-2 font-bold">
                                <ShieldCheck className="h-4 w-4 text-cyan-500" /> {r.nombre}
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {r.permisos.map((p) => (
                                    <span key={p} className="bg-muted rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                                        {NOMBRE_PERMISO[p] ?? p}
                                    </span>
                                ))}
                            </div>
                        </article>
                    ))}
            </section>
        </div>
    );
}
