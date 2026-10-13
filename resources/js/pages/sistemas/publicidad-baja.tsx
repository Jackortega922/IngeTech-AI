import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, MailX } from 'lucide-react';
import { useState } from 'react';

// Darse de baja de las ofertas por correo (PublicidadController). Se llega desde el enlace del
// correo; abrirlo no da de baja: hay que confirmar con el botón.
export default function PublicidadBaja({ correo, recibe, hecho, url }: { correo: string; recibe: boolean; hecho: boolean; url: string }) {
    const [enviando, setEnviando] = useState(false);

    return (
        <>
            <Head title="Ofertas por correo — IngeTech AI" />
            <div className="min-h-screen bg-slate-50 text-[#0c2340] dark:bg-slate-950 dark:text-white">
                <header className="border-b border-slate-200 dark:border-white/10">
                    <div className="mx-auto flex max-w-3xl items-center px-6 py-5">
                        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-[#07111f]">✦</span>
                            Inge<span className="text-sky-600 dark:text-cyan-400">Tech</span> AI
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-md px-6 py-14">
                    {hecho || !recibe ? (
                        <>
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            <h1 className="mt-4 text-3xl font-bold">Listo, no te enviaremos más ofertas</h1>
                            <p className="mt-3 text-slate-600 dark:text-slate-300">
                                {correo} ya no recibirá cupones ni promociones. Los correos de tus pedidos y reclamos te seguirán llegando.
                            </p>
                            <p className="mt-3 text-sm text-slate-500">Si cambias de idea, puedes volver a aceptarlas en Ajustes → Perfil.</p>
                        </>
                    ) : (
                        <>
                            <MailX className="h-12 w-12 text-sky-600 dark:text-cyan-400" />
                            <h1 className="mt-4 text-3xl font-bold">¿Dejar de recibir ofertas?</h1>
                            <p className="mt-3 text-slate-600 dark:text-slate-300">
                                Ya no enviaremos cupones ni promociones a {correo}. Los correos de tus pedidos y reclamos te seguirán llegando.
                            </p>
                            <button
                                onClick={() => router.post(url, {}, { onStart: () => setEnviando(true), onFinish: () => setEnviando(false) })}
                                disabled={enviando}
                                className="mt-6 w-full rounded-xl bg-[#0c2340] px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-cyan-400 dark:text-[#07111f]"
                            >
                                {enviando ? 'Guardando…' : 'Sí, dejar de recibirlas'}
                            </button>
                        </>
                    )}
                    <Link href="/" className="mt-6 inline-block text-sm text-sky-700 underline dark:text-cyan-300">
                        Ir a la tienda
                    </Link>
                </main>
            </div>
        </>
    );
}
