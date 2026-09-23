import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Términos y Garantía', href: '/derecho' }];

/**
 * Aporte de Derecho: términos de uso, garantía y política de devoluciones
 * de una tienda de tecnología. Ver docs/contexto-proyecto.md §5.1.
 */
const SECCIONES = [
    {
        titulo: 'Términos de uso',
        texto: 'IngeTech AI es un asesor de compra: recomienda equipos según tu carrera, actividades y presupuesto, comparando specs contra requisitos de software. Los precios y disponibilidad son referenciales y pueden variar respecto a lo verificado en tienda al momento de tu visita.',
    },
    {
        titulo: 'Garantía de los equipos',
        texto: 'Todo equipo recomendado mantiene la garantía de fábrica del fabricante (típicamente 12 meses contra defectos de fabricación). La garantía cubre fallas de hardware bajo uso normal; no cubre daños por mal uso, líquidos, o modificaciones no autorizadas.',
    },
    {
        titulo: 'Política de devoluciones',
        texto: 'Puedes solicitar el cambio o devolución de un equipo dentro de los 7 días calendario posteriores a la compra, siempre que esté en las mismas condiciones en que se entregó (empaque original, sin señales de uso). Pasado ese plazo, aplica solo la garantía de fábrica.',
    },
    {
        titulo: 'Protección de datos del perfil',
        texto: 'Tu perfil (carrera, actividades, presupuesto) se guarda únicamente para generar tu historial de recomendaciones y estadísticas de uso del sistema. No se comparte con terceros ni se usa con fines distintos a mejorar la recomendación.',
    },
];

export default function DerechoIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Términos y Garantía" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Términos, Garantía y Devoluciones</h1>
                    <p className="text-muted-foreground">Lo que necesitas saber antes de confirmar un equipo recomendado.</p>
                </div>

                <div className="max-w-3xl space-y-3">
                    {SECCIONES.map((s) => (
                        <details key={s.titulo} className="group open:bg-muted/30 rounded-xl border p-4">
                            <summary className="cursor-pointer list-none font-semibold marker:content-none">
                                <span className="flex items-center justify-between">
                                    {s.titulo}
                                    <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                                </span>
                            </summary>
                            <p className="text-muted-foreground mt-3 text-sm">{s.texto}</p>
                        </details>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
