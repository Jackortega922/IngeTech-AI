// Guía "¿cuál conviene para cada tarea?" del comparador. Son reglas fijas, no IA: el
// comparador es parte del catálogo tradicional (público). Usa los mismos requisitos por
// actividad que el formulario de Perfil (tabla `actividades`: extra_ram_gb, extra_cpu_score,
// requiere_gpu) para que el comparador y la recomendación no se contradigan.
import type { Actividad, Laptop } from '@/types/flujo';

// Punto de partida de cualquier uso: 8 GB y un procesador de gama de entrada. Cada actividad
// suma lo suyo encima de esta base.
const BASE_RAM_GB = 8;
const BASE_CPU_SCORE = 30;

export interface Requisito {
    ram_gb: number;
    cpu_score: number;
    gpu_dedicada: boolean;
}

export interface VeredictoTarea {
    laptop_id: number;
    cumple: boolean;
    faltas: string[];
}

export interface ComparacionTarea {
    clave: string;
    nombre: string;
    requisito: Requisito;
    veredictos: VeredictoTarea[];
    // La más barata que cumple: para orientar una compra, cumplir basta — la potencia de
    // sobra se paga y no se usa en esa tarea.
    conviene_id: number | null;
    // La que cumple con el procesador más potente (margen a futuro) — solo si no es la misma.
    potente_id: number | null;
}

// Tarea base que no está en la tabla `actividades` porque el perfil la asume siempre: sin
// ella, una laptop de entrada salía "sirve para 0 tareas", cuando sí sirve para lo que se compra.
const USO_DIARIO: Actividad = {
    id: 0,
    clave: 'uso_diario',
    nombre: 'Uso diario (clases, ofimática, navegación)',
    extra_ram_gb: 0,
    extra_cpu_score: 0,
    requiere_gpu: false,
};

export function requisitoDe(actividad: Actividad): Requisito {
    return {
        ram_gb: BASE_RAM_GB + actividad.extra_ram_gb,
        cpu_score: BASE_CPU_SCORE + actividad.extra_cpu_score,
        gpu_dedicada: actividad.requiere_gpu,
    };
}

function evaluar(laptop: Laptop, req: Requisito): VeredictoTarea {
    const faltas: string[] = [];
    const score = laptop.rendimiento_score ?? 0;

    if (req.gpu_dedicada && !laptop.gpu_dedicada) faltas.push('no tiene GPU dedicada');
    if (laptop.ram_gb < req.ram_gb) faltas.push(`RAM de ${laptop.ram_gb} GB (pide ${req.ram_gb})`);
    if (score < req.cpu_score) faltas.push(`procesador justo (${score}/100, pide ${req.cpu_score})`);

    return { laptop_id: laptop.id, cumple: faltas.length === 0, faltas };
}

export function compararPorTarea(laptops: Laptop[], actividades: Actividad[]): ComparacionTarea[] {
    return [USO_DIARIO, ...actividades].map((act) => {
        const requisito = requisitoDe(act);
        const veredictos = laptops.map((l) => evaluar(l, requisito));
        const aptas = laptops.filter((l) => veredictos.find((v) => v.laptop_id === l.id)?.cumple);

        const conviene = [...aptas].sort((a, b) => Number(a.precio_soles) - Number(b.precio_soles))[0];
        const potente = [...aptas].sort((a, b) => (b.rendimiento_score ?? 0) - (a.rendimiento_score ?? 0))[0];

        return {
            clave: act.clave,
            nombre: act.nombre,
            requisito,
            veredictos,
            conviene_id: conviene?.id ?? null,
            potente_id: potente && potente.id !== conviene?.id ? potente.id : null,
        };
    });
}

// Cuántas tareas cumple cada laptop — para el resumen de arriba.
export function tareasCumplidas(comparaciones: ComparacionTarea[], laptopId: number): number {
    return comparaciones.filter((c) => c.veredictos.find((v) => v.laptop_id === laptopId)?.cumple).length;
}
