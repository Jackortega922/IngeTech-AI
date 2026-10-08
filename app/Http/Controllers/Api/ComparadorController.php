<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Recommender\AfinidadLaptops;
use App\Services\Recommender\RecommenderException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * "Para ti" en el comparador: si la persona respondió el cuestionario de bienvenida, el motor
 * ordena las laptops que está comparando según sus respuestas. Sin cuestionario (o sin sesión, o
 * si el motor no responde) devuelve `disponible: false` y el comparador se ve como siempre.
 */
class ComparadorController extends Controller
{
    public function afinidad(Request $request, AfinidadLaptops $motor): JsonResponse
    {
        $datos = $request->validate([
            'laptop_ids' => ['required', 'array', 'min:2', 'max:3'],
            'laptop_ids.*' => ['integer', 'distinct', 'exists:laptops,id'],
        ]);

        $preferencias = $request->user()?->preferencias?->paraMotor() ?? [];
        if (! $preferencias) {
            return response()->json(['disponible' => false]);
        }

        try {
            $respuesta = $motor->afinidad($preferencias, $datos['laptop_ids']);
        } catch (RecommenderException) {
            return response()->json(['disponible' => false]);
        }

        if (isset($respuesta['error'])) {
            return response()->json(['disponible' => false]);
        }

        return response()->json(['disponible' => true, 'afinidades' => $respuesta['afinidades'] ?? []]);
    }
}
