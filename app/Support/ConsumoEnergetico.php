<?php

namespace App\Support;

use App\Models\Laptop;

/**
 * Consumo eléctrico de un equipo (Ingeniería Ambiental + Contabilidad): cuánta energía gasta al año
 * y, si hay tarifa configurada, cuánto cuesta en el recibo de luz.
 *
 * Se usa la potencia PROMEDIO en uso mixto (navegar, ofimática, clases, algo de multimedia), no el
 * TDP: el TDP es el máximo que disipa el procesador a plena carga, y una laptop pasa la mayor parte
 * del tiempo muy por debajo. Si el admin carga el dato del fabricante o medido (`consumo_w`), se usa
 * ese; si no, una estimación por tipo de procesador, rotulada como tal.
 */
class ConsumoEnergetico
{
    /**
     * Potencia promedio estimada en uso mixto, en vatios. Criterio (de menor a mayor consumo):
     * - Apple M: chips de bajo consumo con GPU integrada.
     * - Sufijo U (Intel/AMD): procesadores de bajo consumo para ultraportátiles.
     * - Sufijo H, HS o HX: procesadores de alto rendimiento.
     * - Gráfica dedicada: suma lo que gasta encendida aunque no se juegue.
     * - Computadora de escritorio: fuente y componentes de escritorio.
     */
    public static function estimarW(Laptop $l): int
    {
        $cpu = strtoupper((string) $l->cpu);

        $base = match (true) {
            $l->tipo === 'escritorio' => 60,
            str_contains($cpu, 'APPLE M') => 12,
            (bool) preg_match('/\d{3,5}H[SX]?\b/', $cpu) => 35,
            (bool) preg_match('/\d{3,5}U\b/', $cpu) => 18,
            default => 25,
        };

        return $base + ($l->gpu_dedicada ? 20 : 0);
    }

    /**
     * @return array{watts: int, estimado: bool, kwh_anio: float, soles_anio: float|null}
     */
    public static function de(Laptop $l): array
    {
        $cfg = config('tienda.energia');
        $watts = $l->consumo_w ?: self::estimarW($l);
        $kwh = round($watts * $cfg['horas_por_dia'] * $cfg['dias_por_anio'] / 1000, 1);
        $tarifa = $cfg['tarifa_soles_kwh'] !== null ? (float) $cfg['tarifa_soles_kwh'] : null;

        return [
            'watts' => (int) $watts,
            'estimado' => ! $l->consumo_w,
            'kwh_anio' => $kwh,
            'soles_anio' => $tarifa === null ? null : round($kwh * $tarifa, 2),
        ];
    }
}
