import { soles } from '@/lib/pedidos';
import { BrainCircuit, PackageX, RefreshCw, TrendingDown, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Senal = 'reponer_primero' | 'no_convence' | 'capital_quieto' | null;

// Respuesta de /api/admin/inventario/demanda-ia (InventarioController::demandaIa).
interface FilaDemanda {
    id: number;
    marca: string;
    modelo: string;
    stock: number;
    estado: 'agotado' | 'reponer' | 'ok';
    reponer: number;
    vendidas: number;
    recomendada: number;
    primera_opcion: number;
    elegida: number;
    conversion_pct: number | null;
    capital_soles: number | null;
    senal: Senal;
}

interface DemandaIa {
    ventana_dias: number;
    consultas: number;
    min_consultas: number;
    resumen: { reponer_primero: number; no_convence: number; capital_quieto: number; capital_quieto_soles: number };
    laptops: FilaDemanda[];
}

const SENAL: Record<Exclude<Senal, null>, { texto: string; clase: string; consejo: string }> = {
    reponer_primero: {
        texto: 'Reponer primero',
        clase: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
        consejo: 'Le falta stock y la IA la está recomendando: si se agota, se pierden ventas.',
    },
    no_convence: {
        texto: 'La recomienda, no se vende',
        clase: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        consejo: 'La IA la ofrece seguido pero nadie la compra: revisa el precio, la foto o la ficha.',
    },
    capital_quieto: {
        texto: 'Capital quieto',
        clase: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
        consejo: 'Hay stock, pero la IA no se la recomienda a nadie y no se vende: no conviene comprar más.',
    },
};

// Demanda que ve la IA (Administración): cruza lo que recomienda el motor con el stock y las
// ventas, para decidir qué comprar, qué revisar y qué no volver a pedir.
export function PanelDemandaIa() {
    const [datos, setDatos] = useState<DemandaIa | null>(null);
    const [error, setError] = useState(false);

    const cargar = useCallback(async () => {
        const res = await fetch('/api/admin/inventario/demanda-ia', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (res.ok) {
            setDatos(await res.json());
            setError(false);
        } else setError(true);
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    if (error)
        return (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
                No se pudo cargar la demanda que ve la IA.
            </p>
        );
    if (!datos) return null;

    return (
        <section className="bg-card mt-6 space-y-5 rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                    <h3 className="flex items-center gap-2 font-bold">
                        <BrainCircuit className="h-5 w-5 text-cyan-500" /> Demanda que ve la IA
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                        Cuántas veces el motor recomendó cada laptop en los últimos {datos.ventana_dias} días ({datos.consultas}{' '}
                        {datos.consultas === 1 ? 'consulta' : 'consultas'}), frente a su stock y sus ventas. Las ventas miran el pasado; las
                        recomendaciones anticipan lo que se va a pedir.
                    </p>
                </div>
                <button
                    onClick={() => void cargar()}
                    className="hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                >
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <Dato
                    icon={TriangleAlert}
                    titulo="Reponer primero"
                    valor={String(datos.resumen.reponer_primero)}
                    texto={SENAL.reponer_primero.consejo}
                />
                <Dato
                    icon={TrendingDown}
                    titulo="La recomienda, no se vende"
                    valor={String(datos.resumen.no_convence)}
                    texto={SENAL.no_convence.consejo}
                />
                <Dato
                    icon={PackageX}
                    titulo="Capital quieto"
                    valor={soles(datos.resumen.capital_quieto_soles)}
                    texto={`${datos.resumen.capital_quieto} ${datos.resumen.capital_quieto === 1 ? 'laptop' : 'laptops'} con stock que la IA no recomienda y no se venden.`}
                />
            </div>

            {datos.consultas > 0 && datos.consultas < datos.min_consultas && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                    Con {datos.consultas} {datos.consultas === 1 ? 'consulta' : 'consultas'} todavía no se marcan «Capital quieto» ni «La recomienda,
                    no se vende»: que la IA no recomiende una laptop no dice nada si casi nadie pidió recomendaciones. Aparecen desde{' '}
                    {datos.min_consultas} consultas en {datos.ventana_dias} días.
                </p>
            )}

            {datos.consultas === 0 ? (
                <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                    Nadie pidió una recomendación en los últimos {datos.ventana_dias} días: todavía no hay demanda que mirar.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm">
                        <thead className="text-muted-foreground text-left text-xs">
                            <tr>
                                <th className="py-2 pr-3">Laptop</th>
                                <th className="py-2 pr-3 text-right" title="Veces que apareció entre las 3 recomendadas">
                                    Recomendada
                                </th>
                                <th className="py-2 pr-3 text-right" title="Veces que fue la opción más compatible">
                                    1.ª opción
                                </th>
                                <th className="py-2 pr-3 text-right">Elegida</th>
                                <th className="py-2 pr-3 text-right">Vendidas</th>
                                <th className="py-2 pr-3 text-right">Stock</th>
                                <th className="py-2">Señal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datos.laptops.map((l) => (
                                <tr key={l.id} className="border-t">
                                    <td className="py-2 pr-3 font-semibold">
                                        {l.marca} {l.modelo}
                                    </td>
                                    <td className="py-2 pr-3 text-right font-mono">{l.recomendada}</td>
                                    <td className="py-2 pr-3 text-right font-mono">{l.primera_opcion}</td>
                                    <td className="py-2 pr-3 text-right font-mono">{l.elegida}</td>
                                    <td className="py-2 pr-3 text-right font-mono">{l.vendidas}</td>
                                    <td
                                        className={`py-2 pr-3 text-right font-mono ${l.estado === 'ok' ? '' : 'font-bold text-rose-600 dark:text-rose-400'}`}
                                    >
                                        {l.stock}
                                    </td>
                                    <td className="py-2">
                                        {l.senal ? (
                                            <span
                                                title={SENAL[l.senal].consejo}
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${SENAL[l.senal].clase}`}
                                            >
                                                {SENAL[l.senal].texto}
                                                {l.senal === 'reponer_primero' && l.reponer > 0 && ` · pedir ${l.reponer}`}
                                                {l.senal === 'capital_quieto' && l.capital_soles !== null && ` · ${soles(l.capital_soles)}`}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="text-muted-foreground text-xs leading-5">
                Las laptops agotadas no se recomiendan (el motor las excluye), así que su cifra es de antes de agotarse. «Pedir» usa el mismo cálculo
                de reposición de la tabla de arriba.
            </p>
        </section>
    );
}

function Dato({ icon: Icon, titulo, valor, texto }: { icon: typeof BrainCircuit; titulo: string; valor: string; texto: string }) {
    return (
        <div className="bg-muted/40 rounded-xl p-4">
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-bold uppercase">
                <Icon className="h-3.5 w-3.5" /> {titulo}
            </p>
            <p className="mt-1 text-2xl font-black">{valor}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">{texto}</p>
        </div>
    );
}
