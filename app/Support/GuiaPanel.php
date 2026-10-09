<?php

namespace App\Support;

/**
 * Guía de uso del panel para el asistente cuando le escribe alguien del personal (modo personal).
 *
 * Una sección por permiso (App\Support\Roles): cada rol solo recibe la guía de lo que puede ver,
 * así el asistente no le explica a Almacén cómo funciona Contabilidad. Solo describe cómo se usa
 * cada pantalla: no incluye datos de la tienda (pedidos, clientes, cifras), que el asistente nunca
 * recibe. Si cambia lo que hace una pestaña del panel, actualizar aquí su texto.
 */
class GuiaPanel
{
    /**
     * permiso => [título, cómo se usa, palabras clave (sin tildes) para el asistente de respaldo].
     *
     * @var array<string, array{titulo: string, guia: string, claves: list<string>}>
     */
    public const SECCIONES = [
        'dashboard' => [
            'titulo' => 'Dashboard (Ing. Industrial)',
            'guia' => 'Muestra la calidad de la recomendación con IA (tasa de elección, tiempo de decisión, compatibilidad promedio y cobertura del catálogo) y un indicador por disciplina con su meta. Si todavía no hay datos, el indicador aparece como «—» en vez de 0 %.',
            'claves' => ['dashboard', 'kpi', 'indicador', 'metrica', 'meta'],
        ],
        'contabilidad' => [
            'titulo' => 'Contabilidad',
            'guia' => 'Muestra las ventas reales (pedidos no cancelados) con el IGV del 18 % desglosado (los precios ya incluyen IGV), las ventas por mes y por marca, las anulaciones y los descuentos por cupón. El botón de descarga entrega el registro de ventas en CSV.',
            'claves' => ['contab', 'igv', 'impuesto', 'csv', 'registro de ventas', 'anulac', 'ventas'],
        ],
        'clientes' => [
            'titulo' => 'Clientes',
            'guia' => 'Lista de los clientes registrados: cuántas recomendaciones con IA pidió cada uno y la carrera u ocupación de su última consulta. Es de solo lectura.',
            'claves' => ['clientes', 'lista de clientes'],
        ],
        'pedidos' => [
            'titulo' => 'Pedidos',
            'guia' => 'Lista de pedidos con su estado: pagado, preparando, enviado, entregado o cancelado. Cada pedido muestra si el cliente pidió el recojo de su equipo viejo (RAEE).',
            'claves' => ['pedido', 'envio', 'enviad', 'entregad', 'preparando'],
        ],
        'pedidos.editar' => [
            'titulo' => 'Cambiar el estado de un pedido',
            'guia' => 'En la pestaña Pedidos, elige el nuevo estado del pedido (pagado → preparando → enviado → entregado, o cancelado). El cliente recibe un correo con cada cambio. Cancelar un pedido devuelve la unidad al inventario y reactivarlo la vuelve a descontar.',
            'claves' => ['cancel', 'estado', 'cambiar', 'avanzar', 'reactiv'],
        ],
        'inventario' => [
            'titulo' => 'Inventario (Administración)',
            'guia' => 'Stock de cada laptop con su kardex (cada movimiento queda registrado). Botón «Entrada»: unidades que llegan del proveedor. Botón «Ajuste»: las unidades contadas en el almacén, con un motivo obligatorio (conteo físico, unidad dañada). El stock mínimo se edita en la tabla. El estado indica agotada (la IA ya no la recomienda), por reponer (llegó al punto de reorden, con la cantidad sugerida a pedir) u OK.',
            'claves' => ['inventario', 'stock', 'entrada', 'ajust', 'kardex', 'reorden', 'repon', 'agotad', 'almacen', 'conteo', 'contad'],
        ],
        'reclamos' => [
            'titulo' => 'Reclamos (Derecho)',
            'guia' => 'Hojas del Libro de Reclamaciones con su fecha límite: 15 días hábiles (sin fines de semana ni feriados nacionales). Para responder, escribe la respuesta (mínimo 10 caracteres) y guárdala: la hoja pasa a «respondido» y el cliente recibe un correo con la respuesta.',
            'claves' => ['reclam', 'queja', 'plazo', 'respond'],
        ],
        'marketing' => [
            'titulo' => 'Marketing',
            'guia' => 'Segmentación de clientes con IA (K-Means): grupos de clientes parecidos, con su cliente promedio y una campaña sugerida; «Volver a calcular» la rehace. «Crear cupón para este grupo» abre el formulario: porcentaje (máximo 50 %) o monto fijo, y opcionalmente compra mínima, usos máximos y fecha de vencimiento.',
            'claves' => ['marketing', 'segment', 'cupon', 'k-means', 'kmeans', 'campana', 'grupo', 'promoc', 'descuent'],
        ],
        'hardware' => [
            'titulo' => 'Equipos (catálogo)',
            'guia' => 'Crear, editar o eliminar laptops del catálogo (specs, precio, foto). Después de cambiar laptops, el equipo técnico debe ejecutar «php artisan motor:exportar-catalogo» para que la IA use los datos nuevos.',
            'claves' => ['equipo', 'laptop', 'catalogo', 'hardware', 'agregar laptop', 'precio'],
        ],
        'software' => [
            'titulo' => 'Software',
            'guia' => 'Programas con sus requisitos mínimos y recomendados (RAM, CPU, GPU dedicada), que la IA usa para saber qué necesita cada persona. Tras cambiarlos, el equipo técnico debe exportar el catálogo del motor.',
            'claves' => ['software', 'programa', 'requisito'],
        ],
        'carreras' => [
            'titulo' => 'Carreras',
            'guia' => 'Carreras con los programas típicos de cada una: se precargan en el perfil del cliente cuando elige su carrera.',
            'claves' => ['carrera'],
        ],
        'usuarios' => [
            'titulo' => 'Usuarios y roles',
            'guia' => 'Para dar acceso, la persona primero crea su cuenta en el sitio; luego escribe su correo y elige el rol (Ventas, Almacén, Contabilidad o Administrador). Para quitarle el acceso se le devuelve el rol «Cliente». Nadie puede cambiar su propio rol.',
            'claves' => ['usuario', ' rol', 'roles', 'permiso', 'acceso', 'asign'],
        ],
        'psicologia' => [
            'titulo' => 'Perfil de clientes (Psicología)',
            'guia' => 'Resumen, sin nombres, de las respuestas del cuestionario de bienvenida (movilidad, molestias, prioridades, cómo prefieren decidir) y si la recomendación genera confianza: qué tanto eligen la primera laptop recomendada según cómo deciden.',
            'claves' => ['psicolog', 'cuestionario', 'perfil de cliente', 'confianza'],
        ],
        'ambiental' => [
            'titulo' => 'Recojo RAEE (Ing. Ambiental)',
            'guia' => 'Lista de equipos viejos que los clientes pidieron entregar al comprar. Avanza en orden: «Marcar recogido» cuando se recoge al entregar la laptop nueva y «Marcar reciclado» cuando se entrega a una empresa autorizada. Muestra indicadores y los kilos de residuos evitados (estimación).',
            'claves' => ['raee', 'recojo', 'recicl', 'ambiental', 'equipo viejo'],
        ],
    ];

    /** @return array<string, array{titulo: string, guia: string, claves: list<string>}> secciones que el rol puede ver */
    public static function paraRol(string $rol): array
    {
        return array_intersect_key(self::SECCIONES, array_flip(Roles::permisos($rol)));
    }

    /** Guía de las secciones del rol, en líneas, para las instrucciones del asistente. */
    public static function texto(string $rol): string
    {
        return collect(self::paraRol($rol))
            ->map(fn (array $s) => "- {$s['titulo']}: {$s['guia']}")
            ->join("\n");
    }
}
