import type { Reclamo } from '@/types/flujo';
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Send } from 'lucide-react';
import { useState } from 'react';

const fecha = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-PE');

function Plazo({ r }: { r: Reclamo }) {
    if (r.estado === 'respondido') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Respondida
            </span>
        );
    }
    const dias = r.dias_restantes ?? 0;
    const color =
        dias < 0
            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
            : dias <= 3
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              : 'bg-sky-500/15 text-sky-700 dark:text-sky-300';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>
            {dias < 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {dias < 0 ? `Vencida hace ${-dias} día(s) hábil(es)` : dias === 0 ? 'Vence hoy' : `Quedan ${dias} día(s) hábil(es)`}
        </span>
    );
}

// Libro de Reclamaciones (Derecho) en el panel de administración: hojas ordenadas por plazo y
// respuesta del proveedor (parte 4 de la hoja).
export function PanelReclamos({ reclamos, avisar }: { reclamos: Reclamo[] | null; avisar: (msg: string) => void }) {
    const [lista, setLista] = useState(reclamos ?? []);
    const [abierto, setAbierto] = useState<number | null>(null);
    const [respuesta, setRespuesta] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pendientes = lista.filter((r) => r.estado === 'pendiente');
    const vencidas = pendientes.filter((r) => (r.dias_restantes ?? 0) < 0);

    async function responder(r: Reclamo) {
        setEnviando(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/reclamos/${r.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
                body: JSON.stringify({ respuesta }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'No se pudo guardar la respuesta.');
            setLista((l) => l.map((x) => (x.id === r.id ? data : x)));
            setAbierto(null);
            setRespuesta('');
            avisar(`Hoja ${r.numero} respondida.`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar la respuesta.');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
                <Tarjeta label="Hojas recibidas" valor={lista.length} />
                <Tarjeta label="Pendientes" valor={pendientes.length} />
                <Tarjeta label="Fuera de plazo" valor={vencidas.length} alerta={vencidas.length > 0} />
            </div>
            <p className="text-muted-foreground text-xs">
                Plazo legal: 15 días hábiles improrrogables desde que se presenta la hoja (Ley 29571, art. 24). No responder a tiempo puede generar
                una multa de INDECOPI.
            </p>

            {lista.length === 0 ? (
                <p className="bg-card text-muted-foreground rounded-2xl border p-10 text-center text-sm">Aún no hay hojas de reclamación.</p>
            ) : (
                <div className="space-y-3">
                    {lista.map((r) => (
                        <article key={r.id} className="bg-card rounded-2xl border p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-sm font-black">{r.numero}</span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${r.tipo === 'reclamo' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            {r.tipo}
                                        </span>
                                        <Plazo r={r} />
                                    </div>
                                    <p className="mt-1.5 text-sm font-semibold">
                                        {r.nombre} · {r.tipo_documento} {r.numero_documento}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {r.email}
                                        {r.telefono ? ` · ${r.telefono}` : ''} · presentada el {fecha(r.created_at)} · vence el{' '}
                                        {fecha(r.fecha_limite)}
                                    </p>
                                </div>
                                <a
                                    href={`/libro-reclamaciones/${r.numero}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                                >
                                    Ver hoja <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>

                            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground text-[11px] font-bold uppercase">
                                        {r.bien} · {r.descripcion_bien}
                                        {r.pedido_codigo ? ` · ${r.pedido_codigo}` : ''}
                                    </p>
                                    <p className="mt-1 whitespace-pre-line">{r.detalle}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[11px] font-bold uppercase">Pide</p>
                                    <p className="mt-1 whitespace-pre-line">{r.pedido_consumidor}</p>
                                </div>
                            </div>

                            {r.respuesta ? (
                                <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm">
                                    <p className="text-[11px] font-bold text-emerald-700 uppercase dark:text-emerald-300">Respuesta de la tienda</p>
                                    <p className="mt-1 whitespace-pre-line">{r.respuesta}</p>
                                </div>
                            ) : abierto === r.id ? (
                                <div className="mt-3 space-y-2">
                                    <textarea
                                        rows={4}
                                        maxLength={3000}
                                        value={respuesta}
                                        onChange={(e) => setRespuesta(e.target.value)}
                                        placeholder="Acciones adoptadas y solución ofrecida al consumidor"
                                        className="bg-background w-full rounded-xl border p-3 text-sm"
                                    />
                                    {error && <p className="text-xs text-rose-600">{error}</p>}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => void responder(r)}
                                            disabled={enviando || respuesta.trim().length < 10}
                                            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                        >
                                            <Send className="h-4 w-4" /> {enviando ? 'Guardando…' : 'Guardar respuesta'}
                                        </button>
                                        <button onClick={() => setAbierto(null)} className="hover:bg-muted rounded-xl border px-4 py-2 text-sm">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setAbierto(r.id);
                                        setRespuesta('');
                                        setError(null);
                                    }}
                                    className="mt-3 rounded-xl border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300"
                                >
                                    Responder
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

function Tarjeta({ label, valor, alerta }: { label: string; valor: number; alerta?: boolean }) {
    return (
        <div className={`bg-card rounded-2xl border p-5 ${alerta ? 'border-rose-500/40' : ''}`}>
            <p className="text-muted-foreground text-xs font-bold uppercase">{label}</p>
            <p className={`mt-2 text-3xl font-black ${alerta ? 'text-rose-600 dark:text-rose-400' : ''}`}>{valor}</p>
        </div>
    );
}
