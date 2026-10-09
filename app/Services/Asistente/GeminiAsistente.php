<?php

namespace App\Services\Asistente;

use App\Models\Accesorio;
use App\Models\Actividad;
use App\Models\Kit;
use App\Models\Laptop;
use App\Support\GuiaPanel;
use App\Support\Roles;
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
 *   persona escribe en el chat. Si escribe alguien del personal, se le dice además su rol (no
 *   identifica a nadie) para cambiar a la guía del panel de ese rol (modo personal, GuiaPanel).
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
    public function responder(string $mensaje, array $historial = [], ?string $rolPersonal = null): ?string
    {
        if (! $this->disponible()) {
            return null;
        }

        // Personal de la tienda: guía del panel de su rol. Clientes y visitantes: asistente de ventas.
        $instrucciones = $rolPersonal ? $this->instruccionesPersonal($rolPersonal) : $this->instrucciones();
        $mensajes = [['role' => 'system', 'content' => $instrucciones]];
        foreach ($historial as $m) {
            $mensajes[] = ['role' => $m['autor'] === 'usuario' ? 'user' : 'assistant', 'content' => $m['texto']];
        }
        $mensajes[] = ['role' => 'user', 'content' => $mensaje];

        // GEMINI_MODEL puede ser una lista ("modelo-a,modelo-b"): en el plan gratuito un modelo a
        // veces está saturado (503) o Google lo retira (404). Si falla uno, se prueba el siguiente.
        // Tope total de espera: si los modelos van fallando, el visitante no espera más que esto
        // antes de que conteste el asistente de respaldo.
        $limite = microtime(true) + (int) config('services.gemini.espera_total');
        foreach (self::modelos() as $modelo) {
            $restante = (int) floor($limite - microtime(true));
            if ($restante < 2) {
                break;
            }
            $texto = $this->pedir($modelo, $mensajes, min((int) config('services.gemini.timeout'), $restante));
            if ($texto !== null) {
                return $texto;
            }
        }

        return null;
    }

    /** @return list<string> */
    public static function modelos(): array
    {
        return array_values(array_filter(array_map('trim', explode(',', (string) config('services.gemini.model')))));
    }

    private function pedir(string $modelo, array $mensajes, int $timeout): ?string
    {
        try {
            $respuesta = Http::withToken(config('services.gemini.key'))
                ->acceptJson()
                ->timeout($timeout)
                ->post(rtrim(config('services.gemini.url'), '/').'/chat/completions', [
                    'model' => $modelo,
                    'messages' => $mensajes,
                    'temperature' => 0.4,
                    // Margen para el razonamiento interno de Gemini, que también cuenta como tokens; el
                    // largo de la respuesta lo limita el prompt (máximo 120 palabras).
                    'max_tokens' => 1024,
                    'stream' => false,
                ]);

            if ($respuesta->failed()) {
                Log::warning('Gemini respondió con error', [
                    'modelo' => $modelo,
                    'status' => $respuesta->status(),
                    'detalle' => mb_substr($respuesta->body(), 0, 300),
                ]);

                return null;
            }

            // Por si igual manda formato Markdown: el chat muestra texto plano, así que "**negrita**"
            // y "# título" saldrían con los símbolos a la vista.
            $texto = trim(preg_replace(['/\*\*(.+?)\*\*/s', '/^#{1,6}\s*/m', '/^\*\s+/m'], ['$1', '', '- '], (string) $respuesta->json('choices.0.message.content')));

            return $texto !== '' ? $texto : null;
        } catch (Throwable $e) {
            Log::warning('No se pudo contactar a Gemini', ['modelo' => $modelo, 'error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Modo personal: solo explica cómo usar las secciones del panel de su rol. No recibe datos de
     * la tienda, así que no puede dar cifras de pedidos, clientes o ventas: indica dónde verlas.
     */
    private function instruccionesPersonal(string $rol): string
    {
        $nombreRol = Roles::NOMBRES[$rol] ?? $rol;
        $guia = GuiaPanel::texto($rol);

        return <<<PROMPT
        Eres el asistente interno del panel de IngeTech AI, una tienda peruana de laptops con recomendación por IA. Hablas con una persona del personal de la tienda con el rol «{$nombreRol}». Respondes en español, con un tono cálido y claro.

        Reglas:
        - Solo explicas cómo usar las secciones del panel de su rol (lista de abajo), paso a paso si hace falta.
        - Nunca menciones secciones, botones ni funciones que no estén en la lista de abajo.
        - Tú no tienes acceso a los datos de la tienda (pedidos, clientes, ventas, stock ni cifras): nunca inventes cifras. Si te piden un dato, indica en qué sección de su lista puede verlo; si ninguna de sus secciones lo muestra, dile que esa información no está en las secciones de su rol y que la consulte con un administrador.
        - No pidas ni repitas datos personales de clientes.
        - Responde breve: máximo 120 palabras. Escribe en texto plano, sin asteriscos ni otros símbolos de formato. Para listas usa guiones. No uses tablas.

        SECCIONES DEL PANEL DE SU ROL:
        {$guia}
        PROMPT;
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

        // Kits y accesorios con su precio real (para personalizar la compra). El ahorro del kit se
        // calcula igual que en /marketing: suma de los accesorios sueltos menos el precio del kit.
        $kits = Kit::with('accesorios')->get()->map(function (Kit $k) {
            $suelto = $k->accesorios->sum(fn (Accesorio $a) => (float) $a->precio_soles);
            $ahorro = max(0, $suelto - (float) $k->precio_soles);

            return sprintf('- %s: %s | S/ %s%s', $k->nombre, $k->accesorios->pluck('nombre')->join(' + '),
                number_format((float) $k->precio_soles, 0, '.', ','), $ahorro > 0 ? ' (ahorra S/ '.number_format($ahorro, 0, '.', ',').' frente a comprarlos sueltos)' : '');
        })->join("\n") ?: '- (no hay kits cargados)';
        $accesorios = Accesorio::orderBy('precio_soles')->get()
            ->map(fn (Accesorio $a) => sprintf('- %s: S/ %s', $a->nombre, number_format((float) $a->precio_soles, 0, '.', ',')))
            ->join("\n") ?: '- (no hay accesorios cargados)';
        $plazoReclamo = (int) config('derecho.plazo_respuesta_dias_habiles');

        // Solo se menciona el botón de WhatsApp si la tienda configuró un número: si no, el botón
        // no aparece y la IA estaría mandando a la gente a algo que no existe.
        $contactoAsesor = config('contacto.whatsapp')
            ? 'sugiere escribir a un asesor por WhatsApp (botón verde, abajo a la izquierda)'
            : 'sugiere revisar las Preguntas frecuentes o la página de Términos y Garantía';

        return <<<PROMPT
        Eres el asistente de ventas de IngeTech AI, una tienda peruana de laptops. Respondes en español, con un tono cálido y calmado.

        Reglas:
        - Solo recomiendas laptops del CATÁLOGO de abajo, con sus precios exactos en soles. Nunca inventes modelos, precios, stock, descuentos ni promociones.
        - Las laptops marcadas AGOTADA no se pueden comprar ahora: no las recomiendes; si preguntan por una, dilo y sugiere una parecida que esté disponible.
        - Si te preguntan algo que no está en esta información (cantidad de unidades, fechas de entrega), di que no lo sabes y {$contactoAsesor}.
        - Cupones: existen, se escriben al pagar y el descuento se aplica antes del IGV. Nunca des ni inventes códigos de cupón: si piden uno, di que la tienda los comparte en sus promociones.
        - Si la persona está preocupada por el presupuesto o se siente confundida, primero valida esa preocupación y después da el dato.
        - Para una recomendación a su medida, invítala a usar la "Recomendación con IA" del sitio (pide crear una cuenta): calcula la compatibilidad según su carrera u ocupación, sus actividades y su presupuesto.
        - No pidas datos personales (DNI, teléfono, dirección, tarjetas). Si los comparte, no los repitas.
        - La tienda hace envíos a todo el Perú. Se puede comprar en el sitio: elegir la laptop, personalizarla y pagar con tarjeta.
        - Responde breve: máximo 120 palabras. Escribe en texto plano, sin asteriscos ni otros símbolos de formato (el chat no los muestra como negrita). Para listas usa guiones. No uses tablas.
        - Si la pregunta no tiene que ver con laptops o con la tienda, redirige con amabilidad.

        CATÁLOGO (precios referenciales):
        {$catalogo}

        Qué pide cada actividad (sobre una base de 8 GB de RAM):
        {$actividades}

        KITS (se agregan al personalizar la laptop):
        {$kits}

        ACCESORIOS SUELTOS:
        {$accesorios}

        GARANTÍA, DEVOLUCIONES Y RECLAMOS (lo mismo que dice la página Términos y Garantía):
        - Garantía: la de fábrica del fabricante, típicamente 12 meses contra defectos de fabricación. Cubre fallas de hardware con uso normal; no cubre mal uso, líquidos ni modificaciones no autorizadas.
        - Devoluciones: cambio o devolución dentro de los 7 días calendario después de la compra, si el equipo está como se entregó (empaque original, sin señales de uso). Después solo aplica la garantía de fábrica.
        - Reclamos: hay un Libro de Reclamaciones virtual en el sitio (enlace en el pie de página y en el menú), sin necesidad de cuenta. La tienda debe responder en máximo {$plazoReclamo} días hábiles. Reclamar no impide acudir a INDECOPI.
        - Cómo decide la IA de recomendación: lo explica la página "Cómo decide la IA" del sitio.
        - Reciclaje: al comprar se puede pedir que recojan la laptop anterior para reciclarla (residuos electrónicos).
        PROMPT;
    }
}
