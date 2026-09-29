import { enlaceWhatsapp, WhatsappIcon } from '@/components/tienda/whatsapp-button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BadgeCheck, Clock, Facebook, Headset, Instagram, Mail, MapPin, Music2, Phone, Sparkles, Truck, Youtube } from 'lucide-react';
import type { ComponentType } from 'react';

// Lo que la tienda ofrece. "Pago seguro" no aparece a propósito: no hay pago en línea (la
// compra se cierra con un asesor), así que no se promete.
export const BENEFICIOS = [
    { icon: Truck, titulo: 'Envíos a todo el Perú', texto: 'Llevamos tu laptop hasta tu ciudad.' },
    { icon: Headset, titulo: 'Soporte técnico', texto: 'Te ayudamos con la configuración y el uso.' },
    { icon: BadgeCheck, titulo: 'Garantía', texto: 'Equipos nuevos con garantía de fábrica.' },
    { icon: Sparkles, titulo: 'Asesoría con IA', texto: 'Te recomendamos la laptop según lo que haces.' },
];

const MARCAS = ['Lenovo', 'HP', 'Apple', 'ASUS', 'Acer'];

export default function StoreFooter() {
    const { contacto } = usePage<SharedData>().props;

    const redes: { nombre: string; url: string | null; icon: ComponentType<{ className?: string }> }[] = [
        { nombre: 'Facebook', url: contacto.redes.facebook, icon: Facebook },
        { nombre: 'Instagram', url: contacto.redes.instagram, icon: Instagram },
        { nombre: 'TikTok', url: contacto.redes.tiktok, icon: Music2 },
        { nombre: 'YouTube', url: contacto.redes.youtube, icon: Youtube },
    ];

    return (
        <footer className="border-t border-white/10 bg-[#050d18] text-sm text-slate-400">
            {/* Franja de beneficios */}
            <div className="border-b border-white/10">
                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
                    {BENEFICIOS.map((b) => (
                        <div key={b.titulo} className="flex items-start gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-400">
                                <b.icon className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-semibold text-white">{b.titulo}</p>
                                <p className="mt-0.5 text-xs">{b.texto}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
                <div>
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-[#07111f]">✦</span>
                        Inge<span className="text-cyan-400">Tech</span> AI
                    </Link>
                    <p className="mt-4 leading-6">
                        Laptops nuevas para estudiar, trabajar y crear, con una recomendación hecha con inteligencia artificial según lo que realmente
                        vas a hacer.
                    </p>
                    <div className="mt-5 flex gap-2">
                        {redes.map((r) =>
                            r.url ? (
                                <a
                                    key={r.nombre}
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={r.nombre}
                                    title={r.nombre}
                                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
                                >
                                    <r.icon className="h-4 w-4" />
                                </a>
                            ) : (
                                // Sin enlace configurado: se muestra atenuado en vez de apuntar a una cuenta inventada.
                                <span
                                    key={r.nombre}
                                    title={`${r.nombre} (enlace por configurar)`}
                                    className="grid h-10 w-10 place-items-center rounded-full border border-white/5 text-slate-600"
                                >
                                    <r.icon className="h-4 w-4" />
                                </span>
                            ),
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-white">Laptops por marca</h3>
                    <ul className="mt-4 space-y-2.5">
                        {MARCAS.map((m) => (
                            <li key={m}>
                                <a href={`/?marca=${encodeURIComponent(m)}#productos`} className="transition hover:text-cyan-400">
                                    Laptops {m}
                                </a>
                            </li>
                        ))}
                        <li>
                            <Link href="/hardware" className="transition hover:text-cyan-400">
                                Ver todo el catálogo
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold text-white">Ayuda</h3>
                    <ul className="mt-4 space-y-2.5">
                        <li>
                            <Link href="/register" className="transition hover:text-cyan-400">
                                Recomendación con IA
                            </Link>
                        </li>
                        <li>
                            <Link href="/comparador" className="transition hover:text-cyan-400">
                                Comparador de laptops
                            </Link>
                        </li>
                        <li>
                            <Link href="/seguimiento" className="transition hover:text-cyan-400">
                                Seguimiento de pedido
                            </Link>
                        </li>
                        <li>
                            <Link href="/preguntas" className="transition hover:text-cyan-400">
                                Preguntas frecuentes
                            </Link>
                        </li>
                        <li>
                            <Link href="/derecho" className="transition hover:text-cyan-400">
                                Términos, garantía y devoluciones
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold text-white">Contacto</h3>
                    <ul className="mt-4 space-y-3">
                        {contacto.whatsapp && (
                            <li>
                                <a
                                    href={enlaceWhatsapp(contacto.whatsapp, 'Hola, quiero información sobre sus laptops.')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 transition hover:text-cyan-400"
                                >
                                    <WhatsappIcon className="h-4 w-4" /> WhatsApp +{contacto.whatsapp}
                                </a>
                            </li>
                        )}
                        {contacto.telefono && (
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0" /> {contacto.telefono}
                            </li>
                        )}
                        {contacto.email && (
                            <li>
                                <a href={`mailto:${contacto.email}`} className="flex items-center gap-2 transition hover:text-cyan-400">
                                    <Mail className="h-4 w-4 shrink-0" /> {contacto.email}
                                </a>
                            </li>
                        )}
                        {contacto.direccion && (
                            <li className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {contacto.direccion}
                            </li>
                        )}
                        {contacto.horario && (
                            <li className="flex items-start gap-2">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0" /> {contacto.horario}
                            </li>
                        )}
                        <li className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" /> O pregúntale al asistente del chat, abajo a la derecha.
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs sm:flex-row sm:items-center sm:justify-between lg:px-10">
                    <p>© 2026 IngeTech AI · UNHEVAL · Grupo 12. Todos los derechos reservados.</p>
                    <p>Precios referenciales en soles (S/), sujetos a stock.</p>
                </div>
            </div>
        </footer>
    );
}
