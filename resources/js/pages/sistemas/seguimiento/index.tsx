import ChatWidget from '@/components/chat-widget';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, PackageSearch } from 'lucide-react';

// Seguimiento para quien compró sin cuenta: con el código y el correo de la compra vuelve a ver
// su pedido desde cualquier navegador. Con cuenta, los pedidos ya están en "Mis pedidos".
export default function SeguimientoIndex() {
    const { auth } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors } = useForm({ codigo: '', email: '' });

    const input =
        'w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none';

    return (
        <>
            <Head title="Seguimiento de pedido — IngeTech AI" />
            <div className="min-h-screen bg-[#07111f] text-white">
                <header className="border-b border-white/10">
                    <div className="mx-auto flex max-w-3xl items-center px-6 py-5">
                        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-[#07111f]">✦</span>
                            Inge<span className="text-cyan-400">Tech</span> AI
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-md px-6 py-14">
                    <PackageSearch className="h-12 w-12 text-cyan-400" />
                    <h1 className="mt-4 text-3xl font-bold">Sigue tu pedido</h1>
                    <p className="mt-2 text-slate-400">Ingresa el código que recibiste al comprar y el correo que usaste.</p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            post('/seguimiento');
                        }}
                        className="mt-8 space-y-4"
                    >
                        <label className="block">
                            <span className="mb-1.5 block text-sm text-slate-300">Código de pedido</span>
                            <input
                                value={data.codigo}
                                onChange={(e) => setData('codigo', e.target.value.toUpperCase())}
                                placeholder="IT-XXXXXXXX"
                                autoComplete="off"
                                className={`${input} font-mono tracking-wider uppercase`}
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm text-slate-300">Correo de la compra</span>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="email"
                                className={input}
                            />
                        </label>

                        {(errors.codigo || errors.email) && (
                            <p className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                {errors.codigo ?? errors.email}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={processing || !data.codigo || !data.email}
                            className="w-full rounded-xl bg-cyan-400 py-3 font-bold text-[#07111f] transition hover:bg-cyan-300 disabled:opacity-50"
                        >
                            {processing ? 'Buscando…' : 'Ver mi pedido'}
                        </button>
                    </form>

                    <p className="mt-8 text-sm text-slate-400">
                        {auth.user ? (
                            <>
                                Tus compras con esta cuenta están en{' '}
                                <Link href="/dashboard#pedidos" className="text-cyan-400 underline">
                                    Mis pedidos
                                </Link>
                                .
                            </>
                        ) : (
                            <>
                                ¿Tienes cuenta?{' '}
                                <Link href="/login" className="text-cyan-400 underline">
                                    Ingresa
                                </Link>{' '}
                                y encuentra tus compras en "Mis pedidos".
                            </>
                        )}
                    </p>
                </main>
                <ChatWidget />
            </div>
        </>
    );
}
