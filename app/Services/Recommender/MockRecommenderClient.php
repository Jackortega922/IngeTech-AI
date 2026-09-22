<?php

namespace App\Services\Recommender;

use App\Models\Actividad;
use App\Models\Laptop;
use App\Models\Software;

/**
 * Motor de recomendación local, en PHP puro, que respeta el mismo contrato
 * que el motor Python real (docs/arquitectura/contrato-motor.md): recibe y
 * devuelve exactamente la forma `v0` (perfil.carrera/software/actividades →
 * recomendaciones[] con compatibilidad_pct/explicacion).
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
        $topN = $payload['opciones']['top_n'] ?? 3;

        $software = Software::whereIn('clave', $perfil['software'] ?? [])->get();
        $actividades = Actividad::whereIn('clave', $perfil['actividades'] ?? [])->get();
        $nivel = $perfil['nivel_experiencia'] ?? 'basico';

        $nec = NecesidadCalculator::calcular($software, $actividades, $nivel);

        $viables = Laptop::query()
            ->where('precio_soles', '<=', $presupuesto)
            ->get()
            ->filter(fn (Laptop $laptop) => $laptop->ram_gb >= $nec['ram_gb']
                && (int) $laptop->rendimiento_score >= $nec['cpu_score']
                && (! $nec['gpu_dedicada'] || $laptop->gpu_dedicada)
            )
            ->values();

        if ($viables->isEmpty()) {
            $requisitos = "necesitas {$nec['ram_gb']} GB RAM, CPU ≥ {$nec['cpu_score']}".
                ($nec['gpu_dedicada'] ? ', GPU dedicada' : '').'.';

            return [
                'version' => 'v0',
                'error' => 'sin_resultados',
                'mensaje' => "Ningún equipo dentro de tu presupuesto cumple los requisitos ({$requisitos})",
            ];
        }

        $recomendaciones = $viables
            ->sortByDesc(fn (Laptop $laptop) => $this->compatibilidad($laptop, $nec))
            ->take($topN)
            ->map(fn (Laptop $laptop) => $this->tarjeta($laptop, $nec, $presupuesto))
            ->values()
            ->all();

        return ['version' => 'v0', 'recomendaciones' => $recomendaciones];
    }

    private function compatibilidad(Laptop $laptop, array $nec): int
    {
        $pctRam = min($laptop->ram_gb / max($nec['ram_gb'], 1), 1.5) / 1.5 * 100;
        $pctCpu = min(((int) $laptop->rendimiento_score) / max($nec['cpu_score'], 1), 1.5) / 1.5 * 100;

        return (int) round(min(100, ($pctRam + $pctCpu) / 2));
    }

    private function tarjeta(Laptop $laptop, array $nec, float $presupuesto): array
    {
        $factores = [
            ['criterio' => "RAM: {$laptop->ram_gb} GB (necesitas {$nec['ram_gb']} GB)", 'aporte' => 0],
        ];
        if ($nec['gpu_dedicada']) {
            $factores[] = [
                'criterio' => $laptop->gpu_dedicada ? 'Tiene GPU dedicada' : 'Sin GPU dedicada',
                'aporte' => 0,
            ];
        }

        return [
            'laptop_id' => $laptop->id,
            'compatibilidad_pct' => $this->compatibilidad($laptop, $nec),
            'precio_soles' => (float) $laptop->precio_soles,
            'sobrante_soles' => round($presupuesto - (float) $laptop->precio_soles, 2),
            'explicacion' => ['factores' => $factores, 'advertencias' => []],
        ];
    }
}
