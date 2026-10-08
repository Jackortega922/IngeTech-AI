import { AVISOS, audienciaDe, regresosDe, type Aviso } from '@/lib/avisos-asistente';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Bot, Minimize2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Diseño: Marco (PR #41). Lógica: la del chat con Gemini (A13) — historial, límite de mensajes,
// marca de respuesta generada con IA y aviso de privacidad.
interface Mensaje {
    autor: 'usuario' | 'bot';
    texto: string;
    // 'gemini' si respondió el LLM; sin valor si respondió el asistente por palabras clave.
    fuente?: 'gemini';
}

// Se mandan los últimos mensajes para que el LLM tenga contexto de la conversación (el
// servidor acepta hasta 10).
const MAX_HISTORIAL = 10;

interface ChatWidgetProps {
    forzarAbierto?: boolean;
    onCerrado?: () => void;
}

const SALUDO: Mensaje = {
    autor: 'bot',
    texto: 'Hola 👋 Soy el asistente de IngeTech AI. Cuéntame qué vas a hacer con tu laptop y tu presupuesto, o pregúntame por un modelo del catálogo.',
};

// Avisos periódicos (Psicología, ver lib/avisos-asistente.ts): rotan en bucle para acompañar a
// la persona todo el tiempo, sin agobiarla. Tiempos en milisegundos (1000 ms = 1 s).
const PRIMER_AVISO_MS = 2500; // el primero, al entrar
const INTERVALO_MS = 50_000; // entre un aviso y el siguiente
const VISIBLE_MS = 15_000; // si no se toca, el globo se va solo
const MAX_RECHAZOS = 2; // cerrarlo dos veces seguidas = "ahora no"...
const DESCANSO_MS = 5 * 60_000; // ...y el asistente descansa 5 minutos antes de volver
const DESPEDIDA_MS = 4000; // cuánto se ve el mensaje de "te dejo tranquilo"

interface EstadoAvisos {
    mostrados: number; // cuántos se mostraron (elige el siguiente de la lista, en bucle)
    rechazos: number; // cierres seguidos con la X
    ultimo: number; // cuándo se mostró u ocultó el último (ms)
    pausaHasta: number; // descanso tras los rechazos (ms)
    volviendo: boolean; // el próximo aviso es el de "¡Volví!", tras el descanso
    regresos: number; // cuántas veces volvió (elige el mensaje de regreso, en bucle)
}

// En sessionStorage: el chat se monta de nuevo en cada página, y el ritmo debe seguir entre páginas.
const CLAVE_AVISOS = 'chat_avisos';

function leerEstado(): EstadoAvisos {
    try {
        const guardado = JSON.parse(sessionStorage.getItem(CLAVE_AVISOS) ?? 'null');
        if (guardado) return guardado;
    } catch {
        // Almacenamiento bloqueado o dañado: se empieza de cero.
    }
    return { mostrados: 0, rechazos: 0, ultimo: 0, pausaHasta: 0, volviendo: false, regresos: 0 };
}

function guardarEstado(cambios: Partial<EstadoAvisos>) {
    try {
        sessionStorage.setItem(CLAVE_AVISOS, JSON.stringify({ ...leerEstado(), ...cambios }));
    } catch {
        // Sin almacenamiento, los avisos solo se ordenan dentro de esta página.
    }
}

export default function ChatWidget({ forzarAbierto, onCerrado }: ChatWidgetProps = {}) {
    const { auth } = usePage<SharedData>().props;
    const audiencia = audienciaDe(auth.user?.rol);
    const avisos = AVISOS[audiencia];
    const saludosDeRegreso = regresosDe(audiencia);
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
    const [entrada, setEntrada] = useState('');
    const [enviando, setEnviando] = useState(false);
    // Globo junto al botón con el aviso de turno (null = no hay globo).
    const [burbuja, setBurbuja] = useState<Aviso | null>(null);
    // Cambia cada vez que se oculta un globo, para programar el siguiente.
    const [turno, setTurno] = useState(0);
    // Al segundo cierre seguido el bot se despide antes de descansar (confirma que entendió).
    const [despedida, setDespedida] = useState(false);
    const listaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (forzarAbierto) setAbierto(true);
    }, [forzarAbierto]);

    useEffect(() => {
        if (abierto) window.setTimeout(() => inputRef.current?.focus(), 120);
    }, [abierto]);

    // Programa el siguiente aviso (en bucle, sin límite). Solo aparece con la pestaña a la vista y
    // el chat cerrado: mientras conversa no se le interrumpe.
    useEffect(() => {
        if (abierto || burbuja || despedida) return;
        const estado = leerEstado();

        const ahora = Date.now();
        const espera =
            estado.mostrados === 0 ? PRIMER_AVISO_MS : Math.max(5000, estado.ultimo + INTERVALO_MS - ahora, (estado.pausaHasta ?? 0) - ahora);
        const t = window.setTimeout(() => {
            if (document.hidden) {
                setTurno((n) => n + 1); // se reintenta cuando vuelva a mirar
                return;
            }
            if (estado.volviendo) {
                // Primer aviso tras el descanso: retoma con un saludo cercano.
                const regresos = estado.regresos ?? 0;
                setBurbuja(saludosDeRegreso[regresos % saludosDeRegreso.length]);
                guardarEstado({ volviendo: false, regresos: regresos + 1, ultimo: Date.now() });
                return;
            }
            setBurbuja(avisos[estado.mostrados % avisos.length]);
            guardarEstado({ mostrados: estado.mostrados + 1, ultimo: Date.now() });
        }, espera);
        return () => window.clearTimeout(t);
    }, [abierto, burbuja, despedida, turno, avisos, saludosDeRegreso]);

    useEffect(() => {
        if (!despedida) return;
        const t = window.setTimeout(() => setDespedida(false), DESPEDIDA_MS);
        return () => window.clearTimeout(t);
    }, [despedida]);

    // Si no lo toca, el globo se va solo (ignorarlo no cuenta como rechazo).
    useEffect(() => {
        if (!burbuja) return;
        const t = window.setTimeout(() => ocultarBurbuja(), VISIBLE_MS);
        return () => window.clearTimeout(t);
    }, [burbuja]);

    function ocultarBurbuja(cambios: Partial<EstadoAvisos> = {}) {
        setBurbuja(null);
        guardarEstado({ ultimo: Date.now(), ...cambios });
        setTurno((n) => n + 1);
    }

    // Cerrarlo con la X: tras dos cierres seguidos, el asistente descansa antes de volver.
    function rechazarBurbuja() {
        const rechazos = leerEstado().rechazos + 1;
        if (rechazos >= MAX_RECHAZOS) {
            ocultarBurbuja({ rechazos: 0, pausaHasta: Date.now() + DESCANSO_MS, volviendo: true });
            setDespedida(true);
        } else ocultarBurbuja({ rechazos });
    }

    // Tocarlo es interés: se reinicia la cuenta de cierres.
    function tocarBurbuja() {
        if (burbuja?.enlace) {
            ocultarBurbuja({ rechazos: 0 });
            router.visit(burbuja.enlace);
        } else abrir();
    }

    function abrir() {
        if (burbuja) setBurbuja(null);
        guardarEstado({ rechazos: 0 });
        setAbierto(true);
    }

    // Al cerrar el chat, el siguiente aviso llega un intervalo después (no de inmediato).
    function cerrar() {
        setAbierto(false);
        guardarEstado({ ultimo: Date.now() });
        onCerrado?.();
    }

    function scrollAbajo() {
        requestAnimationFrame(() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' }));
    }

    async function enviar() {
        const texto = entrada.trim();
        if (!texto || enviando) return;
        const historial = mensajes
            .slice(1) // sin el saludo inicial
            .slice(-MAX_HISTORIAL)
            .map(({ autor, texto }) => ({ autor, texto }));
        setMensajes((m) => [...m, { autor: 'usuario', texto }]);
        setEntrada('');
        setEnviando(true);
        scrollAbajo();
        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ mensaje: texto, historial }),
            });
            if (res.status === 429) {
                setMensajes((m) => [...m, { autor: 'bot', texto: 'Vas muy rápido 😅 Espera un minuto y vuelve a preguntarme.' }]);
                return;
            }
            const data = await res.json();
            setMensajes((m) => [...m, { autor: 'bot', texto: data.respuesta ?? 'No pude procesar tu pregunta.', fuente: data.fuente }]);
        } catch {
            setMensajes((m) => [...m, { autor: 'bot', texto: 'No pude conectarme. Inténtalo de nuevo en un momento.' }]);
        } finally {
            setEnviando(false);
            scrollAbajo();
        }
    }

    return (
        // Abierto: el panel llega casi hasta el borde inferior y el botón de cerrar queda a su
        // izquierda (en celular no hay espacio: se cierra con el botón de la cabecera del chat).
        <div className="fixed right-4 bottom-4 z-[90] flex items-end justify-end gap-3">
            {despedida && !abierto && (
                <div
                    role="status"
                    className="it-chat-panel mb-1 w-[min(250px,calc(100vw-7rem))] rounded-2xl rounded-br-sm border border-slate-200 bg-white p-3 text-left shadow-[0_15px_40px_rgba(15,23,42,.2)] dark:border-slate-700 dark:bg-slate-900"
                >
                    <span className="block text-sm font-bold text-[#0c2340] dark:text-white">Entendido, no te interrumpo por un rato 😊</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Si me necesitas, toca el bot cuando quieras.
                    </span>
                </div>
            )}
            {burbuja && !abierto && (
                <div
                    role="status"
                    className="it-chat-panel relative mb-1 w-[min(250px,calc(100vw-7rem))] rounded-2xl rounded-br-sm border border-slate-200 bg-white p-3 pr-8 text-left shadow-[0_15px_40px_rgba(15,23,42,.2)] dark:border-slate-700 dark:bg-slate-900"
                >
                    <button type="button" onClick={tocarBurbuja} className="block text-left">
                        <span className="block text-sm font-bold text-[#0c2340] dark:text-white">{burbuja.titulo}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{burbuja.texto}</span>
                    </button>
                    <button
                        type="button"
                        onClick={rechazarBurbuja}
                        aria-label="Cerrar mensaje"
                        className="absolute top-2 right-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            <button
                onClick={() => (abierto ? cerrar() : abrir())}
                className={`it-chat-trigger group shrink-0 ${abierto ? 'max-sm:hidden' : ''}`}
                aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}
            >
                <span className="absolute inset-0 rounded-full bg-sky-400/30 blur-xl transition group-hover:bg-sky-400/50" />
                {abierto ? <X className="relative h-6 w-6" /> : <Bot className="relative h-7 w-7" />}
                {/* Punto verde: el asistente está disponible. */}
                {!abierto && <span className="absolute top-1 right-1 h-3 w-3 rounded-full border-2 border-[var(--it-primary)] bg-emerald-400" />}
            </button>
            {abierto && (
                <section className="it-chat-panel flex h-[min(680px,calc(100svh-2rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,.25)] dark:border-slate-800 dark:bg-slate-950">
                    <header className="relative overflow-hidden bg-[#0b2442] px-5 py-4 text-white">
                        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-sky-400/20 blur-2xl" />
                        <div className="relative flex items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                                <Bot className="h-5 w-5 text-sky-200" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">Asistente IngeTech</span>
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
                                </div>
                                <p className="mt-0.5 text-xs text-slate-300">Orientación inteligente sobre tecnología</p>
                            </div>
                            <button
                                onClick={cerrar}
                                aria-label="Minimizar asistente"
                                className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 transition hover:bg-white/15"
                            >
                                <Minimize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </header>
                    <div ref={listaRef} className="it-scrollbar flex-1 space-y-4 overflow-y-auto bg-slate-50/80 p-4 dark:bg-slate-900/80">
                        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <Sparkles className="h-3 w-3 text-sky-500" /> Asistente IA
                        </div>
                        {mensajes.map((m, i) => (
                            <div key={i} className={`flex items-end gap-2 ${m.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                                {m.autor === 'bot' && (
                                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0b2442] text-white shadow-sm">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-3.5 py-3 text-sm leading-6 whitespace-pre-line shadow-sm ${m.autor === 'usuario' ? 'rounded-br-md bg-[var(--it-primary)] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'}`}
                                >
                                    {m.texto}
                                    {m.fuente === 'gemini' && (
                                        <span className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                                            <Sparkles className="h-3 w-3" /> Respuesta generada con IA (Gemini)
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {enviando && (
                            <div className="flex items-end gap-2">
                                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#0b2442] text-white">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="rounded-2xl rounded-bl-md border bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                    <span className="flex gap-1">
                                        <i className="it-dot" />
                                        <i className="it-dot" />
                                        <i className="it-dot" />
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void enviar();
                        }}
                        className="border-t bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                    >
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-900">
                            <input
                                ref={inputRef}
                                value={entrada}
                                onChange={(e) => setEntrada(e.target.value)}
                                placeholder="Escribe tu pregunta…"
                                maxLength={500}
                                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!entrada.trim() || enviando}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--it-primary)] text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-40"
                                aria-label="Enviar"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-2 text-center text-[10px] text-slate-400">
                            No compartas datos personales (DNI, teléfono, tarjetas) en el chat.
                        </p>
                    </form>
                </section>
            )}
        </div>
    );
}
