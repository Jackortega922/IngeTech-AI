// Contabilidad en el frontend. Los valores deben coincidir con config/tienda.php.

// Vida útil contable de una laptop: la depreciación de "equipos de procesamiento de datos" es como
// máximo 25% anual en Perú (Reglamento de la Ley del Impuesto a la Renta, art. 22) → 4 años.
export const VIDA_UTIL_ANIOS = 4;

// Costo de la laptop repartido en su vida útil (depreciación lineal): ayuda a comparar una
// laptop cara que dura con una barata que habrá que cambiar antes.
export function costoAnual(precio: number | string): number {
    return Math.round(Number(precio) / VIDA_UTIL_ANIOS);
}

export const soles = (n: number | string, decimales = 0) =>
    `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`;
