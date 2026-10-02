<?php

namespace App\Support;

/**
 * Desglose del IGV de un monto que ya lo incluye (los precios de la tienda son con IGV).
 *
 * base = total / (1 + igv)  ·  igv = total - base
 *
 * Se redondea la base y el IGV sale por diferencia, para que base + IGV dé exactamente el total
 * (si se redondearan los dos por separado, podría sobrar o faltar un céntimo).
 */
class Igv
{
    /** @return array{base: float, igv: float, total: float} */
    public static function desglosar(float $total): array
    {
        $tasa = (float) config('tienda.igv');
        $base = round($total / (1 + $tasa), 2);

        return ['base' => $base, 'igv' => round($total - $base, 2), 'total' => round($total, 2)];
    }
}
