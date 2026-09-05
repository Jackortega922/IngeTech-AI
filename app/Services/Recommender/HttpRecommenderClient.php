<?php

namespace App\Services\Recommender;

use Illuminate\Support\Facades\Http;
use Throwable;

class HttpRecommenderClient implements RecommenderClient
{
    public function recomendar(array $payload): array
    {
        try {
            $respuesta = Http::timeout((int) config('recommender.timeout'))
                ->post(rtrim(config('recommender.url'), '/').'/recomendar', $payload);
        } catch (Throwable $e) {
            throw new RecommenderException('No se pudo contactar al motor de recomendación.', previous: $e);
        }

        if ($respuesta->failed()) {
            throw new RecommenderException("El motor de recomendación respondió con error {$respuesta->status()}.");
        }

        return $respuesta->json();
    }
}
