<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\EncuestaSatisfaccion;
use App\Models\Pedido;
use App\Support\AccesoPedido;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Encuesta de satisfacción después de la entrega. Se responde desde la página del pedido (quien
 * puede verlo) o desde el enlace firmado del correo de "entregado", sin iniciar sesión: así también
 * la responde quien compró sin cuenta. La página del enlace no muestra dirección ni teléfono.
 */
class EncuestaController extends Controller
{
    /** Página del enlace del correo (ruta firmada). */
    public function mostrar(Request $request, string $codigo)
    {
        $pedido = Pedido::with(['personalizacion.laptop', 'encuesta'])->where('codigo', $codigo)->firstOrFail();

        return Inertia::render('sistemas/encuesta/index', [
            'codigo' => $pedido->codigo,
            'laptop' => $pedido->personalizacion?->laptop ? "{$pedido->personalizacion->laptop->marca} {$pedido->personalizacion->laptop->modelo}" : null,
            'encuesta' => $pedido->datosEncuesta($request->fullUrl()),
        ]);
    }

    public function guardar(Request $request, string $codigo)
    {
        $pedido = Pedido::with('encuesta')->where('codigo', $codigo)->firstOrFail();
        // Con la firma del correo o con acceso al pedido; para cualquier otro, el pedido "no existe".
        abort_unless($request->hasValidSignature() || AccesoPedido::puedeVer($request, $pedido), 404);

        if ($pedido->estado !== 'entregado') {
            return back()->withErrors(['encuesta' => 'La encuesta se responde cuando el pedido ya fue entregado.']);
        }
        if ($pedido->encuesta) {
            return back()->withErrors(['encuesta' => 'Ya respondiste la encuesta de este pedido. ¡Gracias!']);
        }

        $datos = $request->validate([
            'satisfaccion' => ['required', 'integer', 'between:1,5'],
            'volveria_elegirla' => ['required', Rule::in(array_keys(EncuestaSatisfaccion::VOLVERIA))],
            'aspectos' => ['nullable', 'array'],
            'aspectos.*' => ['string', 'distinct', Rule::in(array_keys(EncuestaSatisfaccion::ASPECTOS))],
            'comentario' => ['nullable', 'string', 'max:500'],
        ], [
            'satisfaccion.required' => 'Elige de 1 a 5 estrellas.',
            'satisfaccion.between' => 'Elige de 1 a 5 estrellas.',
            'volveria_elegirla.required' => 'Cuéntanos si la volverías a elegir.',
            'volveria_elegirla.in' => 'Cuéntanos si la volverías a elegir.',
        ]);

        // El índice único de pedido_id evita una segunda respuesta si se envía dos veces a la vez.
        EncuestaSatisfaccion::firstOrCreate(['pedido_id' => $pedido->id], [
            ...$datos,
            'aspectos' => array_values($datos['aspectos'] ?? []) ?: null,
            'comentario' => trim((string) ($datos['comentario'] ?? '')) ?: null,
        ]);

        return back();
    }
}
