import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Battery, Recycle, ShieldCheck, Wrench } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reciclaje y sostenibilidad', href: '/ing-ambiental' }];

/**
 * Aporte de Ingeniería Ambiental: educación sobre reciclaje/e-waste al
 * comprar un equipo nuevo. Ver docs/contexto-proyecto.md §5.1.
 */
const TARJETAS = [
    {
        icon: Recycle,
        titulo: '¿Qué hacer con tu equipo anterior?',
        texto: 'No lo tires a la basura común: una laptop contiene metales pesados (plomo, mercurio) que contaminan el suelo y el agua si se desechan mal. Llévalo a un punto de acopio de residuos electrónicos (RAEE) — muchas tiendas de tecnología los reciben aunque no sean de su marca.',
    },
    {
        icon: Wrench,
        titulo: 'Alarga la vida útil antes de reciclar',
        texto: 'Antes de desechar un equipo, evalúa si una mejora simple (más RAM, cambiar el disco a SSD) le da 1-2 años más de vida. Personalizar en vez de reemplazar es la forma más efectiva de reducir residuo electrónico.',
    },
    {
        icon: Battery,
        titulo: 'Baterías: el residuo más peligroso',
        texto: 'Las baterías de litio no deben mezclarse con la basura común: pueden generar incendios y contienen materiales tóxicos. Se depositan por separado en puntos de acopio especializados.',
    },
    {
        icon: ShieldCheck,
        titulo: 'Borra tus datos antes de entregar el equipo',
        texto: 'Antes de reciclar o donar un equipo, haz un borrado seguro de tu información (no basta con formatear). Muchos puntos de acopio también ofrecen este servicio.',
    },
];

export default function IngAmbientalIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reciclaje y sostenibilidad" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Reciclaje y sostenibilidad</h1>
                    <p className="text-muted-foreground">
                        Comprar un equipo nuevo es también una oportunidad para desechar bien el anterior. Esto es lo que debes saber.
                    </p>
                </div>

                <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
                    {TARJETAS.map((t) => {
                        const Icon = t.icon;

                        return (
                            <div key={t.titulo} className="bg-card rounded-2xl border p-5 shadow-sm">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-bold">{t.titulo}</h3>
                                <p className="text-muted-foreground mt-2 text-sm">{t.texto}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
