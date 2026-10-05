import { LoadingPanel } from '@/components/loading-panel';
import type { FilaInventario, InventarioAdmin, MovimientoInventario } from '@/types/flujo';
import { AlertTriangle, ArrowDownToLine, CheckCircle2, ClipboardCheck, PackageX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const ESTADO: Record<FilaInventario['estado'], { texto: string; clase: string }> = {
    agotado: { texto: 'Agotado', clase: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
    reponer: { texto: 'Reponer', clase: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    ok: { texto: 'Suficiente', clase: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
};

const TIPO_MOV: Record<MovimientoInventario['tipo'], string> = {
    inicial: 'Inventario inicial',
    entrada: 'Entrada',
    venta: 'Venta',
    anulacion: 'Anulación',
    ajuste: 'Ajuste',
};

async function enviar(url: string, method: string, body: unknown) {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const primero = data.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
        throw new Error(primero ?? data.message ?? 'No se pudo guardar.');
    }
    return data;
}

// Inventario (Administración): stock por laptop, cuándo reponer y cuánto pedir según las ventas
// reales (punto de reorden), entradas y ajustes, y el kardex. Las agotadas dejan de recomendarse.
export function PanelInventario({ avisar }: { avisar: (msg: string) => void }) {
    const [datos, setDatos] = useState<InventarioAdmin | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<{ laptop: FilaInventario; tipo: 'entrada' | 'ajuste' } | null>(null);

    const cargar = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/inventario', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!res.ok) throw new Error();
            setDatos(await res.json());
            setError(null);
        } catch {
            setError('No se pudo cargar el inventario.');
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    if (error) return <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>;
    if (!datos) return <LoadingPanel />;

    const { laptops, movimientos, parametros } = datos;
    const agotadas = laptops.filter((l) => l.estado === 'agotado').length;
    const porReponer = laptops.filter((l) => l.estado === 'reponer').length;
    const unidades = laptops.reduce((s, l) => s + l.stock, 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <Tarjeta icon={ClipboardCheck} label="Unidades en almacén" valor={unidades} />
                <Tarjeta icon={AlertTriangle} label="Por reponer" valor={porReponer} tono={porReponer > 0 ? 'ambar' : undefined} />
                <Tarjeta icon={PackageX} label="Agotadas (la IA no las recomienda)" valor={agotadas} tono={agotadas > 0 ? 'rojo' : undefined} />
            </div>

            <p className="text-muted-foreground text-xs leading-5">
                <b>Punto de reorden</b> = demanda diaria (ventas de los últimos {parametros.ventana_demanda_dias} días) × {parametros.dias_reposicion}{' '}
                días que tarda la reposición + stock mínimo. Al llegar a ese nivel se sugiere pedir lo necesario para{' '}
                {parametros.dias_reposicion + parametros.dias_cobertura} días. Los plazos son supuestos editables en <code>config/tienda.php</code>.
            </p>

            <div className="bg-card overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[860px] text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                        <tr>
                            <th className="px-4 py-3">Laptop</th>
                            <th className="px-4 py-3 text-right">Stock</th>
                            <th className="px-4 py-3 text-right">Mínimo</th>
                            <th className="px-4 py-3 text-right">Vendidas ({parametros.ventana_demanda_dias} d)</th>
                            <th className="px-4 py-3 text-right">Alcanza para</th>
                            <th className="px-4 py-3 text-right">Punto de reorden</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {laptops.map((l) => (
                            <tr key={l.id} className="border-t">
                                <td className="px-4 py-3 font-semibold">
                                    {l.marca} {l.modelo}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold">{l.stock}</td>
                                <td className="px-4 py-3 text-right">
                                    <StockMinimo fila={l} onGuardado={cargar} avisar={avisar} />
                                </td>
                                <td className="px-4 py-3 text-right font-mono">{l.vendidas}</td>
                                <td className="px-4 py-3 text-right">{l.cobertura_dias === null ? 'sin ventas' : `${l.cobertura_dias} días`}</td>
                                <td className="px-4 py-3 text-right font-mono">{l.punto_reorden}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ESTADO[l.estado].clase}`}>
                                        {ESTADO[l.estado].texto}
                                    </span>
                                    {l.reponer > 0 && <span className="text-muted-foreground ml-2 text-xs">pedir {l.reponer}</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setForm({ laptop: l, tipo: 'entrada' })}
                                            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-600"
                                        >
                                            Entrada
                                        </button>
                                        <button
                                            onClick={() => setForm({ laptop: l, tipo: 'ajuste' })}
                                            className="hover:bg-muted rounded-lg border px-3 py-1.5 text-xs font-semibold"
                                        >
                                            Ajuste
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {form && (
                <FormMovimiento
                    key={`${form.laptop.id}-${form.tipo}`}
                    laptop={form.laptop}
                    tipo={form.tipo}
                    onCerrar={() => setForm(null)}
                    onGuardado={(msg) => {
                        setForm(null);
                        avisar(msg);
                        void cargar();
                    }}
                />
            )}

            <section className="bg-card rounded-2xl border p-5">
                <h3 className="font-bold">Kardex — últimos movimientos</h3>
                <p className="text-muted-foreground text-xs">
                    Cada cambio de stock queda registrado: el stock es siempre la suma de sus movimientos.
                </p>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead className="text-muted-foreground text-left text-xs">
                            <tr>
                                <th className="py-2 pr-4">Fecha</th>
                                <th className="py-2 pr-4">Laptop</th>
                                <th className="py-2 pr-4">Movimiento</th>
                                <th className="py-2 pr-4 text-right">Cantidad</th>
                                <th className="py-2 pr-4 text-right">Queda</th>
                                <th className="py-2">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimientos.map((m) => (
                                <tr key={m.id} className="border-t">
                                    <td className="py-2 pr-4 whitespace-nowrap">
                                        {new Date(m.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="py-2 pr-4">{m.laptop ? `${m.laptop.marca} ${m.laptop.modelo}` : '—'}</td>
                                    <td className="py-2 pr-4">{TIPO_MOV[m.tipo]}</td>
                                    <td
                                        className={`py-2 pr-4 text-right font-mono font-bold ${m.cantidad < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                                    >
                                        {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                                    </td>
                                    <td className="py-2 pr-4 text-right font-mono">{m.stock_resultante}</td>
                                    <td className="text-muted-foreground py-2 text-xs">
                                        {[m.pedido?.codigo, m.motivo, m.user?.name].filter(Boolean).join(' · ') || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function FormMovimiento({
    laptop,
    tipo,
    onCerrar,
    onGuardado,
}: {
    laptop: FilaInventario;
    tipo: 'entrada' | 'ajuste';
    onCerrar: () => void;
    onGuardado: (msg: string) => void;
}) {
    const [cantidad, setCantidad] = useState(tipo === 'entrada' ? String(Math.max(laptop.reponer, 1)) : String(laptop.stock));
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    async function guardar() {
        setGuardando(true);
        setError(null);
        try {
            await enviar(`/api/admin/inventario/${laptop.id}/movimientos`, 'POST', { tipo, cantidad: Number(cantidad), motivo: motivo || null });
            onGuardado(
                tipo === 'entrada'
                    ? `Entraron ${cantidad} unidades de ${laptop.marca} ${laptop.modelo}.`
                    : `Stock de ${laptop.marca} ${laptop.modelo} ajustado a ${cantidad}.`,
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <section className="bg-card rounded-2xl border border-cyan-500/30 p-5">
            <h3 className="flex items-center gap-2 font-bold">
                {tipo === 'entrada' ? <ArrowDownToLine className="h-4 w-4 text-cyan-500" /> : <ClipboardCheck className="h-4 w-4 text-cyan-500" />}
                {tipo === 'entrada' ? 'Registrar entrada' : 'Ajuste por conteo físico'} — {laptop.marca} {laptop.modelo}
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
                {tipo === 'entrada'
                    ? 'Unidades que llegaron del proveedor. Se suman al stock actual.'
                    : `Escribe cuántas unidades contaste en el almacén (hoy el sistema tiene ${laptop.stock}). Se registra la diferencia.`}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
                <label className="text-xs font-semibold">
                    {tipo === 'entrada' ? 'Unidades que entran' : 'Unidades contadas'}
                    <input
                        type="number"
                        min={tipo === 'entrada' ? 1 : 0}
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className="bg-background mt-1 h-10 w-full rounded-xl border px-3 text-sm"
                    />
                </label>
                <label className="text-xs font-semibold">
                    Motivo {tipo === 'entrada' ? '(opcional)' : ''}
                    <input
                        value={motivo}
                        maxLength={200}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder={tipo === 'entrada' ? 'Ej.: compra al proveedor, guía de remisión' : 'Ej.: conteo mensual, unidad dañada'}
                        className="bg-background mt-1 h-10 w-full rounded-xl border px-3 text-sm"
                    />
                </label>
            </div>
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            <div className="mt-4 flex gap-2">
                <button
                    onClick={() => void guardar()}
                    disabled={guardando || cantidad === ''}
                    className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {guardando ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={onCerrar} className="hover:bg-muted rounded-xl border px-4 py-2 text-sm">
                    Cancelar
                </button>
            </div>
        </section>
    );
}

function StockMinimo({ fila, onGuardado, avisar }: { fila: FilaInventario; onGuardado: () => void; avisar: (msg: string) => void }) {
    const [valor, setValor] = useState(String(fila.stock_minimo));

    async function guardar() {
        if (Number(valor) === fila.stock_minimo || valor === '') return;
        try {
            await enviar(`/api/admin/inventario/${fila.id}`, 'PATCH', { stock_minimo: Number(valor) });
            avisar(`Stock mínimo de ${fila.marca} ${fila.modelo}: ${valor}.`);
            onGuardado();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo guardar.');
            setValor(String(fila.stock_minimo));
        }
    }

    return (
        <input
            type="number"
            min={0}
            max={100}
            value={valor}
            aria-label={`Stock mínimo de ${fila.marca} ${fila.modelo}`}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => void guardar()}
            className="bg-background h-8 w-16 rounded-lg border px-2 text-right text-sm"
        />
    );
}

function Tarjeta({ icon: Icon, label, valor, tono }: { icon: typeof CheckCircle2; label: string; valor: number; tono?: 'ambar' | 'rojo' }) {
    const color = tono === 'rojo' ? 'text-rose-600 dark:text-rose-400' : tono === 'ambar' ? 'text-amber-600 dark:text-amber-400' : '';
    return (
        <div className="bg-card rounded-2xl border p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-xs font-bold uppercase">
                <Icon className="h-4 w-4" /> {label}
            </p>
            <p className={`mt-2 text-3xl font-black ${color}`}>{valor}</p>
        </div>
    );
}
