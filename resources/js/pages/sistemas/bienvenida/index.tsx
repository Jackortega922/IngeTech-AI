import type { PreferenciasCliente, PreguntaCuestionario } from '@/types/flujo';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, HeartHandshake, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

// Cuestionario de bienvenida (Psicología): una pregunta por pantalla, con progreso visible y
// "Omitir" siempre a mano — nadie debería sentirse obligado a responder.
type Valor = string | string[] | null;

// Opciones que excluyen a las demás ("No tengo computadora", "Nada en especial").
const EXCLUYENTES = ['no_tengo', 'ninguno'];

function inicial(preguntas: PreguntaCuestionario[], previas: PreferenciasCliente | null): Record<string, Valor> {
    const r: Record<string, Valor> = {};
    for (const p of preguntas) {
        if (p.tipo === 'marcas') {
            r.marcas_preferidas = previas?.marcas_preferidas ?? [];
            r.marcas_evitar = previas?.marcas_evitar ?? [];
        } else {
            const previo = previas?.[p.clave as keyof PreferenciasCliente] as Valor | undefined;
            r[p.clave] = previo ?? (p.tipo === 'unica' ? null : []);
        }
    }
    return r;
}

export default function BienvenidaIndex({ preguntas, respuestas }: { preguntas: PreguntaCuestionario[]; respuestas: PreferenciasCliente | null }) {
    // -1 = presentación; 0..n-1 = preguntas.
    const [paso, setPaso] = useState(-1);
    const [valores, setValores] = useState<Record<string, Valor>>(() => inicial(preguntas, respuestas));
    const [enviando, setEnviando] = useState(false);

    const total = preguntas.length;
    const p = paso >= 0 ? preguntas[paso] : null;
    const esUltima = paso === total - 1;

    function set(clave: string, valor: Valor) {
        setValores((v) => ({ ...v, [clave]: valor }));
    }

    function toggleMultiple(clave: string, opcion: string) {
        const actual = (valores[clave] as string[]) ?? [];
        if (actual.includes(opcion))
            return set(
                clave,
                actual.filter((x) => x !== opcion),
            );
        if (EXCLUYENTES.includes(opcion)) return set(clave, [opcion]);
        set(clave, [...actual.filter((x) => !EXCLUYENTES.includes(x)), opcion]);
    }

    // Prioridades: se tocan en orden de importancia; tocar de nuevo la quita del orden.
    function toggleOrden(clave: string, opcion: string) {
        const actual = (valores[clave] as string[]) ?? [];
        set(clave, actual.includes(opcion) ? actual.filter((x) => x !== opcion) : [...actual, opcion]);
    }

    // Cada marca: prefiero / evitar / me da igual (sin marcar).
    function marcarMarca(marca: string, lista: 'marcas_preferidas' | 'marcas_evitar') {
        const otra = lista === 'marcas_preferidas' ? 'marcas_evitar' : 'marcas_preferidas';
        const enLista = ((valores[lista] as string[]) ?? []).includes(marca);
        setValores((v) => ({
            ...v,
            [lista]: enLista ? (v[lista] as string[]).filter((x) => x !== marca) : [...((v[lista] as string[]) ?? []), marca],
            [otra]: ((v[otra] as string[]) ?? []).filter((x) => x !== marca),
        }));
    }

    function siguiente() {
        if (esUltima) return terminar();
        setPaso((n) => n + 1);
    }

    function omitirPregunta() {
        if (!p) return;
        if (p.tipo === 'marcas') {
            setValores((v) => ({ ...v, marcas_preferidas: [], marcas_evitar: [] }));
        } else {
            set(p.clave, p.tipo === 'unica' ? null : []);
        }
        siguiente();
    }

    function terminar() {
        setEnviando(true);
        router.post('/bienvenida', valores as Record<string, string | string[] | null>, { onFinish: () => setEnviando(false) });
    }

    function ahoraNo() {
        router.post('/bienvenida/omitir');
    }

    const respondida = (() => {
        if (!p) return false;
        if (p.tipo === 'marcas') return true; // "me da igual" es una respuesta válida
        const v = valores[p.clave];
        return Array.isArray(v) ? v.length > 0 : v !== null;
    })();

    return (
        <>
            <Head title="Conozcámonos — IngeTech AI" />
            <div className="min-h-screen bg-[#07111f] text-white">
                <header className="border-b border-white/10">
                    <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
                        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-[#07111f]">✦</span>
                            Inge<span className="text-cyan-400">Tech</span> AI
                        </Link>
                        <button onClick={ahoraNo} className="text-sm text-slate-400 underline decoration-white/20 hover:text-white">
                            Ahora no
                        </button>
                    </div>
                </header>

                <main className="mx-auto max-w-2xl px-6 py-10">
                    {paso === -1 ? (
                        <section className="text-center">
                            <HeartHandshake className="mx-auto h-14 w-14 text-cyan-400" />
                            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Queremos conocerte</h1>
                            <p className="mx-auto mt-3 max-w-lg text-slate-400">
                                Son {total} preguntas rápidas (unos 2 minutos) sobre cómo usarás tu laptop y cómo prefieres decidir. Con eso te
                                recomendamos mejor y te lo explicamos a tu medida.
                            </p>
                            <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-slate-300">
                                {[
                                    'Puedes omitir cualquier pregunta.',
                                    'Solo usamos tus respuestas para recomendarte laptops.',
                                    'Puedes cambiarlas o borrarlas cuando quieras desde tu panel.',
                                ].map((t) => (
                                    <li key={t} className="flex items-start gap-2">
                                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {t}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 flex flex-col items-center gap-3">
                                <button
                                    onClick={() => setPaso(0)}
                                    className="flex items-center gap-2 rounded-xl bg-cyan-400 px-8 py-3.5 font-bold text-[#07111f] hover:bg-cyan-300"
                                >
                                    {respuestas?.completado_at ? 'Revisar mis respuestas' : 'Empezar'} <ArrowRight className="h-4 w-4" />
                                </button>
                                <button onClick={ahoraNo} className="text-sm text-slate-400 hover:text-white">
                                    Ahora no, ir a mi panel
                                </button>
                            </div>
                        </section>
                    ) : (
                        p && (
                            <section>
                                {/* Progreso */}
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>
                                        Pregunta {paso + 1} de {total}
                                    </span>
                                    <span>{Math.round(((paso + 1) / total) * 100)}%</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-cyan-400 transition-all"
                                        style={{ width: `${((paso + 1) / total) * 100}%` }}
                                    />
                                </div>

                                <h1 className="mt-8 text-2xl font-bold sm:text-3xl">{p.pregunta}</h1>
                                {p.ayuda && <p className="mt-2 text-slate-400">{p.ayuda}</p>}

                                <div className="mt-6 space-y-2.5">
                                    {p.tipo === 'marcas'
                                        ? Object.entries(p.opciones).map(([valor, etiqueta]) => {
                                              const prefiere = ((valores.marcas_preferidas as string[]) ?? []).includes(valor);
                                              const evita = ((valores.marcas_evitar as string[]) ?? []).includes(valor);
                                              return (
                                                  <div
                                                      key={valor}
                                                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                                                  >
                                                      <span className="font-medium">{etiqueta}</span>
                                                      <span className="flex gap-2 text-xs">
                                                          <button
                                                              type="button"
                                                              onClick={() => marcarMarca(valor, 'marcas_preferidas')}
                                                              className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 ${
                                                                  prefiere
                                                                      ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300'
                                                                      : 'border-white/10 text-slate-400'
                                                              }`}
                                                          >
                                                              <ThumbsUp className="h-3.5 w-3.5" /> Prefiero
                                                          </button>
                                                          <button
                                                              type="button"
                                                              onClick={() => marcarMarca(valor, 'marcas_evitar')}
                                                              className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 ${
                                                                  evita
                                                                      ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                                                                      : 'border-white/10 text-slate-400'
                                                              }`}
                                                          >
                                                              <ThumbsDown className="h-3.5 w-3.5" /> Evitar
                                                          </button>
                                                      </span>
                                                  </div>
                                              );
                                          })
                                        : Object.entries(p.opciones).map(([valor, etiqueta]) => {
                                              const v = valores[p.clave];
                                              const lista = Array.isArray(v) ? v : [];
                                              const elegida = p.tipo === 'unica' ? v === valor : lista.includes(valor);
                                              const puesto = p.tipo === 'orden' ? lista.indexOf(valor) + 1 : 0;
                                              return (
                                                  <button
                                                      key={valor}
                                                      type="button"
                                                      onClick={() =>
                                                          p.tipo === 'unica'
                                                              ? set(p.clave, v === valor ? null : valor)
                                                              : p.tipo === 'orden'
                                                                ? toggleOrden(p.clave, valor)
                                                                : toggleMultiple(p.clave, valor)
                                                      }
                                                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                                                          elegida
                                                              ? 'border-cyan-400 bg-cyan-400/10'
                                                              : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                                                      }`}
                                                  >
                                                      <span
                                                          className={`grid h-6 w-6 shrink-0 place-items-center text-xs font-bold ${
                                                              p.tipo === 'unica' ? 'rounded-full' : 'rounded-md'
                                                          } ${elegida ? 'bg-cyan-400 text-[#07111f]' : 'border border-white/25'}`}
                                                      >
                                                          {p.tipo === 'orden' ? puesto || '' : elegida && <Check className="h-3.5 w-3.5" />}
                                                      </span>
                                                      {etiqueta}
                                                  </button>
                                              );
                                          })}
                                </div>
                                {p.tipo === 'orden' && (
                                    <p className="mt-3 text-xs text-slate-500">
                                        Toca en orden: primero la más importante. Toca de nuevo para quitarla.
                                    </p>
                                )}

                                <div className="mt-8 flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => setPaso((n) => n - 1)}
                                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Atrás
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button onClick={omitirPregunta} className="text-sm text-slate-400 hover:text-white">
                                            Omitir
                                        </button>
                                        <button
                                            onClick={siguiente}
                                            disabled={enviando || !respondida}
                                            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-[#07111f] hover:bg-cyan-300 disabled:opacity-40"
                                        >
                                            {esUltima ? (enviando ? 'Guardando…' : 'Terminar') : 'Siguiente'}
                                            {!esUltima && <ArrowRight className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )
                    )}
                </main>
            </div>
        </>
    );
}
