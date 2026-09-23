import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Preguntas frecuentes', href: '/preguntas' }];

const PREGUNTAS = [
    {
        q: '¿Cómo calcula el sistema la recomendación?',
        a: 'A partir de tu carrera identificamos qué software usan típicamente los estudiantes (por ejemplo AutoCAD para Civil, o Docker para Sistemas), y de ahí derivamos cuánta RAM, qué procesador y si necesitas GPU dedicada. Con eso filtramos el catálogo por tu presupuesto y portabilidad, y clasificamos lo que queda en Mejor Opción Económica, Opción Equilibrada y Mejor Rendimiento.',
    },
    {
        q: '¿Qué significa el % de compatibilidad?',
        a: 'Compara la RAM y el procesador del equipo contra lo que tu carrera necesita como mínimo. 100% significa que el equipo cubre holgadamente esos requisitos; un porcentaje más bajo indica que apenas los alcanza.',
    },
    {
        q: '¿Puedo comparar varios equipos?',
        a: 'Sí. Desde el Catálogo de Hardware marca hasta 3 equipos con el checkbox y entra a "Comparador" para verlos lado a lado con todas sus especificaciones.',
    },
    {
        q: '¿Qué incluyen los kits?',
        a: 'Cada kit agrupa accesorios (mochila, mouse, cooler, etc.) a un precio conjunto, normalmente más barato que comprarlos por separado. Los eliges en la pantalla de Personalización, después de escoger tu equipo.',
    },
    {
        q: '¿Puedo cambiar la RAM o el almacenamiento del equipo recomendado?',
        a: 'Sí, en la pantalla de Personalización puedes subir la RAM o el almacenamiento dentro de las opciones disponibles para ese modelo, y el precio final se recalcula al instante.',
    },
    {
        q: '¿Quién puede entrar al panel de Administración?',
        a: 'Solo las cuentas marcadas como administrador. Ahí se gestionan las carreras, el catálogo de software (con sus requisitos) y el catálogo de hardware, además de ver métricas de uso del sistema.',
    },
    {
        q: '¿Qué hago si ningún equipo cumple mis requisitos dentro del presupuesto?',
        a: 'El sistema te avisa con el mensaje "sin resultados" y te muestra las opciones más cercanas dentro de tu presupuesto, aunque no cumplan todos los requisitos. Puedes subir el presupuesto o cambiar la preferencia de portabilidad (laptop / escritorio) para ver más opciones.',
    },
];

export default function PreguntasIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Preguntas frecuentes" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Preguntas frecuentes</h1>
                    <p className="text-muted-foreground">
                        ¿No encuentras lo que buscas? Usa el asistente (💬 abajo a la derecha) y pregúntale directamente.
                    </p>
                </div>

                <div className="max-w-3xl space-y-3">
                    {PREGUNTAS.map((item) => (
                        <details key={item.q} className="group open:bg-muted/30 rounded-xl border p-4">
                            <summary className="cursor-pointer list-none font-semibold marker:content-none">
                                <span className="flex items-center justify-between">
                                    {item.q}
                                    <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                                </span>
                            </summary>
                            <p className="text-muted-foreground mt-3 text-sm">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
