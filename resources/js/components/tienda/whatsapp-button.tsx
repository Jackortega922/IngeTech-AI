import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { useState } from 'react';

// Ícono de WhatsApp armado con lucide (burbuja + teléfono): la librería no trae logos de marca
// y no vale la pena sumar una dependencia solo por uno.
export function WhatsappIcon({ className = 'h-6 w-6' }: { className?: string }) {
    return (
        <span className={`relative inline-flex items-center justify-center ${className}`}>
            <MessageCircle className="h-full w-full" />
            <Phone className="absolute h-[42%] w-[42%]" strokeWidth={2.5} />
        </span>
    );
}

export function enlaceWhatsapp(numero: string, mensaje: string) {
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

// Botón flotante abajo a la izquierda (a la derecha va el chat del asistente). Si la tienda
// todavía no configuró su número (TIENDA_WHATSAPP), no se inventa uno: se avisa.
export default function WhatsappButton() {
    const { contacto } = usePage<SharedData>().props;
    const [aviso, setAviso] = useState(false);
    const clases =
        'flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/30 transition hover:scale-105 hover:bg-[#1ebe5a]';

    return (
        <div className="fixed bottom-5 left-5 z-50">
            {aviso && (
                <div className="mb-3 flex w-64 items-start gap-2 rounded-xl border border-white/10 bg-[#0d1d31] p-3 text-xs text-slate-300 shadow-2xl">
                    <span className="flex-1">
                        El WhatsApp de la tienda todavía no está configurado. Mientras tanto, escríbele al asistente del chat.
                    </span>
                    <button onClick={() => setAviso(false)} aria-label="Cerrar aviso">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            {contacto.whatsapp ? (
                <a
                    href={enlaceWhatsapp(contacto.whatsapp, 'Hola, quiero información sobre sus laptops.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Escríbenos por WhatsApp"
                    title="Escríbenos por WhatsApp"
                    className={clases}
                >
                    <WhatsappIcon />
                </a>
            ) : (
                <button type="button" onClick={() => setAviso((v) => !v)} aria-label="WhatsApp" title="WhatsApp" className={clases}>
                    <WhatsappIcon />
                </button>
            )}
        </div>
    );
}
