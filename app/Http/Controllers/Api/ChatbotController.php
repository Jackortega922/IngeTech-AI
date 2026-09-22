<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carrera;
use App\Models\Laptop;
use App\Models\Software;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Asistente de preguntas frecuentes (Módulo "Sistemas Inteligentes" del
 * sílabo: NLP simple + base de conocimiento). No depende de un LLM externo
 * — responde por coincidencia de palabras clave contra el catálogo real
 * (carreras, software, hardware), para que funcione sin configurar ninguna
 * API de pago. El punto de integración queda aislado aquí: si más adelante
 * se conecta un LLM real (OpenAI/Claude/etc.), solo se reemplaza el cuerpo
 * de responder(), sin tocar el frontend.
 */
class ChatbotController extends Controller
{
    public function responder(Request $request)
    {
        $texto = $this->normalizar((string) $request->input('mensaje', ''));

        if ($texto === '') {
            return response()->json(['respuesta' => '¿En qué te ayudo? Puedes preguntarme por una carrera, un software o un equipo del catálogo.']);
        }

        // 1. ¿Coincide con alguna carrera?
        $carrera = Carrera::with('software')->get()->first(
            fn (Carrera $c) => Str::contains($texto, $this->normalizar($c->nombre)) || Str::contains($texto, $this->normalizar($c->clave))
        );
        if ($carrera) {
            $software = $carrera->software->pluck('nombre')->join(', ');
            $ram = $carrera->software->max('min_ram_gb') ?: 4;
            $cpu = $carrera->software->max('min_cpu_score') ?: 15;
            $gpu = $carrera->software->contains('min_gpu_dedicada', true);

            return response()->json(['respuesta' =>
                "Para {$carrera->nombre} el software típico es: {$software}. ".
                "Vas a necesitar al menos {$ram} GB de RAM y un procesador con puntaje ≥ {$cpu}/100".
                ($gpu ? ', además de GPU dedicada.' : '.').
                ' Puedes generar tu recomendación personalizada en la pestaña "Nueva recomendación".',
            ]);
        }

        // 2. ¿Coincide con algún software?
        $software = Software::all()->first(
            fn (Software $s) => Str::contains($texto, $this->normalizar($s->nombre)) || Str::contains($texto, $this->normalizar($s->clave))
        );
        if ($software) {
            return response()->json(['respuesta' =>
                "{$software->nombre} ({$software->categoria}) necesita mínimo {$software->min_ram_gb} GB de RAM y CPU ≥ {$software->min_cpu_score}/100".
                ($software->min_gpu_dedicada ? ', con GPU dedicada' : '').
                ". Para un uso más fluido, lo recomendado es {$software->rec_ram_gb} GB de RAM y CPU ≥ {$software->rec_cpu_score}/100.",
            ]);
        }

        // 3. ¿Coincide con algún equipo (marca o modelo)?
        $equipo = Laptop::all()->first(
            fn (Laptop $l) => Str::contains($texto, $this->normalizar($l->modelo)) || Str::contains($texto, $this->normalizar($l->marca))
        );
        if ($equipo) {
            return response()->json(['respuesta' =>
                "{$equipo->marca} {$equipo->modelo}: {$equipo->cpu}, {$equipo->ram_gb} GB RAM, ".
                "{$equipo->almacenamiento_tipo} {$equipo->almacenamiento_gb} GB, ".
                ($equipo->gpu_dedicada ? "GPU dedicada ({$equipo->gpu})" : "gráficos integrados ({$equipo->gpu})").
                ". Precio: S/ ".number_format((float) $equipo->precio_soles, 0, '.', ',').' en '.($equipo->tienda ?? 'tienda de referencia').'.',
            ]);
        }

        // 4. Preguntas frecuentes genéricas por palabra clave
        $faq = [
            'presupuesto' => 'El presupuesto se ingresa en el formulario de Perfil — el sistema solo te muestra equipos que no lo excedan.',
            'compatib' => 'La compatibilidad se calcula comparando la RAM, el procesador y la GPU de cada equipo contra lo que exige el software de tu carrera.',
            'compara' => 'Puedes marcar hasta 3 equipos en el Catálogo de Hardware y luego abrir "Comparador" para verlos lado a lado.',
            'personaliz' => 'Desde tu recomendación puedes personalizar RAM, almacenamiento, kits y accesorios antes de confirmar.',
            'kit' => 'Los kits agrupan accesorios (mochila, mouse, cooler, etc.) con un precio conjunto, normalmente más barato que comprarlos sueltos.',
            'admin' => 'El panel de Administración permite editar el catálogo de hardware, software y carreras, además de ver métricas de uso.',
        ];
        foreach ($faq as $clave => $respuesta) {
            if (Str::contains($texto, $clave)) {
                return response()->json(['respuesta' => $respuesta]);
            }
        }

        return response()->json(['respuesta' =>
            'No encontré eso en el catálogo. Puedes preguntarme por una carrera (ej. "Ingeniería Civil"), '.
            'un software (ej. "AutoCAD") o un equipo (ej. "Legion 5"), o cómo funciona la compatibilidad, el comparador o los kits.',
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
