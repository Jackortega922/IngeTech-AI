// Guía de compra del comparador: traduce las specs de 2 o 3 laptops a lo que significan para
// el cliente. Son reglas fijas (no IA), basadas en criterios de venta habituales:
//   - Procesador: i3/Ryzen 3 = básico, i5/Ryzen 5 = estándar, i7/i9/Ryzen 7/9 = avanzado.
//   - RAM: 8 GB es el mínimo para estudio u oficina; 16 GB o más es lo recomendado.
//   - Almacenamiento: SSD; 512 GB es el estándar para no quedarse sin espacio.
//   - Pantalla: 13-14" para llevar, 15.6"+ para comodidad; mínimo Full HD; 120 Hz+ para gaming.
//   - Peso: menos de 1.5 kg para llevarla a diario.
//   - Batería: más de 8 h para quien trabaja fuera de casa.
//   - Puertos: USB-A, USB-C con carga, HDMI y lector SD según el uso.
//   - Valor: la más cara solo conviene si lo que ofrece de más le sirve al cliente.
import type { Laptop } from '@/types/flujo';

export type Calidad = 'alta' | 'media' | 'baja';

export interface Veredicto {
    laptop_id: number;
    texto: string;
    detalle?: string;
    calidad: Calidad | null; // null = no hay dato
}

export interface Criterio {
    clave: string;
    titulo: string;
    porque: string; // por qué le importa al cliente
    veredictos: Veredicto[];
}

export const PUERTO_ETIQUETA: Record<string, string> = {
    usb_a: 'USB-A',
    usb_c: 'USB-C',
    usb_c_carga: 'USB-C con carga',
    thunderbolt: 'Thunderbolt',
    hdmi: 'HDMI',
    lector_sd: 'Lector SD',
    ethernet: 'Ethernet',
};

// --- Procesador -----------------------------------------------------------------------------

export type NivelCpu = 'basico' | 'estandar' | 'avanzado';

export function nivelCpu(l: Laptop): NivelCpu {
    const cpu = l.cpu.toLowerCase();
    if (/\b(i3|core 3|ryzen 3|celeron|pentium|athlon)\b/.test(cpu)) return 'basico';
    if (/\b(i5|core 5|ryzen 5)\b/.test(cpu)) return 'estandar';
    if (/\b(i7|i9|core 7|core 9|ryzen 7|ryzen 9|ultra)\b/.test(cpu)) return 'avanzado';
    // Chips que no siguen esa nomenclatura (ej. Apple M): por el puntaje de rendimiento.
    const score = l.rendimiento_score ?? 0;
    return score >= 70 ? 'avanzado' : score >= 45 ? 'estandar' : 'basico';
}

const CPU: Record<NivelCpu, { texto: string; calidad: Calidad }> = {
    basico: { texto: 'Básico: ofimática, clases y navegación', calidad: 'baja' },
    estandar: { texto: 'Estándar: multitarea y estudios', calidad: 'media' },
    avanzado: { texto: 'Avanzado: diseño, programación y gaming', calidad: 'alta' },
};

// --- Evaluación por criterio ----------------------------------------------------------------

function ram(l: Laptop): Omit<Veredicto, 'laptop_id'> {
    const ampliable = l.ram_ampliable_gb && l.ram_ampliable_gb > l.ram_gb ? `Ampliable hasta ${l.ram_ampliable_gb} GB` : 'No ampliable';
    if (l.ram_gb >= 16) return { texto: `${l.ram_gb} GB: no se pone lenta con muchos programas`, detalle: ampliable, calidad: 'alta' };
    if (l.ram_gb >= 8) return { texto: `${l.ram_gb} GB: el mínimo para estudio u oficina`, detalle: ampliable, calidad: 'media' };
    return { texto: `${l.ram_gb} GB: se queda corta hoy en día`, detalle: ampliable, calidad: 'baja' };
}

function almacenamiento(l: Laptop): Omit<Veredicto, 'laptop_id'> {
    const gb = l.almacenamiento_gb;
    const tam = gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
    const ssd = l.almacenamiento_tipo.toUpperCase().includes('SSD') ? ' SSD: enciende en segundos' : '';
    if (gb >= 1024) return { texto: `${tam}: espacio de sobra`, detalle: ssd.trim() || undefined, calidad: 'alta' };
    if (gb >= 512) return { texto: `${tam}: el estándar recomendado`, detalle: ssd.trim() || undefined, calidad: 'media' };
    return { texto: `${tam}: se llena rápido`, detalle: 'Considera ampliarlo al personalizar', calidad: 'baja' };
}

function pantalla(l: Laptop): Omit<Veredicto, 'laptop_id'> {
    if (!l.pantalla_pulgadas) return { texto: 'Sin dato', calidad: null };
    const tam = l.pantalla_pulgadas <= 14.5 ? 'compacta, fácil de llevar' : 'grande, más cómoda para la vista';
    const [ancho, alto] = (l.pantalla_resolucion ?? '').split('x').map(Number);
    const hz = l.pantalla_hz ?? 60;

    const detalles: string[] = [];
    let calidad: Calidad = 'media';
    if (ancho && alto) {
        if (ancho > 1920 || alto > 1200) {
            detalles.push('más nítida que Full HD');
            calidad = 'alta';
        } else if (ancho < 1920) {
            detalles.push('menos que Full HD');
            calidad = 'baja';
        } else {
            detalles.push('Full HD');
        }
    }
    if (hz >= 120) {
        detalles.push(`${hz} Hz, fluida para juegos`);
        if (calidad !== 'baja') calidad = 'alta';
    }
    return { texto: `${l.pantalla_pulgadas}": ${tam}`, detalle: detalles.join(' · ') || undefined, calidad };
}

function peso(l: Laptop): Omit<Veredicto, 'laptop_id'> {
    if (!l.peso_kg) return { texto: 'Sin dato', calidad: null };
    const kg = `${l.peso_kg.toLocaleString('es-PE')} kg`;
    if (l.peso_kg < 1.5) return { texto: `${kg}: muy ligera, para llevarla a diario`, calidad: 'alta' };
    if (l.peso_kg <= 2) return { texto: `${kg}: portátil para salidas ocasionales`, calidad: 'media' };
    return { texto: `${kg}: pesada, mejor para casa u oficina`, calidad: 'baja' };
}

function bateria(l: Laptop): Omit<Veredicto, 'laptop_id'> {
    if (!l.bateria_horas) return { texto: 'Sin dato', calidad: null };
    const h = `${l.bateria_horas} h`;
    if (l.bateria_horas >= 8) return { texto: `${h}: aguanta la jornada fuera de casa`, calidad: 'alta' };
    if (l.bateria_horas >= 5) return { texto: `${h}: mejor tener un enchufe cerca`, calidad: 'media' };
    return { texto: `${h}: pensada para usarla enchufada`, calidad: 'baja' };
}

function puertos(l: Laptop): Omit<Veredicto, 'laptop_id'> {
    const p = l.puertos ?? [];
    if (p.length === 0) return { texto: 'Sin dato', calidad: null };
    const avisos: string[] = [];
    if (!p.includes('usb_a')) avisos.push('sin USB-A: necesitarás adaptador para memorias y mouse comunes');
    if (!p.includes('hdmi')) avisos.push('sin HDMI: adaptador para conectar monitor o proyector');
    if (p.includes('lector_sd')) avisos.push('lector SD, útil para fotografía');
    const esenciales = ['usb_a', 'hdmi', 'usb_c_carga'].filter((x) => p.includes(x)).length;
    return {
        texto: p.map((x) => PUERTO_ETIQUETA[x] ?? x).join(', '),
        detalle: avisos.join(' · ') || undefined,
        calidad: esenciales === 3 ? 'alta' : esenciales === 2 ? 'media' : 'baja',
    };
}

export function criteriosDeCompra(laptops: Laptop[]): Criterio[] {
    const por = (fn: (l: Laptop) => Omit<Veredicto, 'laptop_id'>) => laptops.map((l) => ({ laptop_id: l.id, ...fn(l) }));

    return [
        {
            clave: 'cpu',
            titulo: 'Procesador',
            porque: 'Define qué tan rápido trabaja la laptop.',
            // El puntaje matiza la regla por nombre: un i5 serie H rinde más que uno de bajo consumo.
            veredictos: por((l) => ({ ...CPU[nivelCpu(l)], detalle: `${l.cpu} · rendimiento ${l.rendimiento_score ?? '—'}/100` })),
        },
        { clave: 'ram', titulo: 'Memoria RAM', porque: 'Da la fluidez al tener muchas pestañas y programas abiertos.', veredictos: por(ram) },
        {
            clave: 'almacenamiento',
            titulo: 'Almacenamiento',
            porque: 'Cuánto puedes guardar; con SSD enciende y abre programas en segundos.',
            veredictos: por(almacenamiento),
        },
        { clave: 'pantalla', titulo: 'Pantalla', porque: 'Tamaño, nitidez y fluidez de la imagen.', veredictos: por(pantalla) },
        { clave: 'peso', titulo: 'Peso y portabilidad', porque: 'Decisivo si la llevarás a clases, al trabajo o de viaje.', veredictos: por(peso) },
        {
            clave: 'bateria',
            titulo: 'Batería',
            porque: 'Horas de referencia del fabricante; con uso intenso dura menos.',
            veredictos: por(bateria),
        },
        { clave: 'puertos', titulo: 'Puertos', porque: 'Qué puedes conectar sin comprar adaptadores.', veredictos: por(puertos) },
    ];
}

// --- Resumen por laptop ---------------------------------------------------------------------

export type Rol = 'Económica' | 'Equilibrada' | 'Premium';

// Rol según el precio dentro de la comparación: con 2 laptops, económica y premium; con 3, la
// del medio es la equilibrada.
export function rolesPorPrecio(laptops: Laptop[]): Record<number, Rol> {
    const orden = [...laptops].sort((a, b) => Number(a.precio_soles) - Number(b.precio_soles));
    const roles: Record<number, Rol> = {};
    orden.forEach((l, i) => {
        roles[l.id] = i === 0 ? 'Económica' : i === orden.length - 1 ? 'Premium' : 'Equilibrada';
    });
    return roles;
}

export function idealPara(l: Laptop): string {
    const base = l.gpu_dedicada
        ? 'Diseño, ingeniería y gaming'
        : nivelCpu(l) === 'avanzado' || l.ram_gb >= 16
          ? 'Trabajo, programación y multitarea'
          : 'Estudios, oficina y hogar';
    return l.peso_kg && l.peso_kg < 1.5 ? `${base}, para llevar a todos lados` : base;
}

// --- ¿Vale la diferencia de precio? ---------------------------------------------------------

// Lo que ofrece `l` de más frente a `base` (la más barata), en términos que le importan al cliente.
function ventajasSobre(l: Laptop, base: Laptop): string[] {
    const v: string[] = [];
    const orden: NivelCpu[] = ['basico', 'estandar', 'avanzado'];
    if (orden.indexOf(nivelCpu(l)) > orden.indexOf(nivelCpu(base))) v.push('procesador de gama más alta');
    if (l.ram_gb > base.ram_gb) v.push(`${l.ram_gb - base.ram_gb} GB más de RAM`);
    if (l.almacenamiento_gb > base.almacenamiento_gb) v.push(`${l.almacenamiento_gb - base.almacenamiento_gb} GB más de almacenamiento`);
    if (l.gpu_dedicada && !base.gpu_dedicada) v.push('tarjeta gráfica dedicada');
    if ((l.bateria_horas ?? 0) > (base.bateria_horas ?? 0) + 1) v.push(`${(l.bateria_horas ?? 0) - (base.bateria_horas ?? 0)} h más de batería`);
    if ((l.pantalla_hz ?? 60) >= 120 && (base.pantalla_hz ?? 60) < 120) v.push(`pantalla de ${l.pantalla_hz} Hz`);
    if (l.peso_kg && base.peso_kg && base.peso_kg - l.peso_kg >= 0.2) v.push(`${(base.peso_kg - l.peso_kg).toFixed(2)} kg más ligera`);
    return v;
}

export interface Justificacion {
    laptop_id: number;
    diferencia: number;
    ventajas: string[];
}

export function justificarPrecios(laptops: Laptop[]): { base: Laptop; otras: Justificacion[] } | null {
    if (laptops.length < 2) return null;
    const orden = [...laptops].sort((a, b) => Number(a.precio_soles) - Number(b.precio_soles));
    const base = orden[0];
    return {
        base,
        otras: orden.slice(1).map((l) => ({
            laptop_id: l.id,
            diferencia: Number(l.precio_soles) - Number(base.precio_soles),
            ventajas: ventajasSobre(l, base),
        })),
    };
}
