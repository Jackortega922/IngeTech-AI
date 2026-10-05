// Tipos alineados al nuevo motor de recomendación (carrera -> software ->
// requisitos -> hardware). Si el contrato del backend cambia, este es el
// único archivo que debería necesitar ajustes en el frontend del flujo.

export type Portabilidad = 'laptop' | 'escritorio' | 'cualquiera';
export type TipoEquipo = 'laptop' | 'escritorio';
export type NivelRequisito = 'min' | 'rec';
export type NivelExperiencia = 'basico' | 'intermedio' | 'avanzado';

// "¿Qué describe mejor tu uso?" (idea de Marco). Mismos valores que PerfilUsuario::TIPOS_USO.
export type TipoUso = 'estudiante' | 'profesional' | 'gamer' | 'creador' | 'oficina' | 'otro';

export interface Perfil {
    // Opcional: '' = no la indicó (el público general no siempre tiene carrera).
    carrera_clave: string;
    cargo: string;
    tipo_uso: TipoUso | '';
    nivel_experiencia: NivelExperiencia | '';
    actividades: string[];
    // Claves de los programas que dice usar (precargados con los de su carrera, editables).
    software: string[];
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
    // Guía de compra del comparador (valores de referencia, por verificar: tarea C2).
    pantalla_pulgadas: number | null;
    pantalla_resolucion: string | null;
    pantalla_hz: number | null;
    peso_kg: number | null;
    puertos: string[] | null;
    precio_soles: string | number;
    tienda: string | null;
    rendimiento_score: number | null;
    // Inventario (Administración): unidades disponibles y stock de seguridad.
    stock: number;
    stock_minimo: number;
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
    // Solo si el cliente respondió el cuestionario: el % se arma con 70% técnica + 30% afinidad.
    compatibilidad_tecnica_pct?: number | null;
    afinidad_pct?: number | null;
    // El "por qué" de la IA: motivos (factores) y avisos honestos (advertencias).
    explicacion?: { factores: { criterio: string; aporte: number }[]; advertencias: string[] };
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

// Contabilidad: ventas reales (pedidos no cancelados), con el IGV desglosado.
export interface ContabilidadAdmin {
    ventas_total: number;
    base_imponible: number;
    igv: number;
    igv_porcentaje: number;
    numero_ventas: number;
    descuentos: { cantidad: number; monto: number };
    ticket_promedio: number;
    anulaciones: { cantidad: number; monto: number };
    por_mes: Record<string, { ventas: number; monto: number }>;
    por_marca: Record<string, { ventas: number; monto: number }>;
    ultimas: { codigo: string; comprobante: string | null; fecha: string; cliente: string; laptop: string; total: number; estado: EstadoPedido }[];
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

// Lo que se eligió en /personalizar y viaja al checkout. El precio aquí es solo para mostrar:
// el servidor lo recalcula al registrar el pedido.
export interface Configuracion {
    laptop_id: number;
    recomendacion_id: number | null;
    ram_gb: number;
    almacenamiento_gb: number;
    kit_id: number | null;
    accesorio_ids: number[];
    precio_estimado: number;
}

export type EstadoPedido = 'pagado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';

export interface Pedido {
    id: number;
    codigo: string;
    user_id: number | null;
    nombre: string;
    email: string;
    telefono: string;
    departamento: string;
    // Huánuco: provincia, distrito y UBIGEO de la lista oficial. Otros departamentos: ciudad.
    provincia: string | null;
    distrito: string | null;
    ubigeo: string | null;
    ciudad: string | null;
    direccion: string;
    referencia: string | null;
    metodo_pago: string;
    tarjeta_marca: string | null;
    tarjeta_ultimos4: string | null;
    subtotal: string | number;
    // Descuento por cupón (Marketing); el total ya lo tiene restado.
    descuento: string | number;
    // Ambiental: recoger el equipo anterior para reciclaje (RAEE) al entregar.
    recojo_raee: boolean;
    raee_detalle: string | null;
    costo_envio: string | number;
    total: string | number;
    estado: EstadoPedido;
    // Boleta de venta (simulada): serie + correlativo, ej. B001-00000012.
    comprobante: string | null;
    created_at: string;
    // Recorrido del pedido: cuándo pasó a cada estado (tabla pedido_eventos).
    eventos: { id: number; estado: EstadoPedido; created_at: string }[];
    personalizacion: {
        ram_gb: number;
        almacenamiento_gb: number;
        recomendacion_id: number | null;
        laptop: Laptop;
        items: { id: number; item: { id: number; nombre: string; precio_soles: string | number } | null }[];
    };
}

// Cuestionario de bienvenida (Psicología). Las preguntas vienen del backend
// (App\Support\CuestionarioBienvenida), que es la única fuente.
export interface PreguntaCuestionario {
    clave: string;
    tipo: 'unica' | 'multiple' | 'orden' | 'marcas';
    pregunta: string;
    ayuda: string | null;
    opciones: Record<string, string>;
}

export interface PreferenciasCliente {
    para_quien: 'yo' | 'otra_persona' | null;
    movilidad: string | null;
    lejos_enchufe: string | null;
    molestias: string[] | null;
    anios_uso: string | null;
    nivel_tecnologia: 'principiante' | 'intermedio' | 'avanzado' | null;
    prioridades: string[] | null;
    estilo_decision: 'la_mejor' | 'comparar' | 'ver_todo' | null;
    marcas_preferidas: string[] | null;
    marcas_evitar: string[] | null;
    perifericos: string[] | null;
    completado_at: string | null;
    omitido_at: string | null;
}

// Datos de la tienda que aparecen en la boleta y en la hoja de reclamación. Tienda hipotética:
// pueden venir vacíos (config/tienda.php → emisor).
export interface EmisorTienda {
    razon_social: string | null;
    ruc: string | null;
    direccion: string | null;
}

// Hoja del Libro de Reclamaciones (Derecho). Ver app/Models/Reclamo.php.
export interface Reclamo {
    id: number;
    numero: string;
    pedido_codigo: string | null;
    tipo: 'reclamo' | 'queja';
    nombre: string;
    tipo_documento: 'DNI' | 'CE' | 'Pasaporte';
    numero_documento: string;
    domicilio: string;
    telefono: string | null;
    email: string;
    menor_de_edad: boolean;
    apoderado: string | null;
    bien: 'producto' | 'servicio';
    monto_reclamado: string | null;
    descripcion_bien: string;
    detalle: string;
    pedido_consumidor: string;
    estado: 'pendiente' | 'respondido';
    fecha_limite: string;
    respuesta: string | null;
    respondido_at: string | null;
    created_at: string;
    // Días hábiles para responder (negativo si venció; null si ya se respondió).
    dias_restantes: number | null;
}

// Inventario para el admin (App\Http\Controllers\Api\Admin\InventarioController).
export interface FilaInventario {
    id: number;
    marca: string;
    modelo: string;
    precio_soles: string;
    stock: number;
    stock_minimo: number;
    vendidas: number;
    demanda_diaria: number;
    cobertura_dias: number | null;
    punto_reorden: number;
    reponer: number;
    estado: 'agotado' | 'reponer' | 'ok';
}

export interface MovimientoInventario {
    id: number;
    tipo: 'inicial' | 'entrada' | 'venta' | 'anulacion' | 'ajuste';
    cantidad: number;
    stock_resultante: number;
    motivo: string | null;
    created_at: string;
    laptop: { id: number; marca: string; modelo: string } | null;
    user: { id: number; name: string } | null;
    pedido: { id: number; codigo: string } | null;
}

export interface InventarioAdmin {
    laptops: FilaInventario[];
    movimientos: MovimientoInventario[];
    parametros: { ventana_demanda_dias: number; dias_reposicion: number; dias_cobertura: number };
}
