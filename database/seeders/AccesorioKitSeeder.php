<?php

namespace Database\Seeders;

use App\Models\Accesorio;
use App\Models\Kit;
use Illuminate\Database\Seeder;

/**
 * Datos de ejemplo para probar la pantalla de Personalización.
 * Reemplazar por el catálogo real del Módulo C cuando esté listo.
 */
class AccesorioKitSeeder extends Seeder
{
    public function run(): void
    {
        $accesorios = [
            ['nombre' => 'Mochila para laptop 15.6"', 'tipo' => 'mochila', 'precio_soles' => 89],
            ['nombre' => 'Mouse inalámbrico', 'tipo' => 'mouse', 'precio_soles' => 45],
            ['nombre' => 'Base refrigerante (cooler)', 'tipo' => 'cooler', 'precio_soles' => 65],
            ['nombre' => 'Hub USB-C 6 en 1', 'tipo' => 'hub', 'precio_soles' => 79],
            ['nombre' => 'Funda protectora', 'tipo' => 'funda', 'precio_soles' => 39],
            ['nombre' => 'Licencia antivirus (1 año)', 'tipo' => 'software', 'precio_soles' => 59],
        ];

        $modelos = [];
        foreach ($accesorios as $accesorio) {
            $modelos[$accesorio['nombre']] = Accesorio::updateOrCreate(
                ['nombre' => $accesorio['nombre']],
                $accesorio
            );
        }

        $kitEstudiante = Kit::updateOrCreate(
            ['nombre' => 'Kit Estudiante'],
            ['nombre' => 'Kit Estudiante', 'precio_soles' => 149]
        );
        $kitEstudiante->accesorios()->sync([
            $modelos['Mochila para laptop 15.6"']->id,
            $modelos['Mouse inalámbrico']->id,
        ]);

        $kitPro = Kit::updateOrCreate(
            ['nombre' => 'Kit Productividad Pro'],
            ['nombre' => 'Kit Productividad Pro', 'precio_soles' => 219]
        );
        $kitPro->accesorios()->sync([
            $modelos['Mochila para laptop 15.6"']->id,
            $modelos['Hub USB-C 6 en 1']->id,
            $modelos['Base refrigerante (cooler)']->id,
        ]);
    }
}
