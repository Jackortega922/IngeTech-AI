<?php

namespace App\Services\Asistente;

use App\Models\Actividad;
use App\Models\Laptop;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Asistente conversacional con un LLM (Gemini, de Google), tarea A13. Es una función complementaria:
 * NO reemplaza al motor de recomendación (ver ADR 0005). Por eso:
 *
 * - Se le pasa el catálogo real en el prompt y se le ordena recomendar solo de ahí, para que
 *   no invente modelos ni precios (grounding: la respuesta se apoya en datos propios).
 * - No se le manda el perfil del usuario ni su nombre (privacidad, RF-ET2): solo lo que la
 *   persona escribe en el chat.
 * - Si no hay API key o Gemini falla/tarda, devuelve null y el controlador responde con el
 *   asistente por palabras clave. El chat nunca se queda sin respuesta.
 *
 * Se usa el endpoint de Gemini compatible con el formato de OpenAI (/chat/completions): es el
 * mismo formato que antes usaba DeepSeek, que es de pago; Gemini tiene un plan gratuito sin
 * tarjeta (Google AI Studio). En ese plan Google puede usar las conversaciones para mejorar sus
 * productos: por eso no se le envían datos del usuario y la página "Cómo decide la IA" lo avisa.
 */
class GeminiAsistente
{
    public function disponible(): bool
    {
        return filled(config('services.gemini.key'));
    }

    /**
     * @param  array<int, array{autor: string, texto: string}>  $historial  mensajes previos del chat
     */
    public function responder(string $mensaje, array $historial = []): ?string
    {
        if (! $this->disponible()) {
            return null;
        }

        $mensajes = [['role' => 'system', 'content' => $this->instrucciones()]];
        foreach ($historial as $m) {
            $mensajes[] = ['role' => $m['autor'] === 'usuario' ? 'user' : 'assistant', 'content' => $m['texto']];
        }
        $mensajes[] = ['role' => 'user', 'content' => $mensaje];

        try {
            $respuesta = Http::withToken(config('services.gemini.key'))
                ->acceptJson()
                ->timeout(config('services.gemini.timeout'))
                ->post(rtrim(config('services.gemini.url'), '/').'/chat/completions', [
                    'model' => config('services.gemini.model'),
                    'messages' => $mensajes,
                    'temperature' => 0.4,
                    // Margen para el razonamiento interno de Gemini 2.5, que también cuenta como tokens; el
                    // largo de la respuesta lo limita el prompt (máximo 120 palabras).
                    'max_tokens' => 1024,
                    'stream' => false,
                ]);

            if ($respuesta->failed()) {
                Log::warning('Gemini respondió con error', ['status' => $respuesta->status()]);

                return null;
            }

            $texto = trim((string) $respuesta->json('choices.0.message.content'));

            return $texto !== '' ? $texto : null;
        } catch (Throwable $e) {
            Log::warning('No se pudo contactar a Gemini', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function instrucciones(): string
    {
        $catalogo = Laptop::orderBy('precio_soles')->get()->map(fn (Laptop $l) => sprintf(
            '- %s %s | %s | %d GB RAM%s | %s %d GB | GPU: %s (%s) | %s | S/ %s%s',
            $l->marca,
            $l->modelo,
            $l->cpu,
            $l->ram_gb,
            $l->ram_ampliable_gb ? " (ampliable a {$l->ram_ampliable_gb} GB)" : '',
            $l->almacenamiento_tipo,
            $l->almacenamiento_gb,
            $l->gpu ?? 'integrada',
            $l->gpu_dedicada ? 'dedicada' : 'integrada',
            $l->bateria_horas ? "batería {$l->bateria_horas} h" : 'batería s/d',
            number_format((float) $l->precio_soles, 0, '.', ','),
            // Inventario: solo disponible o agotada, sin cantidades (no hace falta para vender).
            $l->stock > 0 ? '' : ' | AGOTADA',
        ))->join("\n");

        $actividades = Actividad::all()->map(fn (Actividad $a) => sprintf(
            '- %s: +%d GB de RAM sobre lo básico%s',
            $a->nombre,
            $a->extra_ram_gb,
            $a->requiere_gpu ? ', necesita GPU dedicada' : '',
        ))->join("\n");

        return <<<PROMPT
        Eres el asistente de ventas de IngeTech AI, una tienda peruana de laptops. Respondes en español, con un tono cálido y calmado.

        Reglas:
        - Solo recomiendas laptops del CATÁLOGO de abajo, con sus precios exactos en soles. Nunca inventes modelos, precios, stock, descuentos ni promociones.
        - Las laptops marcadas AGOTADA no se pueden comprar ahora: no las recomiendes; si preguntan por una, dilo y sugiere una parecida que esté disponible.
        - Si te preguntan algo que no está en esta información (cantidad de unidades, fechas de entrega, promociones), di que no lo sabes y sugiere escribir a un asesor por WhatsApp (botón verde, abajo a la izquierda).
        - Si la persona está preocupada por el presupuesto o se siente confundida, primero valida esa preocupación y después da el dato.
        - Para una recomendación a su medida, invítala a usar la "Recomendación con IA" del sitio (pide crear una cuenta): calcula la compatibilidad según su carrera u ocupación, sus actividades y su presupuesto.
        - No pidas datos personales (DNI, teléfono, dirección, tarjetas). Si los comparte, no los repitas.
        - La tienda hace envíos a todo el Perú. Se puede comprar en el sitio: elegir la laptop, personalizarla y pagar con tarjeta.
        - Responde breve: máximo 120 palabras. Puedes usar listas cortas. No uses tablas.
        - Si la pregunta no tiene que ver con laptops o con la tienda, redirige con amabilidad.

        CATÁLOGO (precios referenciales):
        {$catalogo}

        Qué pide cada actividad (sobre una base de 8 GB de RAM):
        {$actividades}
        PROMPT;
    }
}
