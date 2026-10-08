import type { Laptop } from '@/types/flujo';

/**
 * Filtros de la vitrina de la portada. Cada grupo tiene opciones con su condición sobre la laptop.
 * Dentro de un grupo las opciones se suman ("HP o Lenovo"); en "Características" se exigen todas
 * ("ligera y con batería larga"). Entre grupos, siempre todas ("HP" y "16 GB").
 *
 * Todo sale de las specs del catálogo: una laptop nueva cargada en el admin cae sola en sus filtros.
 */

// Categorías por uso, derivadas de las specs (no hay columna "categoría" en la BD).
export type Uso = 'estudio' | 'productividad' | 'creativo';

export function usoDe(l: Laptop): Uso {
    if (l.gpu_dedicada) return 'creativo';
    return (l.rendimiento_score ?? 0) >= 60 ? 'productividad' : 'estudio';
}

export interface Opcion {
    valor: string;
    etiqueta: string;
    cumple: (l: Laptop) => boolean;
}

export interface Grupo {
    id: string;
    titulo: string;
    // 'o': basta con una opción (marcas). 'y': deben cumplirse todas (características).
    modo: 'o' | 'y';
    opciones: Opcion[];
}

export type Seleccion = Record<string, string[]>;

const precio = (l: Laptop) => Number(l.precio_soles);
const cpu = (l: Laptop) => l.cpu.toLowerCase();
const unicos = (valores: number[]) => Array.from(new Set(valores)).sort((a, b) => a - b);
const gb = (n: number) => (n >= 1024 ? `${n / 1024} TB` : `${n} GB`);

export function gruposDe(laptops: Laptop[]): Grupo[] {
    return [
        {
            id: 'uso',
            titulo: 'Uso',
            modo: 'o',
            opciones: [
                { valor: 'estudio', etiqueta: 'Estudio y oficina', cumple: (l) => usoDe(l) === 'estudio' },
                { valor: 'productividad', etiqueta: 'Productividad y programación', cumple: (l) => usoDe(l) === 'productividad' },
                { valor: 'creativo', etiqueta: 'Diseño, ingeniería y gaming', cumple: (l) => usoDe(l) === 'creativo' },
            ],
        },
        {
            id: 'precio',
            titulo: 'Precio',
            modo: 'o',
            opciones: [
                { valor: 'hasta-2000', etiqueta: 'Hasta S/ 2,000', cumple: (l) => precio(l) <= 2000 },
                { valor: '2000-3500', etiqueta: 'S/ 2,000 a 3,500', cumple: (l) => precio(l) > 2000 && precio(l) <= 3500 },
                { valor: '3500-5000', etiqueta: 'S/ 3,500 a 5,000', cumple: (l) => precio(l) > 3500 && precio(l) <= 5000 },
                { valor: 'mas-5000', etiqueta: 'Más de S/ 5,000', cumple: (l) => precio(l) > 5000 },
            ],
        },
        {
            id: 'marca',
            titulo: 'Marca',
            modo: 'o',
            opciones: Array.from(new Set(laptops.map((l) => l.marca)))
                .sort()
                .map((m) => ({ valor: m, etiqueta: m, cumple: (l: Laptop) => l.marca === m })),
        },
        {
            id: 'procesador',
            titulo: 'Procesador',
            modo: 'o',
            opciones: [
                { valor: 'intel', etiqueta: 'Intel', cumple: (l) => cpu(l).includes('intel') },
                { valor: 'amd', etiqueta: 'AMD', cumple: (l) => cpu(l).includes('amd') || cpu(l).includes('ryzen') },
                { valor: 'apple', etiqueta: 'Apple', cumple: (l) => cpu(l).includes('apple') || /\bm\d\b/.test(cpu(l)) },
            ],
        },
        {
            id: 'ram',
            titulo: 'Memoria RAM',
            modo: 'o',
            opciones: unicos(laptops.map((l) => l.ram_gb)).map((n) => ({
                valor: String(n),
                etiqueta: `${n} GB`,
                cumple: (l: Laptop) => l.ram_gb === n,
            })),
        },
        {
            id: 'almacenamiento',
            titulo: 'Almacenamiento',
            modo: 'o',
            opciones: unicos(laptops.map((l) => l.almacenamiento_gb)).map((n) => ({
                valor: String(n),
                etiqueta: gb(n),
                cumple: (l: Laptop) => l.almacenamiento_gb === n,
            })),
        },
        {
            id: 'graficos',
            titulo: 'Gráficos',
            modo: 'o',
            opciones: [
                { valor: 'dedicada', etiqueta: 'Tarjeta gráfica dedicada', cumple: (l) => l.gpu_dedicada },
                { valor: 'integrada', etiqueta: 'Gráficos integrados', cumple: (l) => !l.gpu_dedicada },
            ],
        },
        {
            id: 'pantalla',
            titulo: 'Pantalla',
            modo: 'o',
            opciones: [
                {
                    valor: 'compacta',
                    etiqueta: 'Compacta (hasta 14.2")',
                    cumple: (l) => (l.pantalla_pulgadas ?? 0) > 0 && (l.pantalla_pulgadas ?? 0) <= 14.2,
                },
                {
                    valor: 'estandar',
                    etiqueta: 'Estándar (15" a 15.9")',
                    cumple: (l) => (l.pantalla_pulgadas ?? 0) > 14.2 && (l.pantalla_pulgadas ?? 0) < 16,
                },
                { valor: 'grande', etiqueta: 'Grande (16" o más)', cumple: (l) => (l.pantalla_pulgadas ?? 0) >= 16 },
            ],
        },
        {
            id: 'caracteristicas',
            titulo: 'Características',
            modo: 'y',
            opciones: [
                { valor: 'ligera', etiqueta: 'Ligera (menos de 1.5 kg)', cumple: (l) => l.peso_kg !== null && l.peso_kg < 1.5 },
                { valor: 'bateria', etiqueta: 'Batería de 9 h o más', cumple: (l) => (l.bateria_horas ?? 0) >= 9 },
                { valor: 'ampliable', etiqueta: 'RAM ampliable', cumple: (l) => (l.ram_ampliable_gb ?? 0) > l.ram_gb },
                { valor: 'fluida', etiqueta: 'Pantalla fluida (120 Hz o más)', cumple: (l) => (l.pantalla_hz ?? 0) >= 120 },
                { valor: 'disponible', etiqueta: 'Solo disponibles', cumple: (l) => l.stock > 0 },
            ],
        },
    ];
}

function cumpleGrupo(l: Laptop, grupo: Grupo, elegidas: string[] | undefined): boolean {
    if (!elegidas?.length) return true;
    const opciones = grupo.opciones.filter((o) => elegidas.includes(o.valor));
    return grupo.modo === 'y' ? opciones.every((o) => o.cumple(l)) : opciones.some((o) => o.cumple(l));
}

export function cumpleBusqueda(l: Laptop, busqueda: string): boolean {
    const q = busqueda.trim().toLowerCase();
    return !q || `${l.marca} ${l.modelo} ${l.cpu} ${l.gpu ?? ''}`.toLowerCase().includes(q);
}

/** Laptops que pasan todos los filtros; con `exceptoGrupo` se ignora ese grupo (para los conteos). */
export function filtrar(laptops: Laptop[], grupos: Grupo[], seleccion: Seleccion, busqueda: string, exceptoGrupo?: string): Laptop[] {
    return laptops.filter((l) => cumpleBusqueda(l, busqueda) && grupos.every((g) => g.id === exceptoGrupo || cumpleGrupo(l, g, seleccion[g.id])));
}

/**
 * Cuántas laptops quedarían al marcar cada opción, con los demás filtros como están. En un grupo
 * "o" se ignora ese mismo grupo (marcar HP suma a Lenovo, no la resta); en uno "y" se agrega a lo
 * ya marcado.
 */
export function conteos(laptops: Laptop[], grupos: Grupo[], seleccion: Seleccion, busqueda: string): Record<string, Record<string, number>> {
    const resultado: Record<string, Record<string, number>> = {};
    for (const g of grupos) {
        const base = filtrar(laptops, grupos, seleccion, busqueda, g.id);
        resultado[g.id] = {};
        for (const o of g.opciones) {
            const elegidas = g.modo === 'y' ? Array.from(new Set([...(seleccion[g.id] ?? []), o.valor])) : [o.valor];
            resultado[g.id][o.valor] = base.filter((l) => cumpleGrupo(l, g, elegidas)).length;
        }
    }
    return resultado;
}

export type Orden = 'precio_asc' | 'precio_desc' | 'rendimiento' | 'ligeras' | 'bateria';

export const ORDENES: { valor: Orden; etiqueta: string }[] = [
    { valor: 'precio_asc', etiqueta: 'Menor precio' },
    { valor: 'precio_desc', etiqueta: 'Mayor precio' },
    { valor: 'rendimiento', etiqueta: 'Más potentes' },
    { valor: 'ligeras', etiqueta: 'Más ligeras' },
    { valor: 'bateria', etiqueta: 'Mayor batería' },
];

export function ordenar(lista: Laptop[], orden: Orden): Laptop[] {
    // Sin dato (peso o batería), al final.
    const clave: Record<Orden, (l: Laptop) => number> = {
        precio_asc: (l) => precio(l),
        precio_desc: (l) => -precio(l),
        rendimiento: (l) => -(l.rendimiento_score ?? 0),
        ligeras: (l) => l.peso_kg ?? Number.POSITIVE_INFINITY,
        bateria: (l) => -(l.bateria_horas ?? Number.NEGATIVE_INFINITY),
    };
    return [...lista].sort((a, b) => clave[orden](a) - clave[orden](b));
}
