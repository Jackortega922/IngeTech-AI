// Tipos alineados al nuevo motor de recomendación (carrera -> software ->
// requisitos -> hardware). Si el contrato del backend cambia, este es el
// único archivo que debería necesitar ajustes en el frontend del flujo.

export type Portabilidad = 'laptop' | 'escritorio' | 'cualquiera';
export type TipoEquipo = 'laptop' | 'escritorio';
export type NivelRequisito = 'min' | 'rec';
export type NivelExperiencia = 'basico' | 'intermedio' | 'avanzado';

export interface Perfil {
    carrera_clave: string;
    cargo: string;
    nivel_experiencia: NivelExperiencia | '';
    actividades: string[];
    presupuesto_soles: number;
    portabilidad: Portabilidad;
}

export interface Actividad {
    id: number;
    clave: string;
    nombre: string;
    extra_ram_gb: number;
    extra_cpu_score: number;
    requiere_gpu: boolean;
}

export interface Software {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    categoria: string;
    min_ram_gb: number;
    min_cpu_score: number;
    min_gpu_dedicada: boolean;
    rec_ram_gb: number;
    rec_cpu_score: number;
    rec_gpu_dedicada: boolean;
}

export interface Carrera {
    id: number;
    clave: string;
    nombre: string;
    facultad: string;
    software: Pick<Software, 'id' | 'clave'>[];
}

export interface Laptop {
    id: number;
    marca: string;
    modelo: string;
    descripcion: string | null;
    imagen_url: string | null;
    tipo: TipoEquipo;
    cpu: string;
    ram_gb: number;
    ram_ampliable_gb: number | null;
    almacenamiento_gb: number;
    almacenamiento_tipo: string;
    gpu: string | null;
    gpu_dedicada: boolean;
    bateria_horas: number | null;
    precio_soles: string | number;
    tienda: string | null;
    rendimiento_score: number | null;
}

export interface Necesidad {
    ram_gb: number;
    cpu_score: number;
    gpu_dedicada: boolean;
    nivel: NivelRequisito;
}

export interface Tarjeta {
    laptop_id: number;
    badges: string[];
    laptop: Laptop;
    compatibilidad_pct: number;
    recomendacion_id: number;
}

export interface RespuestaMotorOk {
    version: string;
    necesidad: Necesidad;
    tarjetas: Tarjeta[];
}

export interface RespuestaMotorError {
    version: string;
    error: 'sin_resultados' | 'perfil_invalido' | 'error_interno';
    mensaje: string;
    necesidad?: Necesidad;
    cercanas?: Laptop[];
}

export type RespuestaMotor = RespuestaMotorOk | RespuestaMotorError;

export interface Accesorio {
    id: number;
    nombre: string;
    tipo: string;
    precio_soles: string | number;
}

export interface Kit {
    id: number;
    nombre: string;
    precio_soles: string | number;
    accesorios: Accesorio[];
}

export interface Catalogos {
    carreras: Carrera[];
    software: Software[];
    hardware: Laptop[];
    actividades: Actividad[];
    accesorios: Accesorio[];
    kits: Kit[];
}

export interface DashboardAdmin {
    total_equipos: number;
    total_software: number;
    total_carreras: number;
    total_usuarios: number;
    total_consultas: number;
    por_carrera: Record<string, number>;
    por_presupuesto: Record<string, number>;
    calidad: CalidadRecomendacion;
}

// KPIs de Ingeniería Industrial (docs/gestion/kpis.md). Las tasas llegan en null cuando todavía
// no hay muestra para calcularlas.
export interface CalidadRecomendacion {
    consultas_con_resultado: number;
    cobertura_pct: number | null;
    compatibilidad_promedio: number | null;
    perfiles_con_eleccion: number;
    tasa_eleccion_pct: number | null;
    tiempo_decision_mediana_seg: number | null;
    elecciones_por_opcion: Record<string, number>;
}

export interface ContabilidadAdmin {
    ingreso_potencial_total: number;
    ticket_promedio: number;
    total_recomendaciones: number;
    por_rango_precio: Record<string, number>;
}

export interface Cliente {
    id: number;
    name: string;
    email: string;
    created_at: string;
    perfiles_count: number;
    carrera: string | null;
    cargo: string | null;
}

export interface HistorialItem {
    id: number;
    carrera: string | null;
    nivel_experiencia: string;
    actividades: string[];
    presupuesto_soles: string | number;
    portabilidad: Portabilidad;
    created_at: string;
    recomendaciones: {
        id: number;
        compatibilidad_pct: number;
        explicacion: { badges: string[] };
        laptop: Laptop;
    }[];
}

// Personalización confirmada, guardada como cotización para que un asesor la atienda.
export interface Cotizacion {
    id: number;
    user_id: number;
    laptop_id: number;
    recomendacion_id: number | null;
    ram_gb: number;
    almacenamiento_gb: number;
    precio_total: string | number;
    created_at: string;
    laptop: Laptop;
    items: { id: number; item: { id: number; nombre: string; precio_soles: string | number } | null }[];
    user?: { id: number; name: string; email: string };
}
