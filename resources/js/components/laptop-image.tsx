import DeviceIllustration from '@/components/device-illustration';

/**
 * Muestra la foto real del equipo si tiene imagen_url (un enlace, no un archivo subido — el
 * plan gratuito de Render no tiene disco persistente). Si no la tiene, cae al ícono
 * ilustrativo por marca que ya existía. Un solo lugar para este criterio, en vez de repetirlo
 * en cada pantalla que muestra una tarjeta de laptop.
 */
export default function LaptopImage({
    imagenUrl,
    marca,
    tipo,
    className,
}: {
    imagenUrl: string | null;
    marca: string;
    tipo: 'laptop' | 'escritorio';
    className?: string;
}) {
    if (imagenUrl) {
        return (
            <img
                src={imagenUrl}
                alt={`Foto de ${marca}`}
                loading="lazy"
                className={`object-cover ${className ?? 'h-32 w-full'}`}
                onError={(e) => {
                    // Enlace roto: se oculta la imagen y no queda un ícono "roto" del navegador.
                    // No hay una foto de respaldo real que mostrar en su lugar aquí.
                    e.currentTarget.style.display = 'none';
                }}
            />
        );
    }

    return <DeviceIllustration marca={marca} tipo={tipo} className={className} />;
}
