<?php

namespace App\Services\Recommender;

use Illuminate\Support\Facades\Http;
use Throwable;

class HttpRecommenderClient implements AfinidadLaptops, RecommenderClient, SegmentadorClientes
{
    public function recomendar(array $payload): array
    {
        return $this->post('/recomendar', $payload);
    }

    public function segmentar(array $clientes): array
    {
        return $this->post('/segmentar', ['clientes' => $clientes]);
    }

    public function afinidad(array $preferencias, array $laptopIds): array
    {
        return $this->post('/afinidad', ['preferencias' => $preferencias, 'laptop_ids' => $laptopIds]);
    }

    private function post(string $ruta, array $payload): array
    {
        try {
            $respuesta = Http::timeout((int) config('recommender.timeout'))
                ->post(rtrim(config('recommender.url'), '/').$ruta, $payload);
        } catch (Throwable $e) {
            throw new RecommenderException('No se pudo contactar al motor de recomendación.', previous: $e);
        }

        if ($respuesta->failed()) {
            throw new RecommenderException("El motor de recomendación respondió con error {$respuesta->status()}.");
        }

        return $respuesta->json();
    }
}
