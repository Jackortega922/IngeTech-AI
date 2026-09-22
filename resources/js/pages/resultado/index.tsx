import ChatWidget from '@/components/chat-widget';
import FlowHeader from '@/components/flujo/flow-header';
import { flujoStorage } from '@/lib/flujo-storage';
import type { Laptop, RespuestaMotorError, Tarjeta } from '@/types/flujo';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Cpu, HardDrive, MonitorSmartphone, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const COLOR_BADGE: Record<string, string> = {
    'Mejor Opción Económica': 'bg-emerald-400 text-emerald-950',
    'Opción Equilibrada': 'bg-cyan-400 text-[#07111f]',
    'Mejor Rendimiento': 'bg-violet-400 text-violet-950',
};

export default function ResultadoIndex() {
    const [tarjetas, setTarjetas] = useState<Tarjeta[] | null>(null);
    const [errorMotor, setErrorMotor] = useState<RespuestaMotorError | null>(null);
    const [comparar, setComparar] = useState<number[]>([]);

    useEffect(() => {
        const guardadas = flujoStorage.leerTarjetas();
        const errorGuardado = sessionStorage.getItem('ingetech:error');
        const err = errorGuardado ? (JSON.parse(errorGuardado) as RespuestaMotorError | null) : null;

        if (guardadas.length === 0 && !err) {
            router.visit('/perfil');
            return;
        }
        setTarjetas(guardadas);
        setErrorMotor(err);
        setComparar(flujoStorage.leerComparar());
    }, []);

    function elegir(t: Tarjeta) {
        flujoStorage.guardarSeleccionada(t);
        router.visit('/personalizar');
    }

    function agregarAComparar(id: number) {
        setComparar((prev) => {
            if (prev.includes(id)) return prev;
            if (prev.length >= 3) return prev;
            const next = [...prev, id];
            flujoStorage.guardarComparar(next);
            return next;
        });
    }

    if (tarjetas === null) return null;

    return (
        <>
            <Head title="Tu recomendación — IngeTech AI" />
            <div className="min-h-screen bg-[#07111f] text-white">
                <FlowHeader pasoActual={2} />

                <main className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
                    <h1 className="text-3xl font-bold sm:text-4xl">Tu recomendación</h1>
                    <p className="mt-2 max-w-xl text-slate-400">
                        Clasificamos los equipos viables en tres categorías, según qué priorices.
                    </p>

                    {errorMotor ? (
                        <>
                            <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-200">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                                <span>{errorMotor.mensaje}</span>
                            </div>
                            {errorMotor.cercanas && errorMotor.cercanas.length > 0 && (
                                <>
                                    <h2 className="mt-8 text-lg font-semibold">Las más cercanas dentro de tu presupuesto:</h2>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                        {errorMotor.cercanas.map((l) => (
                                            <TarjetaSimple key={l.id} l={l} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="mt-8 grid gap-6 lg:grid-cols-3">
                            {tarjetas.map((t) => (
                                <TarjetaLaptop
                                    key={t.laptop_id}
                                    t={t}
                                    enComparar={comparar.includes(t.laptop_id)}
                                    onElegir={() => elegir(t)}
                                    onComparar={() => agregarAComparar(t.laptop_id)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="mt-10 flex items-center gap-6">
                        <Link href="/perfil" className="text-sm text-slate-400 underline decoration-white/20 hover:text-white">
                            ← Cambiar mi perfil
                        </Link>
                        {comparar.length >= 2 && (
                            <Link
                                href="/comparador"
                                className="flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                            >
                                <Scale className="h-4 w-4" /> Comparar seleccionados ({comparar.length})
                            </Link>
                        )}
                    </div>
                </main>
                <ChatWidget />
            </div>
        </>
    );
}

function TarjetaLaptop({ t, enComparar, onElegir, onComparar }: { t: Tarjeta; enComparar: boolean; onElegir: () => void; onComparar: () => void }) {
    const l = t.laptop;
    const destacada = t.badges.includes('Mejor Rendimiento') && t.badges.length > 1;

    return (
        <article
            className={`flex flex-col rounded-2xl border p-6 ${
                destacada ? 'border-cyan-400/60 bg-cyan-400/[0.06]' : 'border-white/10 bg-white/[0.03]'
            }`}
        >
            <div className="flex flex-wrap gap-1.5">
                {t.badges.map((b) => (
                    <span key={b} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${COLOR_BADGE[b] ?? 'bg-white/10'}`}>
                        {b}
                    </span>
                ))}
            </div>

            <h2 className="mt-3 text-xl font-bold">
                {l.marca} {l.modelo}
            </h2>
            <p className="text-xs text-slate-400">
                {l.tipo === 'laptop' ? 'Laptop' : 'PC de escritorio'} · {l.cpu}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <SpecChip icon={<Cpu className="h-3.5 w-3.5" />} label={`Score ${l.rendimiento_score}`} />
                <SpecChip icon={<HardDrive className="h-3.5 w-3.5" />} label={`${l.ram_gb} GB · ${l.almacenamiento_gb} GB`} />
                <SpecChip icon={<MonitorSmartphone className="h-3.5 w-3.5" />} label={l.gpu_dedicada ? 'GPU dedicada' : 'Integrada'} />
            </div>

            <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="font-mono text-2xl font-bold">S/ {Number(l.precio_soles).toLocaleString('es-PE')}</span>
                <span className="text-xs text-slate-500">{l.tienda}</span>
            </div>

            <div className="mt-5 flex gap-2">
                <button
                    type="button"
                    onClick={onElegir}
                    className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#07111f] transition hover:bg-cyan-300"
                >
                    Personalizar esta
                </button>
                <button
                    type="button"
                    onClick={onComparar}
                    disabled={enComparar}
                    title="Agregar al comparador"
                    className={`rounded-xl border px-3 py-3 transition ${
                        enComparar ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                >
                    <Scale className="h-4 w-4" />
                </button>
            </div>
        </article>
    );
}

function TarjetaSimple({ l }: { l: Laptop }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-semibold">
                {l.marca} {l.modelo}
            </p>
            <p className="mt-1 text-xs text-slate-400">
                {l.cpu} · {l.ram_gb}GB · score {l.rendimiento_score}
            </p>
            <p className="mt-2 font-mono text-cyan-400">S/ {Number(l.precio_soles).toLocaleString('es-PE')}</p>
        </div>
    );
}

function SpecChip({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2.5 text-slate-300">
            {icon}
            <span className="leading-tight">{label}</span>
        </div>
    );
}
