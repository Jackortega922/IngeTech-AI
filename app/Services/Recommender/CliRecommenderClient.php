<?php

namespace App\Services\Recommender;

use Illuminate\Support\Facades\Process;

class CliRecommenderClient implements RecommenderClient
{
    public function recomendar(array $payload): array
    {
        // El directorio de trabajo se fija a la raíz del proyecto porque RECOMMENDER_CLI usa
        // una ruta relativa ("python ml-engine/cli_entry.py"). Sin esto, el subproceso hereda
        // el directorio del proceso PHP, que con `artisan serve` es public/ — y el motor no
        // se encuentra (falla solo en producción, donde se usa este modo).
        $resultado = Process::path(base_path())
            ->timeout((int) config('recommender.timeout'))
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
