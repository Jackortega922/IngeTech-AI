import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import { flujoStorage } from '@/lib/flujo-storage';
import type { Catalogos, Necesidad, NivelExperiencia, Perfil, Portabilidad, RespuestaMotor } from '@/types/flujo';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PORTABILIDAD_OPCIONES: { value: Portabilidad; label: string }[] = [
    { value: 'laptop', label: 'Laptop' },
    { value: 'escritorio', label: 'PC de escritorio' },
    { value: 'cualquiera', label: 'Cualquiera' },
];

const NIVEL_OPCIONES: { value: NivelExperiencia; label: string; desc: string }[] = [
    { value: 'basico', label: 'Básico', desc: 'Uso cotidiano del software de mi carrera.' },
    { value: 'intermedio', label: 'Intermedio', desc: 'Ya hago proyectos más exigentes.' },
    { value: 'avanzado', label: 'Avanzado', desc: 'Trabajo con cargas pesadas / freelance.' },
];

function calcularNecesidad(catalogos: Catalogos | null, perfil: Perfil): Necesidad | null {
    if (!catalogos) return null;
    const carrera = catalogos.carreras.find((c) => c.clave === perfil.carrera_clave);
    if (!carrera) return null;

    let ram = 4;
    let cpu = 15;
    let gpu = false;

    carrera.software.forEach((ref) => {
        const sw = catalogos.software.find((s) => s.id === ref.id);
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

    const [perfil, setPerfil] = useState<Perfil>({
        carrera_clave: '',
        nivel_experiencia: '',
        actividades: [],
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
            .then((data: Catalogos) => {
                setCatalogos(data);
                if (data.carreras.length > 0) setPerfil((p) => ({ ...p, carrera_clave: data.carreras[0].clave }));
            })
            .catch(() => setError('No se pudo cargar el catálogo de carreras y software.'))
            .finally(() => setCargando(false));
    }, []);

    const necesidad = useMemo(() => calcularNecesidad(catalogos, perfil), [catalogos, perfil]);
    const carreraActual = catalogos?.carreras.find((c) => c.clave === perfil.carrera_clave);
    const softwareDeLaCarrera = useMemo(() => {
        if (!catalogos || !carreraActual) return [];
        return carreraActual.software.map((ref) => catalogos.software.find((s) => s.id === ref.id)).filter(Boolean);
    }, [catalogos, carreraActual]);

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
                    <h1 className="text-3xl font-bold">Perfilamiento del estudiante</h1>
                    <p className="mt-2 text-slate-400">Con esto identificamos qué tan exigente es tu carga académica.</p>

                    {cargando ? (
                        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-white/[0.04]" />
                    ) : (
                        <div className="mt-8 space-y-7 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-slate-300">Facultad / Escuela Profesional</span>
                                <div className="relative">
                                    <select
                                        value={perfil.carrera_clave}
                                        onChange={(e) => setPerfil({ ...perfil, carrera_clave: e.target.value })}
                                        className="w-full appearance-none rounded-2xl border border-cyan-400/20 bg-slate-900 px-4 py-4 pr-12 text-white shadow-lg shadow-cyan-950/20 transition outline-none hover:border-cyan-400/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                                    >
                                        {!catalogos?.carreras?.length ? (
                                            <option value="" className="bg-slate-900 text-slate-300">
                                                No hay carreras disponibles
                                            </option>
                                        ) : (
                                            catalogos.carreras.map((c) => (
                                                <option key={c.clave} value={c.clave} className="bg-slate-900 text-white">
                                                    {c.nombre} — {c.facultad}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-cyan-400">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {catalogos?.carreras?.length ? (
                                    <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-lg">
                                                🎓
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-white">
                                                    {carreraActual?.nombre ?? 'Carrera seleccionada'}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {carreraActual?.facultad ?? 'Facultad / Escuela Profesional'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="ml-3 shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                                            {catalogos.carreras.length} carreras
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <div>
                                            <p className="font-semibold">No se encontraron carreras</p>
                                            <p className="mt-0.5 text-xs text-amber-200/70">
                                                El diseño ya está preparado, pero el catálogo de carreras no está llegando desde{' '}
                                                <code>/api/catalogos</code>.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </label>

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
                                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                                    ¿Haces algo de esto además de lo normal de tu carrera? (opcional)
                                </span>
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
                        </div>
                    )}

                    {necesidad && (
                        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
                            <p className="font-semibold text-slate-300">Software típico de esta carrera:</p>
                            <p className="mt-1">{softwareDeLaCarrera.map((s) => s?.nombre).join(' · ')}</p>
                            <p className="mt-3">
                                Necesitas al menos <b className="text-cyan-400">{necesidad.ram_gb} GB RAM</b>, procesador con puntaje ≥{' '}
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
                        disabled={enviando || cargando || !perfil.carrera_clave}
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
