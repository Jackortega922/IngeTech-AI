<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecomendarRequest;
use App\Services\Recommender\RecommenderClient;
use App\Services\Recommender\RecommenderException;

class RecomendacionController extends Controller
{
    public function store(RecomendarRequest $request, RecommenderClient $recommender)
    {
        try {
            $respuesta = $recommender->recomendar($request->validated());
        } catch (RecommenderException $e) {
            return response()->json([
                'version' => 'v0',
                'error' => 'error_interno',
                'mensaje' => $e->getMessage(),
            ], 502);
        }

        $status = isset($respuesta['error']) ? 422 : 200;

        return response()->json($respuesta, $status);
    }
}
