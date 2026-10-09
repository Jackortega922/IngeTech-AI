<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carrera;
use App\Models\Laptop;
use App\Models\Software;
use App\Services\Asistente\GeminiAsistente;
use App\Support\GuiaPanel;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Chat del asistente (Módulo "Sistemas Inteligentes" del sílabo). Tiene dos capas:
 *
 * 1. Si hay GEMINI_API_KEY, responde un LLM (GeminiAsistente, tarea A13) anclado al
 *    catálogo real.
 * 2. Si no hay key, o Gemini falla o tarda, responde el asistente por palabras clave
 *    (responderPorReglas): NLP simple + base de conocimiento contra el catálogo real
 *    (carreras, software, hardware). Así el chat funciona sin ninguna API de pago.
 *
 * El tono de las respuestas está diseñado con la disciplina de Psicología:
 * elegir un equipo con presupuesto limitado genera ansiedad, así que antes
 * de dar el dato técnico se valida la preocupación del usuario (escucha
 * activa) y se cierra con una invitación a avanzar, en vez de una respuesta
 * seca de FAQ. Ver docs/contexto-proyecto.md §5.1.
 */
class ChatbotController extends Controller
{
    private const SALUDOS = [
        'Claro, te cuento.',
        'Buena pregunta.',
        'Con gusto te ayudo con eso.',
        'Vamos a verlo juntos.',
    ];

    private const CIERRES = [
        '¿Quieres que armemos tu recomendación con estos datos?',
        '¿Seguimos con tu recomendación personalizada?',
        'Cuando quieras, pulsa "Recomiéndame con IA" y lo vemos con calma.',
    ];

    public function responder(Request $request, GeminiAsistente $llm)
    {
        $datos = $request->validate([
            'mensaje' => ['nullable', 'string', 'max:500'],
            'historial' => ['array', 'max:10'],
            'historial.*.autor' => ['required', 'in:usuario,bot'],
            'historial.*.texto' => ['required', 'string', 'max:2000'],
        ]);

        // Personal de la tienda (modo personal): el asistente explica su panel. Solo viaja el rol.
        $usuario = $request->user();
        $rolPersonal = $usuario?->es_personal ? $usuario->rol : null;

        $mensaje = trim((string) ($datos['mensaje'] ?? ''));
        if ($mensaje !== '') {
            $respuesta = $llm->responder($mensaje, $datos['historial'] ?? [], $rolPersonal);
            if ($respuesta !== null) {
                return response()->json(['respuesta' => $respuesta, 'fuente' => 'gemini']);
            }
        }

        return $rolPersonal ? $this->responderAlPersonal($mensaje, $rolPersonal) : $this->responderPorReglas($request);
    }

    /**
     * Respaldo del modo personal (sin Gemini): busca la sección del panel por palabras clave y
     * devuelve su guía, solo si el rol puede verla.
     */
    private function responderAlPersonal(string $mensaje, string $rol)
    {
        $texto = $this->normalizar($mensaje);
        $propias = GuiaPanel::paraRol($rol);
        $nombreRol = Roles::NOMBRES[$rol] ?? $rol;
        $coincide = fn (array $s) => collect($s['claves'])->contains(fn ($clave) => Str::contains($texto, $clave));

        $encontradas = collect($propias)->filter($coincide)->take(2);
        if ($encontradas->isNotEmpty()) {
            return response()->json(['respuesta' => $encontradas->map(fn ($s) => "{$s['titulo']}: {$s['guia']}")->join("\n\n")]);
        }

        // Pregunta por una sección de otro rol.
        $ajena = collect(GuiaPanel::SECCIONES)->diffKeys($propias)->first($coincide);
        if ($ajena) {
            return response()->json(['respuesta' => "La sección {$ajena['titulo']} no está disponible para tu rol ({$nombreRol}). Si la necesitas, consúltalo con un administrador."]);
        }

        $lista = collect($propias)->pluck('titulo')->unique()->join(', ');

        return response()->json(['respuesta' => "¡Hola! Soy el asistente del panel. Con tu rol ({$nombreRol}) puedo explicarte cómo usar: {$lista}. Pregúntame, por ejemplo, cómo se hace algo en una de esas secciones."]);
    }

    private function responderPorReglas(Request $request)
    {
        $nombre = $request->user()?->name;
        $saludoNombre = $nombre ? explode(' ', trim($nombre))[0] : null;
        $texto = $this->normalizar((string) $request->input('mensaje', ''));

        // Mensaje vacío o un simple saludo ("hola", "buenas tardes"): se saluda de vuelta en vez
        // de responder "no encontré eso en el catálogo".
        $soloSaludo = preg_match('/^(hola+|holi|buen[oa]s?( dias| tardes| noches)?|hey|que tal|saludos)[\s!.,¿?]*$/u', $texto) === 1;
        if ($texto === '' || $soloSaludo) {
            $hola = $saludoNombre ? "¡Hola, {$saludoNombre}!" : '¡Hola!';

            return response()->json(['respuesta' => "{$hola} ¿En qué te ayudo? Puedes preguntarme por una carrera, un software o un equipo del catálogo — o simplemente contarme qué necesitas y vemos juntos qué te conviene."]);
        }

        // 0. Ansiedad por presupuesto — antes que nada, validar la preocupación
        // (Psicología: reducir el estrés de una decisión de compra grande antes
        // de entrar en tecnicismos).
        $preocupacionPresupuesto = ['no me alcanza', 'muy caro', 'no tengo mucho presupuesto', 'poco presupuesto', 'no tengo plata', 'no tengo dinero', 'barato'];
        foreach ($preocupacionPresupuesto as $clave) {
            if (Str::contains($texto, $clave)) {
                return response()->json(['respuesta' => 'Entiendo la preocupación — elegir con un presupuesto ajustado es normal y aun así se puede encontrar un buen equipo. '.
                    'El sistema solo te muestra opciones que sí calzan con lo que puedas pagar, así que no vas a ver nada fuera de tu alcance. '.
                    'Cuéntame tu presupuesto aproximado en el formulario de Perfil y te muestro qué te conviene más.',
                ]);
            }
        }

        // 0.1. Confusión o abrumo — validar antes de resolver.
        $confundido = ['no entiendo', 'no se cual', 'no se que', 'estoy confundido', 'me confunde', 'ayuda', 'no se elegir'];
        foreach ($confundido as $clave) {
            if (Str::contains($texto, $clave)) {
                return response()->json(['respuesta' => 'Tranquilo, es normal sentirse abrumado con tantas specs técnicas — para eso existe este sistema. '.
                    'No necesitas saber de tecnología: solo cuéntame tu carrera, qué actividades haces y tu presupuesto, y yo traduzco eso a la laptop que realmente necesitas.',
                ]);
            }
        }

        $saludo = self::SALUDOS[array_rand(self::SALUDOS)];
        $cierre = self::CIERRES[array_rand(self::CIERRES)];

        // 1. ¿Coincide con alguna carrera?
        $carrera = Carrera::with('software')->get()->first(
            fn (Carrera $c) => Str::contains($texto, $this->normalizar($c->nombre)) || Str::contains($texto, $this->normalizar($c->clave))
        );
        if ($carrera) {
            $software = $carrera->software->pluck('nombre')->join(', ');
            $ram = $carrera->software->max('min_ram_gb') ?: 4;
            $cpu = $carrera->software->max('min_cpu_score') ?: 15;
            $gpu = $carrera->software->contains('min_gpu_dedicada', true);

            return response()->json(['respuesta' => "{$saludo} Para {$carrera->nombre} el software típico es: {$software}. ".
                "Vas a necesitar al menos {$ram} GB de RAM y un procesador con puntaje ≥ {$cpu}/100".
                ($gpu ? ', además de GPU dedicada.' : '.').
                " {$cierre}",
            ]);
        }

        // 2. ¿Coincide con algún software?
        $software = Software::all()->first(
            fn (Software $s) => Str::contains($texto, $this->normalizar($s->nombre)) || Str::contains($texto, $this->normalizar($s->clave))
        );
        if ($software) {
            return response()->json(['respuesta' => "{$saludo} {$software->nombre} ({$software->categoria}) necesita mínimo {$software->min_ram_gb} GB de RAM y CPU ≥ {$software->min_cpu_score}/100".
                ($software->min_gpu_dedicada ? ', con GPU dedicada' : '').
                ". Para un uso más fluido, lo recomendado es {$software->rec_ram_gb} GB de RAM y CPU ≥ {$software->rec_cpu_score}/100.",
            ]);
        }

        // 3. ¿Coincide con algún equipo (marca o modelo)?
        $equipo = Laptop::all()->first(
            fn (Laptop $l) => Str::contains($texto, $this->normalizar($l->modelo)) || Str::contains($texto, $this->normalizar($l->marca))
        );
        if ($equipo) {
            return response()->json(['respuesta' => "{$saludo} {$equipo->marca} {$equipo->modelo}: {$equipo->cpu}, {$equipo->ram_gb} GB RAM, ".
                "{$equipo->almacenamiento_tipo} {$equipo->almacenamiento_gb} GB, ".
                ($equipo->gpu_dedicada ? "GPU dedicada ({$equipo->gpu})" : "gráficos integrados ({$equipo->gpu})").
                '. Precio: S/ '.number_format((float) $equipo->precio_soles, 0, '.', ',').' en '.($equipo->tienda ?? 'tienda de referencia').'.',
            ]);
        }

        // 4. Preguntas frecuentes genéricas por palabra clave
        $faq = [
            'presupuesto' => 'El presupuesto se ingresa en el formulario de Perfil — el sistema solo te muestra equipos que no lo excedan, así que puedes explorar sin miedo a pasarte de precio.',
            'compatib' => 'La compatibilidad se calcula comparando la RAM, el procesador y la GPU de cada equipo contra lo que exige el software de tu carrera.',
            'compara' => 'Puedes marcar hasta 3 laptops en el catálogo (ícono de balanza) y luego abrir el Comparador para verlas lado a lado, a tu ritmo.',
            'garantia' => 'Todas tienen la garantía de fábrica, típicamente 12 meses contra defectos de fabricación. Detalle en Términos y Garantía.',
            'devol' => 'Puedes pedir cambio o devolución dentro de los 7 días calendario después de la compra, si el equipo está como se entregó. Detalle en Términos y Garantía.',
            'reclam' => 'Si algo salió mal, presenta tu reclamo o queja en el Libro de Reclamaciones (enlace al pie de la página). Te respondemos en máximo 15 días hábiles.',
            'envio' => 'Hacemos envíos a todo el Perú. Puedes seguir tu pedido en "Seguimiento de pedido" con tu código y tu correo.',
            'pedido' => 'Para ver tu pedido entra a "Seguimiento de pedido" con el código que te llegó al correo, o a "Mis pedidos" si compraste con tu cuenta.',
            'pago' => 'Se paga en el sitio con tarjeta al terminar de personalizar la laptop (en este proyecto el pago es simulado: no se cobra nada).',
            'personaliz' => 'Desde tu recomendación puedes personalizar RAM, almacenamiento, kits y accesorios antes de confirmar.',
            'kit' => 'Los kits agrupan accesorios (mochila, mouse, cooler, etc.) con un precio conjunto, normalmente más barato que comprarlos sueltos.',
            'admin' => 'El panel de Administración permite editar el catálogo de hardware, software y carreras, además de ver métricas de uso.',
        ];
        foreach ($faq as $clave => $respuesta) {
            if (Str::contains($texto, $clave)) {
                return response()->json(['respuesta' => "{$saludo} {$respuesta}"]);
            }
        }

        // 5. Quiere comprar o no sabe cuál elegir (después de las respuestas específicas, que ganan): los dos caminos de la tienda, sin presión.
        $quiereComprar = ['comprar', 'compra', 'quiero una laptop', 'necesito una laptop', 'busco una laptop', 'recomiend', 'que laptop', 'cual laptop', 'me conviene'];
        foreach ($quiereComprar as $clave) {
            if (Str::contains($texto, $clave)) {
                return response()->json(['respuesta' => "¡Genial, te ayudo a elegir! Tienes dos caminos:\n".
                    "- Recomiéndame con IA (botón celeste de arriba): cuentas para qué usarás la laptop y tu presupuesto, y la IA calcula cuál te conviene y por qué.\n".
                    "- Nuestras laptops: miras el catálogo, comparas hasta 3 y compras directo, con o sin cuenta.\n".
                    'Si prefieres, cuéntame aquí para qué la usarás y cuánto quieres gastar.',
                ]);
            }
        }

        // 6. No sabe cómo usar la tienda.
        $comoFunciona = ['como funciona', 'que hace', 'para que sirve', 'como uso', 'como se usa', 'que es ingetech', 'como compro'];
        foreach ($comoFunciona as $clave) {
            if (Str::contains($texto, $clave)) {
                return response()->json(['respuesta' => "Es sencillo:\n".
                    "1. Pulsa \"Recomiéndame con IA\" y cuéntanos qué harás con la laptop, qué programas usas y tu presupuesto.\n".
                    "2. La IA compara eso con cada laptop del catálogo y te muestra las que mejor encajan, con su porcentaje de compatibilidad y el porqué.\n".
                    "3. Elige una, personalízala (RAM, almacenamiento, accesorios) y cómprala con envío a todo el Perú.\n".
                    'También puedes ver el catálogo y comparar laptops sin crear cuenta.',
                ]);
            }
        }

        return response()->json(['respuesta' => 'Mmm, esa no la tengo clara. Puedo ayudarte con cosas como: qué laptop te conviene, cómo funciona la tienda, '.
            'un programa (ej. "AutoCAD"), una carrera (ej. "Ingeniería Civil"), un modelo (ej. "Legion 5"), envíos, garantía o reclamos. '.
            'Si quieres una recomendación a tu medida, pulsa "Recomiéndame con IA".',
        ]);
    }

    /**
     * Minúsculas y sin tildes, para que "Ingenieria" (sin tilde) siga
     * encontrando "Ingeniería" en el catálogo.
     */
    private function normalizar(string $texto): string
    {
        return Str::lower(Str::ascii(trim($texto)));
    }
}
