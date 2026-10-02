import { Bot, MessageCircle, Minimize2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Mensaje {
    autor: 'usuario' | 'bot';
    texto: string;
}

interface ChatWidgetProps {
    forzarAbierto?: boolean;
    onCerrado?: () => void;
}

const SALUDO: Mensaje = {
    autor: 'bot',
    texto: 'Hola 👋 Soy el asistente de IngeTech AI. Puedo orientarte sobre equipos, software, presupuesto y el proceso de recomendación.',
};

export default function ChatWidget({ forzarAbierto, onCerrado }: ChatWidgetProps = {}) {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
    const [entrada, setEntrada] = useState('');
    const [enviando, setEnviando] = useState(false);
    const listaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (forzarAbierto) setAbierto(true);
    }, [forzarAbierto]);

    useEffect(() => {
        if (abierto) window.setTimeout(() => inputRef.current?.focus(), 120);
    }, [abierto]);

    function cerrar() {
        setAbierto(false);
        onCerrado?.();
    }

    function scrollAbajo() {
        requestAnimationFrame(() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' }));
    }

    async function enviar() {
        const texto = entrada.trim();
        if (!texto || enviando) return;
        setMensajes((m) => [...m, { autor: 'usuario', texto }]);
        setEntrada('');
        setEnviando(true);
        scrollAbajo();
        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ mensaje: texto }),
            });
            const data = await res.json();
            setMensajes((m) => [...m, { autor: 'bot', texto: data.respuesta ?? 'No pude procesar tu pregunta.' }]);
        } catch {
            setMensajes((m) => [...m, { autor: 'bot', texto: 'No pude conectarme. Inténtalo de nuevo en un momento.' }]);
        } finally {
            setEnviando(false);
            scrollAbajo();
        }
    }

    return (
        <div className="fixed right-5 bottom-5 z-[90]">
            {abierto && (
                <section className="it-chat-panel mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,.25)] dark:border-slate-800 dark:bg-slate-950">
                    <header className="relative overflow-hidden bg-[#0b2442] px-5 py-4 text-white">
                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-400/20 blur-2xl" />
                        <div className="relative flex items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                                <Bot className="h-5 w-5 text-sky-200" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2"><span className="font-bold">Asistente IngeTech</span><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" /></div>
                                <p className="mt-0.5 text-xs text-slate-300">Orientación inteligente sobre tecnología</p>
                            </div>
                            <button onClick={cerrar} aria-label="Minimizar asistente" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 transition hover:bg-white/15"><Minimize2 className="h-4 w-4" /></button>
                        </div>
                    </header>
                    <div ref={listaRef} className="it-scrollbar flex-1 space-y-4 overflow-y-auto bg-slate-50/80 p-4 dark:bg-slate-900/80">
                        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950"><Sparkles className="h-3 w-3 text-sky-500" /> Asistente IA</div>
                        {mensajes.map((m, i) => (
                            <div key={i} className={`flex items-end gap-2 ${m.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                                {m.autor === 'bot' && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0b2442] text-white shadow-sm"><Bot className="h-4 w-4" /></div>}
                                <div className={`max-w-[80%] rounded-2xl px-3.5 py-3 text-sm leading-6 shadow-sm ${m.autor === 'usuario' ? 'rounded-br-md bg-[var(--it-primary)] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'}`}>
                                    {m.texto}
                                </div>
                            </div>
                        ))}
                        {enviando && <div className="flex items-end gap-2"><div className="grid h-8 w-8 place-items-center rounded-xl bg-[#0b2442] text-white"><Bot className="h-4 w-4" /></div><div className="rounded-2xl rounded-bl-md border bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"><span className="flex gap-1"><i className="it-dot" /><i className="it-dot" /><i className="it-dot" /></span></div></div>}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); void enviar(); }} className="border-t bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-900">
                            <input ref={inputRef} value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Escribe tu pregunta…" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
                            <button type="submit" disabled={!entrada.trim() || enviando} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--it-primary)] text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-40" aria-label="Enviar"><Send className="h-4 w-4" /></button>
                        </div>
                        <p className="mt-2 text-center text-[10px] text-slate-400">Las respuestas dependen de la información disponible en el sistema.</p>
                    </form>
                </section>
            )}
            <button onClick={() => (abierto ? cerrar() : setAbierto(true))} className="it-chat-trigger group" aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}>
                <span className="absolute inset-0 rounded-full bg-sky-400/30 blur-xl transition group-hover:bg-sky-400/50" />
                {abierto ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
            </button>
        </div>
    );
}
