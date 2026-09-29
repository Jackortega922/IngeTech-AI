<?php

namespace App\Support;

/**
 * Cuestionario de bienvenida (disciplina: Psicología). Se hace una vez, al crear la cuenta, para
 * conocer al cliente: cómo usará la laptop, qué le molesta de la actual, cómo prefiere decidir.
 *
 * Criterios de diseño (psicología de encuestas):
 * - 10 preguntas como máximo (~2 minutos): con más, la gente abandona.
 * - Una pregunta por pantalla, con progreso visible y "Omitir" siempre disponible.
 * - Nada de ingresos ni datos sensibles; el cliente puede editar o borrar sus respuestas.
 * - No se repite lo que pide el formulario de recomendación (actividades, programas,
 *   presupuesto), porque eso cambia en cada compra.
 *
 * Esta lista es la única fuente: la usa la validación del servidor y la pantalla la recibe tal
 * cual, así no pueden quedar desalineadas.
 */
class CuestionarioBienvenida
{
    public const PREGUNTAS = [
        [
            'clave' => 'para_quien',
            'tipo' => 'unica',
            'pregunta' => '¿La laptop es para ti o para otra persona?',
            'ayuda' => 'Por ejemplo, un padre que busca una laptop para su hijo.',
            'opciones' => [
                'yo' => 'Para mí',
                'otra_persona' => 'Para otra persona (hijo/a, familiar, trabajador)',
            ],
        ],
        [
            'clave' => 'movilidad',
            'tipo' => 'unica',
            'pregunta' => '¿Se quedará en un escritorio o la llevarás contigo?',
            'ayuda' => 'Define si conviene una laptop grande y cómoda o una ligera.',
            'opciones' => [
                'fija' => 'Casi siempre en el mismo escritorio',
                'a_veces' => 'La llevo de vez en cuando',
                'diario' => 'La llevo a diario (universidad, oficina, cafés)',
            ],
        ],
        [
            'clave' => 'lejos_enchufe',
            'tipo' => 'unica',
            'pregunta' => '¿Pasarás mucho tiempo lejos de un enchufe?',
            'ayuda' => null,
            'opciones' => [
                'casi_nunca' => 'Casi nunca, siempre tengo uno cerca',
                'a_veces' => 'A veces, unas pocas horas',
                'muchas_horas' => 'Sí, muchas horas seguidas',
            ],
        ],
        [
            'clave' => 'molestias',
            'tipo' => 'multiple',
            'pregunta' => '¿Qué es lo que más te molesta de tu computadora actual?',
            'ayuda' => 'Puedes marcar varias. Así evitamos que te pase lo mismo con la nueva.',
            'opciones' => [
                'lenta_al_encender' => 'Tarda mucho en encender o abrir programas',
                'se_congela' => 'Se congela con muchas pestañas o programas',
                'bateria_corta' => 'La batería dura poco',
                'pesada' => 'Pesa mucho para llevarla',
                'se_calienta' => 'Se calienta demasiado',
                'pantalla_pequena' => 'La pantalla es pequeña o se ve mal',
                'no_tengo' => 'No tengo computadora',
            ],
        ],
        [
            'clave' => 'anios_uso',
            'tipo' => 'unica',
            'pregunta' => '¿Cuántos años esperas que te dure rindiendo bien?',
            'ayuda' => 'Si es para muchos años, conviene un poco más de lo que necesitas hoy.',
            'opciones' => [
                '2' => 'Unos 2 años',
                '3_4' => 'De 3 a 4 años',
                '5_mas' => '5 años o más',
            ],
        ],
        [
            'clave' => 'nivel_tecnologia',
            'tipo' => 'unica',
            'pregunta' => '¿Qué tan cómodo te sientes con la tecnología?',
            'ayuda' => 'Así te explicamos las cosas a tu medida.',
            'opciones' => [
                'principiante' => 'Poco: prefiero que me lo expliquen simple',
                'intermedio' => 'Me defiendo bien',
                'avanzado' => 'Mucho: quiero ver los detalles técnicos',
            ],
        ],
        [
            'clave' => 'prioridades',
            'tipo' => 'orden',
            'pregunta' => 'Si tuvieras que elegir, ¿qué valoras más?',
            'ayuda' => 'Ordénalas de la más importante a la menos importante.',
            'opciones' => [
                'precio' => 'Buen precio',
                'rendimiento' => 'Rendimiento y velocidad',
                'portabilidad' => 'Que sea ligera y fácil de llevar',
                'durabilidad' => 'Que me dure muchos años',
                'diseno' => 'Diseño y pantalla',
            ],
        ],
        [
            'clave' => 'estilo_decision',
            'tipo' => 'unica',
            'pregunta' => '¿Cómo prefieres decidir?',
            'ayuda' => 'No hay respuesta correcta: cada persona decide distinto.',
            'opciones' => [
                'la_mejor' => 'Dime cuál es la mejor para mí',
                'comparar' => 'Quiero comparar 2 o 3 opciones',
                'ver_todo' => 'Quiero ver todas las opciones',
            ],
        ],
        [
            'clave' => 'marcas',
            'tipo' => 'marcas',
            'pregunta' => '¿Tienes alguna marca que prefieras o que quieras evitar?',
            'ayuda' => 'Si te da igual, puedes seguir sin marcar nada.',
            'opciones' => [
                'Lenovo' => 'Lenovo',
                'HP' => 'HP',
                'Apple' => 'Apple',
                'ASUS' => 'ASUS',
                'Acer' => 'Acer',
            ],
        ],
        [
            'clave' => 'perifericos',
            'tipo' => 'multiple',
            'pregunta' => '¿Qué vas a conectar a la laptop?',
            'ayuda' => 'Así revisamos que tenga los puertos necesarios, sin adaptadores.',
            'opciones' => [
                'monitor' => 'Un monitor externo',
                'proyector' => 'Un proyector o TV',
                'tableta_grafica' => 'Una tableta gráfica',
                'muchas_usb' => 'Varias memorias USB, mouse, teclado',
                'camara_sd' => 'Tarjetas de cámara (SD)',
                'ninguno' => 'Nada en especial',
            ],
        ],
    ];

    /** Reglas de validación derivadas de PREGUNTAS. Todas son opcionales: se puede omitir cualquiera. */
    public static function reglas(): array
    {
        $reglas = [];
        foreach (self::PREGUNTAS as $p) {
            $opciones = array_map('strval', array_keys($p['opciones']));
            $en = 'in:'.implode(',', $opciones);

            switch ($p['tipo']) {
                case 'unica':
                    $reglas[$p['clave']] = ['nullable', 'string', $en];
                    break;
                case 'multiple':
                case 'orden':
                    $reglas[$p['clave']] = ['nullable', 'array'];
                    $reglas[$p['clave'].'.*'] = ['string', 'distinct', $en];
                    break;
                case 'marcas':
                    $reglas['marcas_preferidas'] = ['nullable', 'array'];
                    $reglas['marcas_preferidas.*'] = ['string', 'distinct', $en];
                    $reglas['marcas_evitar'] = ['nullable', 'array'];
                    $reglas['marcas_evitar.*'] = ['string', 'distinct', $en];
                    break;
            }
        }

        return $reglas;
    }
}
