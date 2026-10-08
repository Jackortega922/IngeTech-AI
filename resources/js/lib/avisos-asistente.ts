/**
 * Avisos periódicos del asistente (Psicología). Cada cierto tiempo el bot muestra un globo con un
 * mensaje pensado para quien está mirando: clientes e invitados reciben ayuda para decidir; el
 * personal, apoyo para su trabajo y su bienestar (psicología organizacional).
 *
 * Cada aviso declara el principio psicológico en que se basa, para poder explicarlo y revisarlo.
 * Regla ética: ayudar a decidir, nunca presionar. Nada de urgencia falsa ("¡solo hoy!") ni escasez
 * inventada (Código de Protección y Defensa del Consumidor, Ley 29571); y si la persona cierra los
 * avisos, se respeta (ver chat-widget.tsx).
 */

export type Audiencia = 'invitado' | 'cliente' | 'admin' | 'ventas' | 'almacen' | 'contabilidad';

export interface Aviso {
    titulo: string;
    texto: string;
    // Principio de Psicología que sostiene el mensaje (documentación; no se muestra).
    principio: string;
    // Si lo tiene, el globo lleva ahí en vez de abrir el chat (p. ej. una pestaña del panel).
    enlace?: string;
}

// Mismo mensaje para todo el personal: la salud ocupacional no depende del rol.
const PAUSA_ACTIVA: Aviso = {
    titulo: '¿Una pausa de 2 minutos? 🧘',
    texto: 'Mira algo lejano, estira cuello y hombros. Las pausas activas cortas reducen la fatiga y los errores.',
    principio: 'Salud ocupacional: las pausas breves y frecuentes previenen la fatiga visual y mental (y el burnout).',
};

export const AVISOS: Record<Audiencia, Aviso[]> = {
    invitado: [
        {
            titulo: '¿No sabes por dónde empezar? 👋',
            texto: 'Pregúntame cómo funciona la tienda o qué laptop te conviene. Te respondo al instante.',
            principio: 'Barrera de ayuda: una pregunta abierta y sin compromiso facilita pedir ayuda.',
        },
        {
            titulo: '¿Demasiadas opciones? 🤔',
            texto: 'Dime para qué usarás la laptop y te dejo solo las que de verdad te sirven.',
            principio: 'Paradoja de la elección (Schwartz): reducir alternativas baja la ansiedad y facilita decidir.',
        },
        {
            titulo: 'No necesitas saber de tecnología',
            texto: 'Cuéntame qué programas usas o qué estudias, y yo lo traduzco a RAM, procesador y gráficos.',
            principio: 'Autoeficacia (Bandura): sentirse capaz de decidir aumenta la confianza en la compra.',
        },
        {
            titulo: '¿Te preocupa equivocarte?',
            texto: 'Pregúntame por la garantía y las devoluciones antes de decidir. Comprar informado da tranquilidad.',
            principio: 'Reducción de incertidumbre: conocer las garantías disminuye el miedo a una mala compra.',
        },
    ],
    cliente: [
        {
            titulo: '¿Te ayudo a decidir? 👋',
            texto: 'Pregúntame lo que quieras sobre una laptop o sobre tu pedido. Te respondo al instante.',
            principio: 'Barrera de ayuda: una pregunta abierta y sin compromiso facilita pedir ayuda.',
        },
        {
            titulo: '¿Dudas entre dos laptops?',
            texto: 'Ponlas en el comparador: si respondiste tu cuestionario, te digo cuál encaja más contigo y por qué.',
            principio: 'Disonancia cognitiva (Festinger): entender por qué una opción conviene reduce la duda antes y después de comprar.',
        },
        {
            titulo: 'Una recomendación hecha para ti ✨',
            texto: 'Con tu carrera, tus programas y tu presupuesto, la IA te dice qué laptop te conviene y por qué.',
            principio: 'Personalización y autonomía: una sugerencia explicada respeta la decisión de la persona.',
        },
        {
            titulo: '¿Presupuesto justo?',
            texto: 'Pregúntame qué priorizar para no pagar por potencia que no vas a usar.',
            principio: 'Efecto ancla: comparar contra lo que realmente necesitas evita que el precio más alto parezca "el normal".',
        },
    ],
    admin: [
        {
            titulo: 'Empieza por lo urgente 📋',
            texto: 'Revisa primero agotados y reclamos pendientes; lo demás puede esperar unos minutos.',
            principio: 'Carga cognitiva y priorización (matriz de Eisenhower): ordenar tareas reduce el estrés.',
            enlace: '/admin?tab=dashboard',
        },
        {
            titulo: 'Reconoce un logro del equipo 🙌',
            texto: 'Mira los indicadores y comparte uno que haya mejorado. El reconocimiento motiva más que la corrección.',
            principio: 'Refuerzo positivo (psicología organizacional): reconocer avances aumenta la motivación.',
            enlace: '/admin?tab=dashboard',
        },
        PAUSA_ACTIVA,
    ],
    ventas: [
        {
            titulo: 'Antes de recomendar, pregunta',
            texto: '¿Qué usará y cuánto puede gastar? Escuchar primero evita vender algo que luego se devuelve.',
            principio: 'Escucha activa: entender la necesidad genera confianza y menos arrepentimiento.',
            enlace: '/admin?tab=pedidos',
        },
        {
            titulo: 'Reclamos: primero la emoción',
            texto: 'Valida cómo se siente el cliente ("entiendo tu molestia") y luego da la solución.',
            principio: 'Empatía y validación emocional: bajan la tensión y facilitan resolver el conflicto.',
            enlace: '/admin?tab=reclamos',
        },
        PAUSA_ACTIVA,
    ],
    almacen: [
        {
            titulo: 'Cuenta dos veces, ajusta una',
            texto: 'Antes de un ajuste de stock, vuelve a contar. La fatiga es la causa más común de errores de conteo.',
            principio: 'Atención y fatiga: verificar dos veces compensa la baja de atención en tareas repetitivas.',
            enlace: '/admin?tab=inventario',
        },
        {
            titulo: 'Cuida tu espalda 📦',
            texto: 'Al cargar cajas, dobla las rodillas y no gires el tronco con peso. Pide ayuda con lo pesado.',
            principio: 'Ergonomía y seguridad laboral: prevenir lesiones también previene estrés.',
        },
        PAUSA_ACTIVA,
    ],
    contabilidad: [
        {
            titulo: 'Lo importante, con la mente fresca',
            texto: 'Revisa cierres y boletas a primera hora: después de muchas decisiones, la atención baja.',
            principio: 'Fatiga de decisión: la calidad de las decisiones baja tras muchas decisiones seguidas.',
            enlace: '/admin?tab=contabilidad',
        },
        {
            titulo: 'Un número raro no es un error tuyo',
            texto: 'Si algo no cuadra, anótalo y sigue; vuelve después con calma. La revisión en frío ve más.',
            principio: 'Regulación emocional: separar el error del autoconcepto reduce la ansiedad y mejora la revisión.',
            enlace: '/admin?tab=contabilidad',
        },
        PAUSA_ACTIVA,
    ],
};

export function audienciaDe(rol: string | undefined): Audiencia {
    if (!rol) return 'invitado';
    return rol in AVISOS ? (rol as Audiencia) : 'cliente';
}
