/**
 * Avisos periódicos del asistente (Psicología). Cada cierto tiempo el bot muestra un globo con un
 * mensaje pensado para quien está mirando: clientes e invitados reciben ayuda para decidir; el
 * personal, apoyo para su trabajo y su bienestar (psicología organizacional).
 *
 * Cada aviso declara el principio psicológico en que se basa, para poder explicarlo y revisarlo.
 * Los avisos rotan en bucle mientras la persona esté en el sistema (ver chat-widget.tsx).
 * Regla ética: ayudar a decidir, nunca presionar. Nada de urgencia falsa ("¡solo hoy!") ni escasez
 * inventada (Código de Protección y Defensa del Consumidor, Ley 29571); y si la persona cierra los
 * avisos seguidos, el asistente descansa un rato antes de volver.
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
        {
            titulo: 'Compáralas lado a lado ⚖️',
            texto: 'Marca hasta 3 laptops con la balanza y mira sus diferencias en una sola tabla.',
            principio: 'Evaluación conjunta (Hsee): ver las opciones juntas hace evidentes las diferencias que importan.',
        },
        {
            titulo: '¿Primera laptop? Es normal dudar',
            texto: 'Muchos no saben qué elegir la primera vez. Pregúntame lo que sea, sin pena: no hay preguntas tontas.',
            principio: 'Normalización y validación emocional: reconocer que la duda es común reduce la ansiedad.',
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
        {
            titulo: 'Cuéntanos cómo eres 📝',
            texto: 'Si aún no respondiste tu cuestionario de bienvenida, tómate 2 minutos: con él las recomendaciones se ajustan a ti.',
            principio: 'Efecto Zeigarnik: recordar una tarea pendiente invita a completarla, sin obligar.',
            enlace: '/bienvenida',
        },
        {
            titulo: '¿Ya compraste? Mira tu pedido',
            texto: 'Revisa en qué estado va tu pedido cuando quieras: saber en qué punto está da tranquilidad.',
            principio: 'Reducción de incertidumbre: la transparencia sobre el proceso disminuye la ansiedad de espera.',
            enlace: '/seguimiento',
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
        {
            titulo: 'Delegar también es liderar',
            texto: 'Si una tarea es de Ventas, Almacén o Contabilidad, asígnala: cada rol ve solo lo suyo.',
            principio: 'Teoría de la autodeterminación (Deci y Ryan): dar autonomía al equipo aumenta su compromiso.',
            enlace: '/admin?tab=usuarios',
        },
        {
            titulo: 'Los reclamos enseñan',
            texto: 'Si varios reclamos se parecen, hay algo que mejorar. Revisa si se repite un patrón.',
            principio: 'Retroalimentación y aprendizaje organizacional: los errores repetidos señalan qué cambiar.',
            enlace: '/admin?tab=reclamos',
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
        {
            titulo: 'Dos o tres opciones, no diez',
            texto: 'Si el cliente duda, sugiérele pocas opciones claras y explica en qué se diferencian.',
            principio: 'Paradoja de la elección (Schwartz): demasiadas alternativas paralizan la decisión.',
        },
        {
            titulo: 'Háblale a cada grupo',
            texto: 'Mira en Marketing qué grupos de clientes hay y adapta el mensaje a lo que busca cada uno.',
            principio: 'Segmentación psicográfica: las personas responden mejor a mensajes que reflejan sus motivaciones.',
            enlace: '/admin?tab=marketing',
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
        {
            titulo: 'Un lugar para cada cosa',
            texto: 'Ordena el almacén por modelo: buscar menos significa equivocarse menos.',
            principio: 'Carga cognitiva: un entorno ordenado reduce el esfuerzo mental y los errores.',
        },
        {
            titulo: 'Avisa antes de que se agote',
            texto: 'Si un modelo está por debajo del stock mínimo, repórtalo hoy: anticiparse evita urgencias.',
            principio: 'Afrontamiento proactivo: anticipar problemas reduce el estrés de las urgencias.',
            enlace: '/admin?tab=inventario',
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
        {
            titulo: 'Divide el cierre en bloques ⏱️',
            texto: 'Trabaja 25 minutos concentrado y descansa 5. Un cierre grande se hace más llevadero por partes.',
            principio: 'Técnica Pomodoro (gestión de la atención): bloques cortos sostienen la concentración.',
        },
        {
            titulo: 'Pide una segunda mirada',
            texto: 'Antes de entregar un reporte importante, que otra persona lo revise.',
            principio: 'Sesgo de confirmación: tendemos a ver lo que esperamos; otra persona nota lo que no vemos.',
        },
        PAUSA_ACTIVA,
    ],
};

export function audienciaDe(rol: string | undefined): Audiencia {
    if (!rol) return 'invitado';
    return rol in AVISOS ? (rol as Audiencia) : 'cliente';
}
