import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Perfil',
        href: '/settings/profile',
    },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    // Ruta detrás de `auth` (routes/settings.php): siempre hay sesión aquí.
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        // Las cuentas creadas antes de separar el nombre traen todo en `nombres` hasta que lo editen.
        nombres: auth.user!.nombres ?? auth.user!.name,
        apellidos: auth.user!.apellidos ?? '',
        email: auth.user!.email,
        acepta_publicidad: auth.user!.acepta_publicidad_at !== null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Perfil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Datos del perfil" description="Actualiza tu nombre y tu correo" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nombres">Nombres</Label>
                                <Input
                                    id="nombres"
                                    className="mt-1 block w-full"
                                    value={data.nombres}
                                    onChange={(e) => setData('nombres', e.target.value)}
                                    required
                                    autoComplete="given-name"
                                    placeholder="Tus nombres"
                                />
                                <InputError className="mt-2" message={errors.nombres} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="apellidos">Apellidos</Label>
                                <Input
                                    id="apellidos"
                                    className="mt-1 block w-full"
                                    value={data.apellidos}
                                    onChange={(e) => setData('apellidos', e.target.value)}
                                    required
                                    autoComplete="family-name"
                                    placeholder="Tus apellidos"
                                />
                                <InputError className="mt-2" message={errors.apellidos} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo electrónico</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Correo electrónico"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user!.email_verified_at === null && (
                            <div>
                                <p className="mt-2 text-sm text-neutral-800">
                                    Tu correo todavía no está confirmado.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="rounded-md text-sm text-neutral-600 underline hover:text-neutral-900 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                                    >
                                        Reenviar el correo de confirmación.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        Te enviamos un nuevo enlace de confirmación a tu correo.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ofertas por correo: solo para clientes (el personal no las recibe). */}
                        {!auth.user!.es_personal && (
                            <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm">
                                <Checkbox
                                    className="mt-0.5"
                                    checked={data.acepta_publicidad}
                                    onCheckedChange={(v) => setData('acepta_publicidad', v === true)}
                                />
                                <span>Quiero recibir ofertas y cupones por correo. Si lo desmarcas, dejamos de enviártelas.</span>
                            </label>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Guardar</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Guardado</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <MisDatos esCliente={!auth.user!.es_personal} />

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}

// Derechos ARCO (Ley 29733): dónde ejercer cada uno, y la descarga de todos sus datos (acceso).
function MisDatos({ esCliente }: { esCliente: boolean }) {
    return (
        <div className="space-y-4">
            <HeadingSmall title="Tus datos personales" description="Tus derechos de acceso, rectificación, cancelación y oposición (Ley N.° 29733)" />
            <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>
                    <b className="text-foreground">Acceso:</b> descarga en un archivo todo lo que guardamos de ti: cuenta, consultas a la IA, pedidos,
                    reclamos{esCliente ? ', cuestionario y cupones recibidos' : ''}.
                </li>
                <li>
                    <b className="text-foreground">Rectificación:</b> corrige tu nombre o correo en el formulario de arriba.
                </li>
                {esCliente && (
                    <li>
                        <b className="text-foreground">Oposición:</b> desmarca las ofertas por correo arriba, y borra o vuelve a responder el
                        cuestionario desde tu panel.
                    </li>
                )}
                <li>
                    <b className="text-foreground">Cancelación:</b> elimina tu cuenta más abajo.
                </li>
            </ul>
            <a
                href={route('profile.datos')}
                download
                className="hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
            >
                <Download className="h-4 w-4" /> Descargar mis datos
            </a>
        </div>
    );
}
