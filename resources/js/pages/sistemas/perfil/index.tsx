import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import { flujoStorage } from '@/lib/flujo-storage';
import type { Catalogos, Necesidad, NivelExperiencia, Perfil, Portabilidad, RespuestaMotor, TipoUsuario } from '@/types/flujo';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Briefcase, ChevronDown, GraduationCap, Loader2, Palette, Sparkles, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PORTABILIDAD_OPCIONES: { value: Portabilidad; label: string }[] = [
    { value: 'laptop', label: 'Laptop' },
    { value: 'escritorio', label: 'PC de escritorio' },
    { value: 'cualquiera', label: 'Cualquiera' },
];

const NIVEL_OPCIONES: { value: NivelExperiencia; label: string; desc: string }[] = [
    { value: 'basico', label: 'Básico', desc: 'Uso cotidiano, navegación y ofimática.' },
    { value: 'intermedio', label: 'Intermedio', desc: 'Ya hago proyectos más exigentes.' },
    { value: 'avanzado', label: 'Avanzado', desc: 'Trabajo con cargas pesadas / profesional.' },
];

const TIPO_USUARIO_OPCIONES: { value: TipoUsuario; label: string; icon: typeof Users }[] = [
    { value: 'estudiante', label: 'Estudiante', icon: GraduationCap },
    { value: 'profesional', label: 'Profesional', icon: Briefcase },
    { value: 'gamer', label: 'Gamer', icon: Sparkles },
    { value: 'creador', label: 'Diseño / Creación', icon: Palette },
    { value: 'oficina', label: 'Oficina / Trámites', icon: Users },
    { value: 'otro', label: 'Otro', icon: Users },
];

const PERFIL_INICIAL: Perfil = {
    carrera_clave: '',
    tipo_usuario: '',
    nivel_experiencia: '',
    actividades: [],
    software_ids: [],
    presupuesto_soles: 3500,
    portabilidad: 'cualquiera',
};

/** Calcula los requisitos estimados a partir del software y actividades elegidas —
 *  ya no depende de una carrera para funcionar. */
function calcularNecesidad(catalogos: Catalogos | null, perfil: Perfil): Necesidad | null {
    if (!catalogos) return null;

    let ram = 4;
    let cpu = 15;
    let gpu = false;

    perfil.software_ids.forEach((id) => {
        const sw = catalogos.software.find((s) => s.id === id);
        if (!sw) return;
        ram = Math.max(ram, sw.min_ram_gb);
        cpu = Math.max(cpu, sw.min_cpu_score);
        gpu = gpu || sw.min_gpu_dedicada;
    });

    perfil.actividades.forEach((clave) => {
        const act = catalogos.actividades.find((a) => a.clave === clave);
        if (!act) return;
        ram += act.extra_ram_gb;
        cpu += act.extra_cpu_score;
        gpu = gpu || act.requiere_gpu;
    });

    const multiplicador = perfil.nivel_experiencia === 'avanzado' ? 1.25 : perfil.nivel_experiencia === 'intermedio' ? 1.1 : 1;
    cpu = Math.min(100, Math.round(cpu * multiplicador));
    ram = Math.min(64, ram);

    return { ram_gb: ram, cpu_score: cpu, gpu_dedicada: gpu, nivel: 'min' };
}

export default function PerfilIndex() {
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mostrarCarreraOpcional, setMostrarCarreraOpcional] = useState(false);
    const [busquedaSoftware, setBusquedaSoftware] = useState('');

    const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL);

    useEffect(() => {
        flujoStorage.limpiar();
        fetch('/api/catalogos', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data: Catalogos) => setCatalogos(data))
            .catch(() => setError('No se pudo cargar el catálogo de software y equipos.'))
            .finally(() => setCargando(false));
    }, []);

    const necesidad = useMemo(() => calcularNecesidad(catalogos, perfil), [catalogos, perfil]);

    const softwareFiltrado = useMemo(() => {
        const texto = busquedaSoftware.trim().toLowerCase();
        if (!catalogos) return [];
        if (!texto) return catalogos.software;
        return catalogos.software.filter((s) => s.nombre.toLowerCase().includes(texto) || s.categoria.toLowerCase().includes(texto));
    }, [catalogos, busquedaSoftware]);

    const softwareSeleccionado = useMemo(
        () => catalogos?.software.filter((s) => perfil.software_ids.includes(s.id)) ?? [],
        [catalogos, perfil.software_ids],
    );

    function toggleActividad(clave: string) {
        setPerfil((p) => ({
            ...p,
            actividades: p.actividades.includes(clave) ? p.actividades.filter((c) => c !== clave) : [...p.actividades, clave],
        }));
    }

    function toggleSoftware(id: number) {
        setPerfil((p) => ({
            ...p,
            software_ids: p.software_ids.includes(id) ? p.software_ids.filter((s) => s !== id) : [...p.software_ids, id],
        }));
    }

    async function enviar() {
        if (!perfil.nivel_experiencia) {
            setError('Elige tu nivel de experiencia para continuar.');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            const res = await fetch('/api/recomendaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ perfil, opciones: { top_n: 3 } }),
            });
            const data: RespuestaMotor = await res.json();

            flujoStorage.guardarPerfil(perfil);

            if (!res.ok || 'error' in data) {
                flujoStorage.guardarTarjetas([]);
                sessionStorage.setItem('ingetech:error', JSON.stringify('error' in data ? data : null));
                router.visit('/resultado');
                return;
            }

            flujoStorage.guardarTarjetas(data.tarjetas);
            sessionStorage.removeItem('ingetech:error');
            router.visit('/resultado');
        } catch {
            setError('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <>
            <Head title="Arma tu perfil — IngeTech AI" />
            <div className="min-h-screen bg-[#07111f] text-white">
                <FlowHeader pasoActual={1} />

                <main className="mx-auto max-w-2xl px-6 py-14 lg:px-10">
                    <h1 className="text-3xl font-bold">Cuéntanos sobre ti</h1>
                    <p className="mt-2 text-slate-400">
                        Este perfil sirve para cualquier persona — estudiante, profesional o lo que seas. No necesitas pertenecer a ninguna carrera
                        para recibir una recomendación.
                    </p>

                    {cargando ? (
                        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-white/[0.04]" />
                    ) : (
                        <div className="mt-8 space-y-7 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                            {/* TIPO DE USUARIO */}
                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-300">¿Qué describe mejor tu uso? (opcional)</span>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                    {TIPO_USUARIO_OPCIONES.map((op) => {
                                        const Icon = op.icon;
                                        const activo = perfil.tipo_usuario === op.value;
                                        return (
                                            <button
                                                key={op.value}
                                                type="button"
                                                onClick={() => setPerfil((p) => ({ ...p, tipo_usuario: activo ? '' : op.value }))}
                                                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                                                    activo
                                                        ? 'border-cyan-400 bg-cyan-400/10 text-white'
                                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
                                                {op.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SOFTWARE QUE USA */}
                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-300">¿Qué programas usas o piensas usar?</span>
                                <input
                                    value={busquedaSoftware}
                                    onChange={(e) => setBusquedaSoftware(e.target.value)}
                                    placeholder="Buscar software (Office, AutoCAD, Photoshop, juegos...)"
                                    className="mb-2.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                                />
                                <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                    {softwareFiltrado.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => toggleSoftware(s.id)}
                                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                                                perfil.software_ids.includes(s.id)
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-white'
                                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                            }`}
                                        >
                                            <span
                                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 text-[9px] ${
                                                    perfil.software_ids.includes(s.id)
                                                        ? 'border-cyan-400 bg-cyan-400 text-[#07111f]'
                                                        : 'border-slate-500'
                                                }`}
                                            >
                                                {perfil.software_ids.includes(s.id) && '✓'}
                                            </span>
                                            <span className="truncate">{s.nombre}</span>
                                        </button>
                                    ))}
                                    {softwareFiltrado.length === 0 && (
                                        <p className="col-span-2 py-3 text-center text-xs text-slate-500">Sin resultados para tu búsqueda.</p>
                                    )}
                                </div>
                                {softwareSeleccionado.length > 0 && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Elegiste: <span className="text-cyan-300">{softwareSeleccionado.map((s) => s.nombre).join(', ')}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-300">Nivel de experiencia</span>
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                    {NIVEL_OPCIONES.map((op) => (
                                        <button
                                            key={op.value}
                                            type="button"
                                            onClick={() => setPerfil({ ...perfil, nivel_experiencia: op.value })}
                                            className={`rounded-xl border p-3 text-left text-sm transition ${
                                                perfil.nivel_experiencia === op.value
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-white'
                                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                            }`}
                                        >
                                            <span className="block font-semibold">{op.label}</span>
                                            <span className="block text-xs text-slate-500">{op.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-300">¿Haces algo de esto? (opcional)</span>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {catalogos?.actividades.map((a) => (
                                        <button
                                            key={a.clave}
                                            type="button"
                                            onClick={() => toggleActividad(a.clave)}
                                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                                                perfil.actividades.includes(a.clave)
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-white'
                                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                            }`}
                                        >
                                            <span
                                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 text-[9px] ${
                                                    perfil.actividades.includes(a.clave)
                                                        ? 'border-cyan-400 bg-cyan-400 text-[#07111f]'
                                                        : 'border-slate-500'
                                                }`}
                                            >
                                                {perfil.actividades.includes(a.clave) && '✓'}
                                            </span>
                                            {a.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="block">
                                <span className="mb-1.5 flex justify-between text-sm font-medium text-slate-300">
                                    <span>Presupuesto máximo</span>
                                    <span className="font-mono text-cyan-400">S/ {perfil.presupuesto_soles.toLocaleString('es-PE')}</span>
                                </span>
                                <input
                                    type="range"
                                    min={800}
                                    max={8000}
                                    step={100}
                                    value={perfil.presupuesto_soles}
                                    onChange={(e) => setPerfil({ ...perfil, presupuesto_soles: Number(e.target.value) })}
                                    className="w-full accent-cyan-400"
                                />
                            </label>

                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-300">Portabilidad</span>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {PORTABILIDAD_OPCIONES.map((op) => (
                                        <button
                                            key={op.value}
                                            type="button"
                                            onClick={() => setPerfil({ ...perfil, portabilidad: op.value })}
                                            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                                                perfil.portabilidad === op.value
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-white'
                                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                            }`}
                                        >
                                            {op.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CARRERA — completamente opcional, plegada por defecto */}
                            <div className="border-t border-white/10 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setMostrarCarreraOpcional((v) => !v)}
                                    className="flex w-full items-center justify-between text-sm font-medium text-slate-300 hover:text-white"
                                >
                                    <span>¿Estudias una carrera? Indícala para afinar aún más tu recomendación (opcional)</span>
                                    <ChevronDown className={`h-4 w-4 shrink-0 transition ${mostrarCarreraOpcional ? 'rotate-180' : ''}`} />
                                </button>
                                {mostrarCarreraOpcional && (
                                    <select
                                        value={perfil.carrera_clave}
                                        onChange={(e) => setPerfil({ ...perfil, carrera_clave: e.target.value })}
                                        className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                                    >
                                        <option value="">Prefiero no indicarlo</option>
                                        {catalogos?.carreras.map((c) => (
                                            <option key={c.clave} value={c.clave}>
                                                {c.nombre}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    )}

                    {necesidad && (perfil.software_ids.length > 0 || perfil.actividades.length > 0) && (
                        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
                            <p className="font-semibold text-slate-300">Con lo que elegiste, estimamos que necesitas:</p>
                            <p className="mt-1">
                                al menos <b className="text-cyan-400">{necesidad.ram_gb} GB RAM</b>, procesador con puntaje ≥{' '}
                                <b className="text-cyan-400">{necesidad.cpu_score}/100</b>
                                {necesidad.gpu_dedicada ? (
                                    <>
                                        , y <b className="text-cyan-400">GPU dedicada</b>
                                    </>
                                ) : null}
                                .
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={enviar}
                        disabled={enviando || cargando}
                        className="mt-8 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-[#07111f] transition hover:bg-cyan-300 disabled:opacity-60"
                    >
                        {enviando ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Calculando…
                            </>
                        ) : (
                            <>Generar recomendación →</>
                        )}
                    </button>
                </main>
                <ChatWidget />
            </div>
        </>
    );
}
