<?php

namespace Tests\Feature;

use App\Services\Recommender\CliRecommenderClient;
use Tests\TestCase;

class MotorCliTest extends TestCase
{
    /**
     * En producción el motor corre como subproceso (RECOMMENDER_MODE=cli) con una ruta
     * relativa: "python ml-engine/cli_entry.py". Pero `php artisan serve` sitúa el directorio
     * de trabajo del proceso PHP en public/, así que el subproceso heredaba ese directorio y
     * buscaba el motor en public/ml-engine/ — que no existe. Fallaba solo en producción,
     * porque en local se usa el modo HTTP.
     */
    public function test_el_subproceso_corre_desde_la_raiz_del_proyecto()
    {
        $directorioOriginal = getcwd();
        chdir(public_path());

        try {
            // Sonda: resuelve la misma ruta relativa que usa RECOMMENDER_CLI y responde en
            // JSON, que es lo que el cliente espera del motor.
            config(['recommender.cli' => 'php -r "echo json_encode([\'existe\' => file_exists(\'ml-engine/cli_entry.py\')]);"']);

            $respuesta = (new CliRecommenderClient)->recomendar(['perfil' => []]);

            $this->assertTrue(
                $respuesta['existe'],
                'El subproceso no encontró ml-engine/cli_entry.py: se está ejecutando desde el directorio equivocado.'
            );
        } finally {
            chdir($directorioOriginal);
        }
    }
}
