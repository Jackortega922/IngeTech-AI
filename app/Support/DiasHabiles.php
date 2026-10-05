<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Días hábiles en el Perú: de lunes a viernes, sin feriados nacionales. Se usa para el plazo de
 * respuesta del Libro de Reclamaciones (config/derecho.php).
 */
class DiasHabiles
{
    public static function esHabil(CarbonInterface $dia): bool
    {
        if ($dia->isWeekend()) {
            return false;
        }

        if (in_array($dia->format('m-d'), config('derecho.feriados', []), true)) {
            return false;
        }

        // Jueves y Viernes Santo: 3 y 2 días antes del Domingo de Resurrección.
        $pascua = self::domingoDeResurreccion($dia->year);

        return ! $dia->isSameDay($pascua->subDays(3)) && ! $dia->isSameDay($pascua->subDays(2));
    }

    /** Fecha a la que se llega contando $dias hábiles después de $desde (sin contar $desde). */
    public static function sumar(CarbonInterface $desde, int $dias): CarbonImmutable
    {
        $dia = CarbonImmutable::instance($desde)->startOfDay();
        while ($dias > 0) {
            $dia = $dia->addDay();
            if (self::esHabil($dia)) {
                $dias--;
            }
        }

        return $dia;
    }

    /** Días hábiles que faltan desde hoy hasta $limite (negativo si ya venció). */
    public static function restantes(CarbonInterface $limite, ?CarbonInterface $hoy = null): int
    {
        $hoy = CarbonImmutable::instance($hoy ?? now())->startOfDay();
        $limite = CarbonImmutable::instance($limite)->startOfDay();
        $signo = $limite->greaterThanOrEqualTo($hoy) ? 1 : -1;
        [$desde, $hasta] = $signo === 1 ? [$hoy, $limite] : [$limite, $hoy];

        $cuenta = 0;
        for ($dia = $desde->addDay(); $dia->lessThanOrEqualTo($hasta); $dia = $dia->addDay()) {
            if (self::esHabil($dia)) {
                $cuenta++;
            }
        }

        return $signo * $cuenta;
    }

    /**
     * Domingo de Resurrección (calendario gregoriano, algoritmo de Meeus/Jones/Butcher). Se
     * calcula aquí en vez de usar easter_date() porque esa función necesita la extensión
     * "calendar" de PHP, que no siempre está instalada.
     */
    public static function domingoDeResurreccion(int $anio): CarbonImmutable
    {
        $a = $anio % 19;
        $b = intdiv($anio, 100);
        $c = $anio % 100;
        $d = intdiv($b, 4);
        $e = $b % 4;
        $f = intdiv($b + 8, 25);
        $g = intdiv($b - $f + 1, 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = intdiv($c, 4);
        $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = intdiv($a + 11 * $h + 22 * $l, 451);
        $mes = intdiv($h + $l - 7 * $m + 114, 31);
        $dia = (($h + $l - 7 * $m + 114) % 31) + 1;

        return CarbonImmutable::create($anio, $mes, $dia);
    }
}
