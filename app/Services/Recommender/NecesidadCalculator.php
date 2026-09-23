<?php

namespace App\Services\Recommender;

use App\Models\Actividad;
use App\Models\Software;
use Illuminate\Support\Collection;

/**
 * Deriva los requisitos mínimos de hardware (RAM, CPU, GPU) a partir del
 * software típico de una carrera más las actividades extra que marcó el
 * alumno, ajustados por su nivel de experiencia. Es independiente del motor
 * de recomendación usado (real o mock) — ambos lo usan para calcular el
 * bloque informativo `necesidad` que se muestra en el frontend.
 */
class NecesidadCalculator
{
    /**
     * @param  Collection<int, Software>  $software
     * @param  Collection<int, Actividad>  $actividades
     * @return array{ram_gb:int, cpu_score:int, gpu_dedicada:bool, nivel:string}
     */
    public static function calcular(Collection $software, Collection $actividades, string $nivelExperiencia): array
    {
        $ram = 4;
        $cpu = 15;
        $gpu = false;

        foreach ($software as $sw) {
            $ram = max($ram, $sw->min_ram_gb);
            $cpu = max($cpu, $sw->min_cpu_score);
            $gpu = $gpu || $sw->min_gpu_dedicada;
        }

        foreach ($actividades as $act) {
            $ram += $act->extra_ram_gb;
            $cpu += $act->extra_cpu_score;
            $gpu = $gpu || $act->requiere_gpu;
        }

        $multiplicador = match ($nivelExperiencia) {
            'avanzado' => 1.25,
            'intermedio' => 1.1,
            default => 1.0,
        };

        return [
            'ram_gb' => (int) min(64, $ram),
            'cpu_score' => (int) min(100, round($cpu * $multiplicador)),
            'gpu_dedicada' => $gpu,
            'nivel' => $nivelExperiencia,
        ];
    }
}
