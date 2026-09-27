<?php

namespace Tests\Feature;

use App\Services\Recommender\CliRecommenderClient;
use App\Services\Recommender\RecommenderException;
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

    /**
     * Si el motor tarda más de la cuenta, Process lanza su propia excepción de timeout, que
     * no es una RecommenderException — sin traducirla, la API devuelve un 500 genérico en vez
     * del error del contrato que el frontend sabe mostrar.
     */
    public function test_un_timeout_del_motor_se_traduce_a_un_error_del_contrato()
    {
        config([
            'recommender.timeout' => 1,
            'recommender.cli' => 'php -r "sleep(5);"',
        ]);

        $this->expectException(RecommenderException::class);
        $this->expectExceptionMessage('tardó demasiado');

        (new CliRecommenderClient)->recomendar(['perfil' => []]);
    }
}
