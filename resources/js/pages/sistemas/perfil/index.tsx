import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import { flujoStorage } from '@/lib/flujo-storage';
import type { Catalogos, Necesidad, NivelExperiencia, Perfil, Portabilidad, PreferenciasCliente, RespuestaMotor, TipoUso } from '@/types/flujo';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Briefcase, Building2, Gamepad2, GraduationCap, Loader2, Palette, Search, Shapes, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Por ahora el catálogo es solo laptops (sin PCs de escritorio), así que "PC de escritorio"
// queda oculta acá: ofrecerla sería un camino muerto, siempre terminaría en "sin resultados".
const PORTABILIDAD_OPCIONES: { value: Portabilidad; label: string }[] = [
    { value: 'laptop', label: 'Laptop' },
    { value: 'cualquiera', label: 'Cualquiera' },
];

const NIVEL_OPCIONES: { value: NivelExperiencia; label: string; desc: string }[] = [
    { value: 'basico', label: 'Básico', desc: 'Uso cotidiano del software de mi carrera.' },
    { value: 'intermedio', label: 'Intermedio', desc: 'Ya hago proyectos más exigentes.' },
    { value: 'avanzado', label: 'Avanzado', desc: 'Trabajo con cargas pesadas / freelance.' },
];

// "¿Qué describe mejor tu uso?" (idea de Marco). Al elegir uno se marcan las actividades y
// programas típicos de ese uso, como punto de partida que la persona puede cambiar.
const TIPOS_USO: { value: TipoUso; label: string; icon: typeof Users; actividades: string[]; software: string[] }[] = [
    { value: 'estudiante', label: 'Estudiante', icon: GraduationCap, actividades: [], software: ['office'] },
    { value: 'profesional', label: 'Profesional', icon: Briefcase, actividades: ['streaming_multitarea'], software: ['office'] },
    { value: 'gamer', label: 'Gamer', icon: Gamepad2, actividades: ['videojuegos', 'streaming_multitarea'], software: [] },
    { value: 'creador', label: 'Diseño / Creación', icon: Palette, actividades: ['diseno_3d', 'edicion_video'], software: [] },
    { value: 'oficina', label: 'Oficina / Trámites', icon: Building2, actividades: [], software: ['office'] },
    { value: 'otro', label: 'Otro', icon: Shapes, actividades: [], software: [] },
];

const unir = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

// Misma cuenta que NecesidadCalculator en el servidor, con los programas que eligió la persona.
function calcularNecesidad(catalogos: Catalogos | null, perfil: Perfil): Necesidad | null {
    if (!catalogos) return null;
    if (perfil.software.length === 0 && perfil.actividades.length === 0) return null;

    let ram = 4;
    let cpu = 15;
    let gpu = false;

    perfil.software.forEach((clave) => {
        const sw = catalogos.software.find((s) => s.clave === clave);
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

export default function PerfilIndex({ preferencias }: { preferencias: PreferenciasCliente | null }) {
    const paraOtraPersona = preferencias?.para_quien === 'otra_persona';
    const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [consentimiento, setConsentimiento] = useState(false);

    const [busquedaSoftware, setBusquedaSoftware] = useState('');

    const [perfil, setPerfil] = useState<Perfil>({
        carrera_clave: '',
        cargo: '',
        tipo_uso: '',
        nivel_experiencia: '',
        actividades: [],
        software: [],
        presupuesto_soles: 3500,
        portabilidad: 'cualquiera',
    });

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
            .catch(() => setError('No se pudo cargar el catálogo de carreras y software.'))
            .finally(() => setCargando(false));
    }, []);

    const necesidad = useMemo(() => calcularNecesidad(catalogos, perfil), [catalogos, perfil]);
    const carreraActual = catalogos?.carreras.find((c) => c.clave === perfil.carrera_clave);
    const softwareFiltrado = useMemo(() => {
        const texto = busquedaSoftware.trim().toLowerCase();
        if (!catalogos) return [];
        return catalogos.software.filter((s) => !texto || `${s.nombre} ${s.categoria}`.toLowerCase().includes(texto));
    }, [catalogos, busquedaSoftware]);
    const nombresSoftware = perfil.software.map((c) => catalogos?.software.find((s) => s.clave === c)?.nombre).filter(Boolean);
    const puedeEnviar = perfil.software.length > 0 || perfil.actividades.length > 0;

    // Claves de los programas típicos de una carrera.
    function softwareDe(clave: string): string[] {
        const carrera = catalogos?.carreras.find((c) => c.clave === clave);
        if (!carrera || !catalogos) return [];
        return carrera.software.map((ref) => catalogos.software.find((s) => s.id === ref.id)?.clave).filter((c): c is string => !!c);
    }

    // Al cambiar de carrera se reemplazan los programas que puso la anterior y se suman los de la
    // nueva; los que la persona agregó a mano se respetan.
    function cambiarCarrera(clave: string) {
        setPerfil((p) => {
            const anteriores = softwareDe(p.carrera_clave);
            const propios = p.software.filter((c) => !anteriores.includes(c));
            return { ...p, carrera_clave: clave, software: unir(propios, softwareDe(clave)) };
        });
    }

    // Elegir un tipo de uso suma sus actividades y programas típicos (no borra lo ya marcado).
    function elegirTipoUso(tipo: TipoUso) {
        setPerfil((p) => {
            if (p.tipo_uso === tipo) return { ...p, tipo_uso: '' };
            const def = TIPOS_USO.find((t) => t.value === tipo)!;
            return { ...p, tipo_uso: tipo, actividades: unir(p.actividades, def.actividades), software: unir(p.software, def.software) };
        });
    }

    function toggleSoftware(clave: string) {
        setPerfil((p) => ({ ...p, software: p.software.includes(clave) ? p.software.filter((c) => c !== clave) : [...p.software, clave] }));
    }

    function toggleActividad(clave: string) {
        setPerfil((p) => ({
            ...p,
            actividades: p.actividades.includes(clave) ? p.actividades.filter((c) => c !== clave) : [...p.actividades, clave],
        }));
    }

    async function enviar() {
        if (!perfil.nivel_experiencia) {
            setError('Elige tu nivel de experiencia para continuar.');
            return;
        }
        if (!puedeEnviar) {
            setError('Elige al menos un programa que uses o una actividad que hagas.');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            const res = await fetch('/api/recomendaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    consentimiento,
                    perfil: { ...perfil, carrera_clave: perfil.carrera_clave || null, tipo_uso: perfil.tipo_uso || null },
                    opciones: { top_n: 3 },
                }),
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
            <div className="min-h-screen bg-slate-50 text-[#0c2340] dark:bg-slate-950 dark:text-white">
                <FlowHeader pasoActual={1} />

                <main className="mx-auto max-w-2xl px-6 py-14 lg:px-10">
                    <h1 className="text-3xl font-bold">{paraOtraPersona ? 'Cuéntanos sobre quién la usará' : 'Cuéntanos sobre ti'}</h1>
                    {/* Psicología: en el cuestionario dijo que compra para otra persona (ej. un padre para su hijo). */}
                    {paraOtraPersona && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm text-violet-700 dark:text-violet-200">
                            <Users className="mt-0.5 h-4 w-4 shrink-0" />
                            Como la laptop es para otra persona, responde pensando en su carrera u ocupación, lo que hará con ella y su nivel.
                        </p>
                    )}
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Con esto identificamos qué tan exigentes son tus actividades diarias, seas estudiante o no.
                    </p>

                    {cargando ? (
                        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-white dark:bg-white/[0.04]" />
                    ) : (
                        <div className="mt-8 space-y-7 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
                            {/* Tipo de uso (idea de Marco): punto de partida que marca actividades y programas típicos. */}
                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                                    ¿Qué describe mejor tu uso? <span className="text-slate-500">(opcional)</span>
                                </span>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                    {TIPOS_USO.map((op) => (
                                        <button
                                            key={op.value}
                                            type="button"
                                            onClick={() => elegirTipoUso(op.value)}
                                            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                                                perfil.tipo_uso === op.value
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-[#0c2340] dark:text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-white/25'
                                            }`}
                                        >
                                            <op.icon className="h-4 w-4 shrink-0 text-sky-600 dark:text-cyan-400" />
                                            {op.label}
                                        </button>
                                    ))}
                                </div>
                                {perfil.tipo_uso && (
                                    <p className="mt-1.5 text-xs text-slate-500">Marcamos lo típico de este uso más abajo; cámbialo si no aplica.</p>
                                )}
                            </div>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Carrera u ocupación <span className="text-slate-500">(opcional)</span>
                                </span>
                                <select
                                    value={perfil.carrera_clave}
                                    onChange={(e) => cambiarCarrera(e.target.value)}
                                    className="w-full rounded-2xl border border-cyan-400/20 bg-white px-4 py-4 text-[#0c2340] transition outline-none hover:border-cyan-400/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="">Prefiero no indicarla</option>
                                    {catalogos?.carreras.map((c) => (
                                        <option key={c.clave} value={c.clave}>
                                            {c.nombre} — {c.facultad}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    {carreraActual
                                        ? 'Agregamos los programas típicos de tu carrera; puedes quitar o sumar otros abajo.'
                                        : 'Si la indicas, precargamos los programas que se usan en ella.'}
                                </p>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Cargo específico <span className="text-slate-500">(opcional)</span>
                                </span>
                                <input
                                    type="text"
                                    value={perfil.cargo}
                                    onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                                    placeholder="Ej. Contador, Chef, Gerente de ventas..."
                                    maxLength={100}
                                    className="w-full rounded-2xl border border-cyan-400/20 bg-white px-4 py-4 text-[#0c2340] placeholder-slate-500 shadow-lg shadow-cyan-950/20 transition outline-none hover:border-cyan-400/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:bg-slate-900 dark:text-white"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">Nos ayuda a conocerte mejor — no afecta tu recomendación.</p>
                            </label>

                            {/* Programas que usa (idea de Marco): la IA calcula lo que pide cada uno. */}
                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                                    ¿Qué programas usas o piensas usar?
                                </span>
                                <label className="relative block">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={busquedaSoftware}
                                        onChange={(e) => setBusquedaSoftware(e.target.value)}
                                        placeholder="Buscar (Office, AutoCAD, Revit, SPSS...)"
                                        className="mb-2.5 w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3.5 pl-9 text-sm text-[#0c2340] placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                                    />
                                </label>
                                <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                    {softwareFiltrado.map((sw) => {
                                        const elegido = perfil.software.includes(sw.clave);
                                        return (
                                            <button
                                                key={sw.clave}
                                                type="button"
                                                onClick={() => toggleSoftware(sw.clave)}
                                                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                                                    elegido
                                                        ? 'border-cyan-400 bg-cyan-400/10 text-[#0c2340] dark:text-white'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-white/25'
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 text-[9px] ${
                                                        elegido ? 'border-cyan-400 bg-cyan-400 text-[#07111f]' : 'border-slate-400'
                                                    }`}
                                                >
                                                    {elegido && '✓'}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate">{sw.nombre}</span>
                                                    <span className="block truncate text-[11px] text-slate-500">{sw.categoria}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {softwareFiltrado.length === 0 && (
                                        <p className="py-3 text-center text-xs text-slate-500 sm:col-span-2">Sin resultados para tu búsqueda.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Nivel de experiencia</span>
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                    {NIVEL_OPCIONES.map((op) => (
                                        <button
                                            key={op.value}
                                            type="button"
                                            onClick={() => setPerfil({ ...perfil, nivel_experiencia: op.value })}
                                            className={`rounded-xl border p-3 text-left text-sm transition ${
                                                perfil.nivel_experiencia === op.value
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-[#0c2340] dark:text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-white/25'
                                            }`}
                                        >
                                            <span className="block font-semibold">{op.label}</span>
                                            <span className="block text-xs text-slate-500">{op.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                                    ¿Haces algo de esto? (opcional)
                                </span>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {catalogos?.actividades.map((a) => (
                                        <button
                                            key={a.clave}
                                            type="button"
                                            onClick={() => toggleActividad(a.clave)}
                                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                                                perfil.actividades.includes(a.clave)
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-[#0c2340] dark:text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-white/25'
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
                                <span className="mb-1.5 flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
                                    <span>Presupuesto máximo</span>
                                    <span className="font-mono text-sky-600 dark:text-cyan-400">
                                        S/ {perfil.presupuesto_soles.toLocaleString('es-PE')}
                                    </span>
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
                                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Portabilidad</span>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {PORTABILIDAD_OPCIONES.map((op) => (
                                        <button
                                            key={op.value}
                                            type="button"
                                            onClick={() => setPerfil({ ...perfil, portabilidad: op.value })}
                                            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                                                perfil.portabilidad === op.value
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-[#0c2340] dark:text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-white/25'
                                            }`}
                                        >
                                            {op.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {necesidad && (
                        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                            {nombresSoftware.length > 0 && (
                                <>
                                    <p className="font-semibold text-slate-600 dark:text-slate-300">Programas que usarás:</p>
                                    <p className="mt-1">{nombresSoftware.join(' · ')}</p>
                                </>
                            )}
                            <p className={nombresSoftware.length > 0 ? 'mt-3' : ''}>
                                Necesitas al menos <b className="text-sky-600 dark:text-cyan-400">{necesidad.ram_gb} GB RAM</b>, procesador con
                                puntaje ≥ <b className="text-sky-600 dark:text-cyan-400">{necesidad.cpu_score}/100</b>
                                {necesidad.gpu_dedicada ? (
                                    <>
                                        , y <b className="text-sky-600 dark:text-cyan-400">GPU dedicada</b>
                                    </>
                                ) : null}
                                .
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <label className="mt-8 flex cursor-pointer items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <input
                            type="checkbox"
                            checked={consentimiento}
                            onChange={(e) => setConsentimiento(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-400"
                        />
                        <span>
                            Acepto que IngeTech AI use los datos de este perfil (carrera, tipo de uso, programas, actividades y presupuesto) solo para
                            generar mi recomendación, según la Ley N.° 29733 de Protección de Datos Personales.{' '}
                            {/* En pestaña nueva: navegar fuera de esta página perdería lo ya llenado en el formulario. */}
                            <a
                                href="/derecho"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 underline decoration-cyan-400/30 hover:text-sky-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                            >
                                Ver cómo tratamos tus datos
                            </a>
                        </span>
                    </label>

                    <button
                        type="button"
                        onClick={enviar}
                        disabled={enviando || cargando || !puedeEnviar || !consentimiento}
                        className="mt-5 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-[#07111f] transition hover:bg-cyan-300 disabled:opacity-60"
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
