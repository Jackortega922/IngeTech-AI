import { Pause, Play, Plus, Tag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export type TipoSegmento = 'alto_valor' | 'compradores' | 'interesados' | 'exploradores' | 'inactivos';

interface Cupon {
    id: number;
    codigo: string;
    descripcion: string;
    tipo: 'porcentaje' | 'monto';
    valor: string;
    minimo_compra: string | null;
    usos_maximos: number | null;
    usos: number;
    segmento: TipoSegmento | null;
    vence_el: string | null;
    activo: boolean;
    monto_descontado: string | null;
}

export const NOMBRE_SEGMENTO: Record<TipoSegmento, string> = {
    alto_valor: 'Alto valor',
    compradores: 'Compradores',
    interesados: 'Interesados',
    exploradores: 'Exploradores',
    inactivos: 'Inactivos',
};

// Propuesta de cupón para cada grupo de la segmentación (el admin la puede cambiar).
const SUGERENCIA: Record<TipoSegmento, { codigo: string; descripcion: string; tipo: 'porcentaje' | 'monto'; valor: string }> = {
    alto_valor: { codigo: 'GRACIAS5', descripcion: 'Gracias por tu preferencia', tipo: 'porcentaje', valor: '5' },
    compradores: { codigo: 'ACCESORIOS50', descripcion: 'Descuento para tu siguiente compra', tipo: 'monto', valor: '50' },
    interesados: { codigo: 'PRIMERA10', descripcion: 'Tu primera laptop con descuento', tipo: 'porcentaje', valor: '10' },
    exploradores: { codigo: 'BIENVENIDA5', descripcion: 'Bienvenida a IngeTech AI', tipo: 'porcentaje', valor: '5' },
    inactivos: { codigo: 'VUELVE15', descripcion: 'Te extrañamos: vuelve con descuento', tipo: 'porcentaje', valor: '15' },
};

const VACIO = {
    codigo: '',
    descripcion: '',
    tipo: 'porcentaje' as 'porcentaje' | 'monto',
    valor: '',
    minimo_compra: '',
    usos_maximos: '',
    segmento: '',
    vence_el: '',
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

// Cupones de descuento (Marketing). Cada uno puede ir dirigido a un grupo de la segmentación
// con IA; el descuento se ve en el checkout, la boleta y Contabilidad.
// pedido: cada clic en "Crear cupón para este grupo" manda un objeto nuevo, así el formulario se
// vuelve a abrir aunque se elija el mismo grupo dos veces.
export function PanelCupones({ pedido, avisar }: { pedido: { tipo: TipoSegmento } | null; avisar: (msg: string) => void }) {
    const [cupones, setCupones] = useState<Cupon[] | null>(null);
    const [form, setForm] = useState(VACIO);
    const [abierto, setAbierto] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        const res = await fetch('/api/admin/cupones', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        setCupones(res.ok ? await res.json() : []);
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    // "Crear cupón para este grupo" desde un segmento: abre el formulario con una propuesta.
    useEffect(() => {
        if (!pedido) return;
        setForm({ ...VACIO, ...SUGERENCIA[pedido.tipo], segmento: pedido.tipo });
        setAbierto(true);
        setError(null);
    }, [pedido]);

    async function crear() {
        setGuardando(true);
        setError(null);
        try {
            const c = await enviar('/api/admin/cupones', 'POST', {
                ...form,
                valor: Number(form.valor),
                minimo_compra: form.minimo_compra ? Number(form.minimo_compra) : null,
                usos_maximos: form.usos_maximos ? Number(form.usos_maximos) : null,
                segmento: form.segmento || null,
                vence_el: form.vence_el || null,
            });
            avisar(`Cupón ${c.codigo} creado.`);
            setForm(VACIO);
            setAbierto(false);
            void cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo crear el cupón.');
        } finally {
            setGuardando(false);
        }
    }

    async function alternar(c: Cupon) {
        try {
            await enviar(`/api/admin/cupones/${c.id}`, 'PATCH', { activo: !c.activo });
            avisar(`Cupón ${c.codigo} ${c.activo ? 'pausado' : 'activado'}.`);
            void cargar();
        } catch (e) {
            avisar(e instanceof Error ? e.message : 'No se pudo cambiar el cupón.');
        }
    }

    const campo = 'bg-background mt-1 h-10 w-full rounded-xl border px-3 text-sm';

    return (
        <section className="bg-card space-y-4 rounded-2xl border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-bold">
                    <Tag className="h-5 w-5 text-cyan-500" /> Cupones de descuento
                </h3>
                {!abierto && (
                    <button
                        onClick={() => {
                            setForm(VACIO);
                            setAbierto(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-white"
                    >
                        <Plus className="h-4 w-4" /> Nuevo cupón
                    </button>
                )}
            </div>

            {abierto && (
                <div className="rounded-xl border border-cyan-500/30 p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-xs font-semibold">
                            Código
                            <input
                                className={campo}
                                value={form.codigo}
                                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                            />
                        </label>
                        <label className="text-xs font-semibold sm:col-span-1 lg:col-span-3">
                            Descripción (la ve el cliente)
                            <input className={campo} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                        </label>
                        <label className="text-xs font-semibold">
                            Tipo
                            <select
                                className={campo}
                                value={form.tipo}
                                onChange={(e) => setForm({ ...form, tipo: e.target.value as 'porcentaje' | 'monto' })}
                            >
                                <option value="porcentaje">Porcentaje (%)</option>
                                <option value="monto">Monto fijo (S/)</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold">
                            {form.tipo === 'porcentaje' ? 'Porcentaje (máx. 50)' : 'Monto en S/'}
                            <input
                                type="number"
                                min={1}
                                className={campo}
                                value={form.valor}
                                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                            />
                        </label>
                        <label className="text-xs font-semibold">
                            Compra mínima S/ (opcional)
                            <input
                                type="number"
                                min={0}
                                className={campo}
                                value={form.minimo_compra}
                                onChange={(e) => setForm({ ...form, minimo_compra: e.target.value })}
                            />
                        </label>
                        <label className="text-xs font-semibold">
                            Usos máximos (opcional)
                            <input
                                type="number"
                                min={1}
                                className={campo}
                                value={form.usos_maximos}
                                onChange={(e) => setForm({ ...form, usos_maximos: e.target.value })}
                            />
                        </label>
                        <label className="text-xs font-semibold">
                            Dirigido al grupo
                            <select className={campo} value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })}>
                                <option value="">Todos</option>
                                {Object.entries(NOMBRE_SEGMENTO).map(([v, n]) => (
                                    <option key={v} value={v}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-xs font-semibold">
                            Vence (opcional)
                            <input
                                type="date"
                                className={campo}
                                value={form.vence_el}
                                onChange={(e) => setForm({ ...form, vence_el: e.target.value })}
                            />
                        </label>
                    </div>
                    {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => void crear()}
                            disabled={guardando}
                            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {guardando ? 'Guardando…' : 'Crear cupón'}
                        </button>
                        <button onClick={() => setAbierto(false)} className="hover:bg-muted rounded-xl border px-4 py-2 text-sm">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {cupones === null ? null : cupones.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aún no hay cupones.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead className="text-muted-foreground text-left text-xs">
                            <tr>
                                <th className="py-2 pr-3">Código</th>
                                <th className="py-2 pr-3">Descuento</th>
                                <th className="py-2 pr-3">Grupo</th>
                                <th className="py-2 pr-3 text-right">Usos</th>
                                <th className="py-2 pr-3 text-right">Descontado</th>
                                <th className="py-2 pr-3">Vence</th>
                                <th className="py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {cupones.map((c) => (
                                <tr key={c.id} className={`border-t ${c.activo ? '' : 'opacity-50'}`}>
                                    <td className="py-2 pr-3">
                                        <span className="font-mono font-bold">{c.codigo}</span>
                                        <span className="text-muted-foreground block text-xs">{c.descripcion}</span>
                                    </td>
                                    <td className="py-2 pr-3">
                                        {c.tipo === 'porcentaje' ? `${Number(c.valor)}%` : `S/ ${Number(c.valor)}`}
                                        {c.minimo_compra && (
                                            <span className="text-muted-foreground block text-xs">desde S/ {Number(c.minimo_compra)}</span>
                                        )}
                                    </td>
                                    <td className="py-2 pr-3">{c.segmento ? NOMBRE_SEGMENTO[c.segmento] : 'Todos'}</td>
                                    <td className="py-2 pr-3 text-right font-mono">
                                        {c.usos}
                                        {c.usos_maximos ? ` / ${c.usos_maximos}` : ''}
                                    </td>
                                    <td className="py-2 pr-3 text-right font-mono">S/ {Number(c.monto_descontado ?? 0).toLocaleString('es-PE')}</td>
                                    <td className="py-2 pr-3">{c.vence_el ?? '—'}</td>
                                    <td className="py-2 text-right">
                                        <button
                                            onClick={() => void alternar(c)}
                                            className="hover:bg-muted inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                                        >
                                            {c.activo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                            {c.activo ? 'Pausar' : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
