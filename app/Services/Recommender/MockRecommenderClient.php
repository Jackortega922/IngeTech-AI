<?php

namespace App\Services\Recommender;

use App\Models\Actividad;
use App\Models\Carrera;
use App\Models\Laptop;
use Illuminate\Support\Collection;

/**
 * Motor de recomendación local, en PHP puro.
 *
 * Implementa el algoritmo descrito en los módulos 2-5 del proyecto:
 *  1. Deriva los requisitos de hardware a partir del software típico de la
 *     carrera del alumno (requisitos mínimos).
 *  2. Filtra el catálogo por presupuesto, portabilidad y esos requisitos.
 *  3. Clasifica los equipos viables en "Mejor Opción Económica",
 *     "Opción Equilibrada" y "Mejor Rendimiento".
 *
 * Sirve para desarrollar y probar el flujo completo sin depender de que el
 * servicio Python (ml-engine) esté corriendo. Actívalo con
 * RECOMMENDER_MODE=mock en el .env.
 */
class MockRecommenderClient implements RecommenderClient
{
    public function recomendar(array $payload): array
    {
        $perfil = $payload['perfil'] ?? [];
        $presupuesto = (float) ($perfil['presupuesto_soles'] ?? 0);

        $portabilidad = $perfil['portabilidad'] ?? 'cualquiera';

        $carrera = Carrera::with('software')->where('clave', $perfil['carrera_clave'] ?? null)->first();
        if (! $carrera) {
            return ['version' => 'v1', 'error' => 'perfil_invalido', 'mensaje' => 'Carrera no reconocida.'];
        }

        $actividades = Actividad::whereIn('clave', $perfil['actividades'] ?? [])->get();
        $nivelExperiencia = $perfil['nivel_experiencia'] ?? 'basico';

        $nec = $this->calcularNecesidad($carrera, $actividades, $nivelExperiencia);

        $candidatos = Laptop::query()->where('precio_soles', '<=', $presupuesto);
        if ($portabilidad !== 'cualquiera') {
            $candidatos->where('tipo', $portabilidad);
        }
        $candidatos = $candidatos->get();

        $viables = $candidatos->filter(fn (Laptop $l) => $l->ram_gb >= $nec['ram_gb']
            && (int) $l->rendimiento_score >= $nec['cpu_score']
            && (! $nec['gpu_dedicada'] || $l->gpu_dedicada)
        )->values();

        if ($viables->isEmpty()) {
            $cercanas = $candidatos->sortByDesc('rendimiento_score')->take(3)->pluck('id')->values();

            return [
                'version' => 'v1',
                'error' => 'sin_resultados',
                'mensaje' => "Ningún equipo dentro de tu presupuesto cumple los requisitos (necesitas {$nec['ram_gb']} GB RAM, CPU ≥ {$nec['cpu_score']}".($nec['gpu_dedicada'] ? ', GPU dedicada' : '').'). Sube el presupuesto o cambia la portabilidad.',
                'necesidad' => $nec,
                'cercanas' => $cercanas->all(),
            ];
        }

        $economica = $viables->sortBy('precio_soles')->first();
        $rendimiento = $viables->sortByDesc(fn (Laptop $l) => [(int) $l->rendimiento_score, $l->ram_gb])->first();
        $equilibrada = $viables->sortByDesc(fn (Laptop $l) => (int) $l->rendimiento_score / max((float) $l->precio_soles, 1))->first();

        $categorias = [
            ['etiqueta' => 'Mejor Opción Económica', 'laptop_id' => $economica->id],
            ['etiqueta' => 'Opción Equilibrada', 'laptop_id' => $equilibrada->id],
            ['etiqueta' => 'Mejor Rendimiento', 'laptop_id' => $rendimiento->id],
        ];

        // Agrupa por laptop_id por si un mismo equipo gana más de una categoría.
        $porLaptop = [];
        foreach ($categorias as $c) {
            $porLaptop[$c['laptop_id']]['laptop_id'] = $c['laptop_id'];
            $porLaptop[$c['laptop_id']]['badges'][] = $c['etiqueta'];
        }

        return [
            'version' => 'v1',
            'necesidad' => $nec,
            'tarjetas' => array_values($porLaptop),
        ];
    }

    /**
     * Combina el software base de la carrera con las actividades extra que
     * marcó el alumno, y ajusta el resultado según su nivel de experiencia
     * (a más experiencia, exige un poco más de margen de potencia).
     *
     * @param  Collection<int, Actividad>  $actividades
     * @return array{ram_gb:int, cpu_score:int, gpu_dedicada:bool, nivel:string}
     */
    private function calcularNecesidad(Carrera $carrera, $actividades, string $nivelExperiencia): array
    {
        $ram = 4;
        $cpu = 15;
        $gpu = false;

        foreach ($carrera->software as $sw) {
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
        $cpu = (int) min(100, round($cpu * $multiplicador));
        $ram = (int) min(64, $ram);

        return ['ram_gb' => $ram, 'cpu_score' => $cpu, 'gpu_dedicada' => $gpu, 'nivel' => $nivelExperiencia];
    }
}
