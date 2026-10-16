import { useForm } from '@inertiajs/react';
import { HeartHandshake, Star } from 'lucide-react';
import { FormEventHandler } from 'react';

// Lo que manda el servidor (Pedido::datosEncuesta): adónde enviar y las opciones de cada pregunta.
export interface DatosEncuesta {
    url: string;
    respondida: boolean;
    satisfaccion: number | null;
    opciones: { volveria: Record<string, string>; aspectos: Record<string, string> };
}

const NIVEL = ['', 'Nada satisfecho', 'Poco satisfecho', 'Más o menos', 'Satisfecho', 'Muy satisfecho'];

// Encuesta de satisfacción después de la entrega (Psicología + Industrial). Dos preguntas
// obligatorias y dos opcionales: con más, la gente deja de responder.
export default function EncuestaSatisfaccion({ datos }: { datos: DatosEncuesta }) {
    const { data, setData, post, processing, errors, transform, clearErrors } = useForm({
        satisfaccion: 0,
        volveria_elegirla: '',
        aspectos: [] as string[],
        comentario: '',
    });

    const enviar: FormEventHandler = (e) => {
        e.preventDefault();
        // Sin estrellas elegidas se manda vacío, para que el servidor pida elegirlas.
        transform((d) => ({ ...d, satisfaccion: d.satisfaccion || null }));
        post(datos.url, { preserveScroll: true });
    };

    const alternarAspecto = (clave: string) =>
        setData('aspectos', data.aspectos.includes(clave) ? data.aspectos.filter((a) => a !== clave) : [...data.aspectos, clave]);

    if (datos.respondida) {
        return (
            <div className="flex items-start gap-3">
                <HeartHandshake className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
                <div>
                    <h2 className="font-semibold">¡Gracias por contarnos qué tal te fue!</h2>
                    {datos.satisfaccion !== null && <Estrellas valor={datos.satisfaccion} />}
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Tu respuesta ayuda a que la IA recomiende mejor a la próxima persona.
                    </p>
                </div>
            </div>
        );
    }

    const opcion = (activa: boolean) =>
        `rounded-xl border px-3 py-2 text-sm transition ${
            activa
                ? 'border-cyan-500 bg-cyan-400/15 font-semibold text-sky-800 dark:text-cyan-200'
                : 'border-slate-200 hover:border-cyan-400 dark:border-white/15'
        }`;

    return (
        <form onSubmit={enviar} className="space-y-6">
            <div>
                <h2 className="flex items-center gap-2 font-semibold">
                    <HeartHandshake className="h-5 w-5 text-cyan-500" /> ¿Qué tal te fue con tu laptop?
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Son 2 preguntas y 2 opcionales. Nos ayudan a saber si la recomendación acertó y a recomendar mejor.
                </p>
            </div>

            <fieldset>
                <legend className="text-sm font-semibold">1. ¿Qué tan satisfecho estás con tu laptop?</legend>
                <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => {
                                setData('satisfaccion', n);
                                clearErrors('satisfaccion');
                            }}
                            aria-label={`${n} de 5: ${NIVEL[n]}`}
                            aria-pressed={data.satisfaccion === n}
                            className="rounded-lg p-1 transition hover:scale-110"
                        >
                            <Star
                                className={`h-8 w-8 ${n <= data.satisfaccion ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">{NIVEL[data.satisfaccion]}</span>
                </div>
                {errors.satisfaccion && <p className="mt-1 text-xs text-rose-600">{errors.satisfaccion}</p>}
            </fieldset>

            <fieldset>
                <legend className="text-sm font-semibold">2. ¿La volverías a elegir?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(datos.opciones.volveria).map(([valor, etiqueta]) => (
                        <button
                            key={valor}
                            type="button"
                            onClick={() => {
                                setData('volveria_elegirla', valor);
                                clearErrors('volveria_elegirla');
                            }}
                            aria-pressed={data.volveria_elegirla === valor}
                            className={opcion(data.volveria_elegirla === valor)}
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>
                {errors.volveria_elegirla && <p className="mt-1 text-xs text-rose-600">{errors.volveria_elegirla}</p>}
            </fieldset>

            <fieldset>
                <legend className="text-sm font-semibold">
                    3. ¿Algo no salió como esperabas? <span className="font-normal text-slate-500">(opcional, puedes marcar varias)</span>
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(datos.opciones.aspectos).map(([clave, etiqueta]) => (
                        <button
                            key={clave}
                            type="button"
                            onClick={() => alternarAspecto(clave)}
                            aria-pressed={data.aspectos.includes(clave)}
                            className={opcion(data.aspectos.includes(clave))}
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>
            </fieldset>

            <label className="block">
                <span className="text-sm font-semibold">
                    4. ¿Quieres contarnos algo más? <span className="font-normal text-slate-500">(opcional)</span>
                </span>
                <textarea
                    value={data.comentario}
                    onChange={(e) => setData('comentario', e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                    placeholder="Por ejemplo: qué es lo que más te gusta o qué mejorarías"
                />
                <span className="block text-right text-[11px] text-slate-500">{data.comentario.length}/500</span>
            </label>

            {(errors as Record<string, string>).encuesta && <p className="text-sm text-rose-600">{(errors as Record<string, string>).encuesta}</p>}

            <button
                type="submit"
                disabled={processing}
                className="w-full rounded-xl bg-cyan-400 px-6 py-3 font-bold text-[#07111f] hover:bg-cyan-300 disabled:opacity-50 sm:w-auto"
            >
                {processing ? 'Enviando…' : 'Enviar mis respuestas'}
            </button>
        </form>
    );
}

export function Estrellas({ valor, chica = false }: { valor: number; chica?: boolean }) {
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`${valor} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${chica ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${n <= valor ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                />
            ))}
        </span>
    );
}
