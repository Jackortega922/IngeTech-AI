import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpenText, CheckCircle2, Clock, FileSearch, PenLine } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Libro de Reclamaciones', href: '/libro-reclamaciones' },
    { title: 'Consultar', href: '/libro-reclamaciones/consultar' },
];

interface HojaResumen {
    numero: string;
    tipo: 'reclamo' | 'queja';
    descripcion_bien: string;
    estado: 'pendiente' | 'respondido';
    created_at: string;
    fecha_limite: string;
}

const fecha = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-PE', { dateStyle: 'medium' });

/**
 * Consultar el estado de una hoja del Libro de Reclamaciones (separada de la página para
 * presentarla). Con cuenta, se listan las hojas propias; sin cuenta (o para una hoja presentada
 * como invitado), se busca con número + correo.
 */
export default function ConsultarReclamo({ misHojas }: { misHojas: HojaResumen[] }) {
    const { auth } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors } = useForm({ numero: '', email: auth.user?.email ?? '' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consultar mi reclamo" />

            <main className="it-container max-w-3xl space-y-6 py-7 sm:py-9">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2340] p-7 text-white shadow-xl sm:p-9">
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(56,189,248,.18),transparent_55%)]" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10">
                            <FileSearch className="h-8 w-8 text-sky-200" />
                        </span>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Consultar mi reclamo</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                Revisa en qué estado está tu hoja del Libro de Reclamaciones y la respuesta de la tienda.
                            </p>
                        </div>
                    </div>
                </section>

                {auth.user && (
                    <section className="it-card p-6">
                        <h2 className="text-lg font-black">Mis hojas</h2>
                        {misHojas.length === 0 ? (
                            <p className="mt-2 text-sm text-slate-500">
                                No tienes hojas con tu cuenta. Si presentaste una sin iniciar sesión, búscala abajo con su número y tu correo.
                            </p>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {misHojas.map((h) => (
                                    <li key={h.numero}>
                                        <Link
                                            href={`/libro-reclamaciones/${h.numero}`}
                                            className="flex flex-col gap-2 rounded-2xl border p-4 transition hover:border-sky-400 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <span className="min-w-0">
                                                <span className="font-mono text-sm font-black">{h.numero}</span>
                                                <span className="ml-2 text-xs text-slate-500 uppercase">{h.tipo}</span>
                                                <span className="block truncate text-sm text-slate-600 dark:text-slate-300">
                                                    {h.descripcion_bien}
                                                </span>
                                                <span className="block text-xs text-slate-500">Presentada el {fecha(h.created_at)}</span>
                                            </span>
                                            <Estado hoja={h} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <section className="it-card p-6">
                    <h2 className="text-lg font-black">{auth.user ? 'Buscar otra hoja' : 'Buscar mi hoja'}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Escribe el número de la hoja (te lo enviamos por correo, empieza con LR-) y el correo con el que la presentaste.
                    </p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            post('/libro-reclamaciones/consultar', { preserveScroll: true });
                        }}
                        className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                    >
                        <input
                            className="it-input uppercase"
                            placeholder="LR-00000001"
                            aria-label="Número de hoja"
                            value={data.numero}
                            onChange={(e) => setData('numero', e.target.value)}
                        />
                        <input
                            type="email"
                            className="it-input"
                            placeholder="Correo"
                            aria-label="Correo"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <button type="submit" disabled={processing} className="it-btn it-btn-primary">
                            Consultar <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>
                    <InputError message={errors.numero ?? errors.email} className="mt-2" />
                </section>

                <Link href="/libro-reclamaciones" className="it-card flex items-center gap-4 p-5 transition hover:border-sky-400">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--it-primary-soft)] text-[var(--it-primary)] dark:text-sky-300">
                        <PenLine className="h-5 w-5" />
                    </span>
                    <span>
                        <b className="block">¿Aún no presentas tu reclamo o queja?</b>
                        <span className="text-sm text-slate-500">Llena la hoja del Libro de Reclamaciones.</span>
                    </span>
                    <BookOpenText className="ml-auto h-5 w-5 text-slate-400" />
                </Link>
            </main>
        </AppLayout>
    );
}

function Estado({ hoja }: { hoja: HojaResumen }) {
    return hoja.estado === 'respondido' ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Respondida
        </span>
    ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" /> En revisión · respuesta hasta el {fecha(hoja.fecha_limite)}
        </span>
    );
}
