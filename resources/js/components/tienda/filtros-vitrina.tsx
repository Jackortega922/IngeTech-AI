import type { Grupo, Seleccion } from '@/lib/filtros-vitrina';
import { Check, ChevronDown } from 'lucide-react';

// Panel de filtros de la vitrina (lateral en escritorio, dentro de un panel en celular). Cada
// opción dice cuántas laptops quedarían si se marca; las que dejarían la lista vacía se atenúan.
export default function FiltrosVitrina({
    grupos,
    seleccion,
    conteos,
    onCambiar,
}: {
    grupos: Grupo[];
    seleccion: Seleccion;
    conteos: Record<string, Record<string, number>>;
    onCambiar: (grupo: string, valor: string) => void;
}) {
    return (
        <div className="divide-y divide-white/10">
            {grupos.map((g) => {
                const marcadas = seleccion[g.id] ?? [];
                return (
                    <details key={g.id} open className="group py-4 first:pt-0">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-white marker:content-none">
                            <span>
                                {g.titulo}
                                {marcadas.length > 0 && (
                                    <span className="ml-2 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[11px] text-cyan-300">{marcadas.length}</span>
                                )}
                            </span>
                            <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
                        </summary>
                        <ul className="mt-3 space-y-1">
                            {g.opciones.map((o) => {
                                const activa = marcadas.includes(o.valor);
                                const cuantas = conteos[g.id]?.[o.valor] ?? 0;
                                const vacia = cuantas === 0 && !activa;
                                return (
                                    <li key={o.valor}>
                                        <button
                                            type="button"
                                            onClick={() => onCambiar(g.id, o.valor)}
                                            disabled={vacia}
                                            aria-pressed={activa}
                                            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                                                activa ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-300 hover:bg-white/5'
                                            } disabled:cursor-not-allowed disabled:opacity-35`}
                                        >
                                            <span
                                                className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                                                    activa ? 'border-cyan-400 bg-cyan-400 text-[#07111f]' : 'border-white/25'
                                                }`}
                                            >
                                                {activa && <Check className="h-3 w-3" strokeWidth={3} />}
                                            </span>
                                            <span className="min-w-0 flex-1">{o.etiqueta}</span>
                                            <span className="text-xs text-slate-500">{cuantas}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </details>
                );
            })}
        </div>
    );
}
