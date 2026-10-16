import EncuestaSatisfaccion, { type DatosEncuesta } from '@/components/tienda/encuesta-satisfaccion';
import { Head, Link } from '@inertiajs/react';
import { PackageCheck } from 'lucide-react';

// Encuesta de satisfacción desde el enlace firmado del correo de "entregado" (EncuestaController).
// Sirve sin iniciar sesión, así que no muestra dirección ni teléfono: solo la laptop y el código.
export default function EncuestaPagina({ codigo, laptop, encuesta }: { codigo: string; laptop: string | null; encuesta: DatosEncuesta | null }) {
    return (
        <>
            <Head title="¿Qué tal te fue?" />
            <div className="min-h-screen bg-slate-50 text-[#0c2340] dark:bg-slate-950 dark:text-white">
                <header className="border-b border-slate-200 dark:border-white/10">
                    <div className="mx-auto flex max-w-2xl items-center px-6 py-5">
                        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-[#07111f]">✦</span>
                            Inge<span className="text-sky-600 dark:text-cyan-400">Tech</span> AI
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-2xl px-6 py-12">
                    <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <PackageCheck className="h-4 w-4" /> Pedido <span className="font-mono font-semibold">{codigo}</span>
                        {laptop && <> · {laptop}</>}
                    </p>
                    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
                        {encuesta ? (
                            <EncuestaSatisfaccion datos={encuesta} />
                        ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                La encuesta se abre cuando el pedido ya fue entregado. Te avisaremos por correo.
                            </p>
                        )}
                    </section>
                    <Link href="/" className="mt-6 inline-block text-sm text-sky-700 underline dark:text-cyan-300">
                        Ir a la tienda
                    </Link>
                </main>
            </div>
        </>
    );
}
