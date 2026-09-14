import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="IngeTech AI" />
            <div className="bg-background text-foreground flex min-h-screen flex-col">
                <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
                    <span className="text-lg font-semibold">IngeTech AI</span>
                    <nav className="flex items-center gap-4 text-sm">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="hover:bg-muted rounded-md border px-4 py-1.5">
                                Panel
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="px-4 py-1.5 hover:underline">
                                    Iniciar sesión
                                </Link>
                                <Link href={route('register')} className="hover:bg-muted rounded-md border px-4 py-1.5">
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
                    <h1 className="text-3xl font-bold sm:text-4xl">
                        Encuentra la laptop que <span className="text-primary">realmente</span> necesitas
                    </h1>
                    <p className="text-muted-foreground max-w-xl">
                        Cuéntanos tu carrera, lo que vas a hacer con el equipo y tu presupuesto. IngeTech AI te recomienda la laptop más compatible y
                        te ayuda a personalizar la configuración.
                    </p>
                    {/* TODO (Módulo B): enlazar al formulario de perfil cuando exista */}
                    <span className="bg-muted text-muted-foreground rounded-md px-4 py-2 text-sm">
                        El flujo de recomendación está en construcción
                    </span>
                </main>
            </div>
        </>
    );
}
