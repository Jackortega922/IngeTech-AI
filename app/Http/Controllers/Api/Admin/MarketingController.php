<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Marketing\DatosSegmentacion;
use App\Services\Recommender\RecommenderException;
use App\Services\Recommender\SegmentadorClientes;

/**
 * Segmentos de clientes (Marketing): el motor los descubre con K-Means a partir del
 * comportamiento de cada cliente. Al panel solo llegan los grupos (tamaño, cliente promedio y
 * acción sugerida), no la lista de personas.
 */
class MarketingController extends Controller
{
    public function segmentos(DatosSegmentacion $datos, SegmentadorClientes $motor)
    {
        $clientes = $datos->clientes();

        try {
            $respuesta = $motor->segmentar($clientes);
        } catch (RecommenderException $e) {
            return response()->json(['error' => 'motor_no_disponible', 'mensaje' => $e->getMessage()], 503);
        }

        if (isset($respuesta['error'])) {
            return response()->json([...$respuesta, 'clientes_analizados' => count($clientes)]);
        }

        return response()->json([
            'k' => $respuesta['k'],
            'silueta' => $respuesta['silueta'],
            'clientes_analizados' => count($clientes),
            'segmentos' => collect($respuesta['segmentos'])
                ->map(fn ($s) => collect($s)->except('clientes')->all())
                ->all(),
        ]);
    }
}
