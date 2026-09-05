<?php

namespace App\Services\Recommender;

use Illuminate\Support\Facades\Process;

class CliRecommenderClient implements RecommenderClient
{
    public function recomendar(array $payload): array
    {
        $resultado = Process::timeout((int) config('recommender.timeout'))
            ->input(json_encode($payload))
            ->run(config('recommender.cli'));

        if ($resultado->failed()) {
            throw new RecommenderException('El motor de recomendación (subproceso) terminó con error: '.$resultado->errorOutput());
        }

        $respuesta = json_decode($resultado->output(), true);

        if (! is_array($respuesta)) {
            throw new RecommenderException('El motor de recomendación no devolvió un JSON válido.');
        }

        return $respuesta;
    }
}
