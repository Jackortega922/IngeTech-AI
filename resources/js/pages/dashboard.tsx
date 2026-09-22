import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Cpu, Sparkles, Wand2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
];

const pasos = [
    { icon: Sparkles, titulo: 'Cuéntanos de ti', texto: 'Tu carrera, actividades y software que usas.' },
    { icon: Cpu, titulo: 'Recibe tu recomendación', texto: 'Laptops con % de compatibilidad y por qué te sirven.' },
    { icon: Wand2, titulo: 'Personalízala', texto: 'Ajusta RAM, almacenamiento, kits y accesorios.' },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-8">
                    <p className="text-muted-foreground text-sm">Hola, {auth.user.name} 👋</p>
                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">¿Buscamos tu próxima laptop?</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Responde unas preguntas sobre tu carrera y lo que necesitas hacer, y te recomendamos la mejor opción para tu presupuesto.
                    </p>
                    <Link
                        href="/perfil"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
                    >
                        Nueva recomendación <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {pasos.map((paso, i) => (
                        <div key={paso.titulo} className="rounded-xl border p-5">
                            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                                <paso.icon className="h-5 w-5" />
                                <span className="text-xs font-bold">Paso {i + 1}</span>
                            </div>
                            <h3 className="mt-3 font-semibold">{paso.titulo}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">{paso.texto}</p>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
