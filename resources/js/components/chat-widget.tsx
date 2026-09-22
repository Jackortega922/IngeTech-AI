import { MessageCircle, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Mensaje {
    autor: 'usuario' | 'bot';
    texto: string;
}

const SALUDO: Mensaje = {
    autor: 'bot',
    texto: 'Hola 👋 Soy el asistente de IngeTech AI. Pregúntame por una carrera, un software o un equipo del catálogo.',
};

export default function ChatWidget() {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
    const [entrada, setEntrada] = useState('');
    const [enviando, setEnviando] = useState(false);
    const listaRef = useRef<HTMLDivElement>(null);

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
        <div className="fixed right-5 bottom-5 z-50">
            {abierto && (
                <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
                    <div className="flex items-center justify-between border-b bg-cyan-500 px-4 py-3 text-white">
                        <span className="font-bold">Asistente IngeTech</span>
                        <button onClick={() => setAbierto(false)} aria-label="Cerrar">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div ref={listaRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                        {mensajes.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                                    m.autor === 'usuario' ? 'ml-auto bg-cyan-500 text-white' : 'bg-muted'
                                }`}
                            >
                                {m.texto}
                            </div>
                        ))}
                        {enviando && <div className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">Escribiendo…</div>}
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            enviar();
                        }}
                        className="flex gap-2 border-t p-2"
                    >
                        <input
                            value={entrada}
                            onChange={(e) => setEntrada(e.target.value)}
                            placeholder="Escribe tu pregunta…"
                            className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none"
                        />
                        <button type="submit" className="rounded-lg bg-cyan-500 px-3 text-white hover:bg-cyan-600" aria-label="Enviar">
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setAbierto((v) => !v)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-xl transition hover:bg-cyan-600"
                aria-label="Abrir asistente"
            >
                <MessageCircle className="h-6 w-6" />
            </button>
        </div>
    );
}
