<?php

namespace App\Services\Recommender;

use Illuminate\Process\Exceptions\ProcessTimedOutException;
use Illuminate\Support\Facades\Process;

class CliRecommenderClient implements RecommenderClient
{
    public function recomendar(array $payload): array
    {
        try {
            // El directorio de trabajo se fija a la raíz del proyecto porque RECOMMENDER_CLI usa
            // una ruta relativa ("python ml-engine/cli_entry.py"). Sin esto, el subproceso hereda
            // el directorio del proceso PHP, que con `artisan serve` es public/ — y el motor no
            // se encuentra (falla solo en producción, donde se usa este modo).
            $resultado = Process::path(base_path())
                ->timeout((int) config('recommender.timeout'))
                ->input(json_encode($payload))
                ->run(config('recommender.cli'));
        } catch (ProcessTimedOutException $e) {
            // Sin este catch la excepción sube sin capturar y la API devuelve un 500 genérico,
            // en vez del error JSON del contrato que el frontend sabe mostrar.
            throw new RecommenderException(
                'El motor de recomendación tardó demasiado en responder.',
                previous: $e
            );
        }

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
