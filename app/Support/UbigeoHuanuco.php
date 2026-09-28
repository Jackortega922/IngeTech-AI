<?php

namespace App\Support;

/**
 * Provincias y distritos de Huánuco con su código UBIGEO oficial (INEI), leídos de
 * resources/data/ubigeo-huanuco.json. El mismo archivo alimenta los desplegables del checkout,
 * así que la pantalla y la validación del servidor no pueden quedar desalineadas.
 *
 * Por ahora solo Huánuco tiene la lista completa (prueba del proyecto); el resto de
 * departamentos usa un campo de texto libre.
 */
class UbigeoHuanuco
{
    public const DEPARTAMENTO = 'Huánuco';

    private static ?array $datos = null;

    public static function datos(): array
    {
        return self::$datos ??= json_decode(file_get_contents(resource_path('data/ubigeo-huanuco.json')), true);
    }

    /** @return array<int, array{ubigeo: string, nombre: string, distritos: array<int, array{ubigeo: string, nombre: string}>}> */
    public static function provincias(): array
    {
        return self::datos()['provincias'];
    }

    /** Código UBIGEO del distrito si pertenece a esa provincia; null si la combinación no existe. */
    public static function ubigeo(string $provincia, string $distrito): ?string
    {
        foreach (self::provincias() as $p) {
            if ($p['nombre'] === $provincia) {
                foreach ($p['distritos'] as $d) {
                    if ($d['nombre'] === $distrito) {
                        return $d['ubigeo'];
                    }
                }
            }
        }

        return null;
    }
}
