<?php

namespace Database\Seeders;

use App\Models\Actividad;
use Illuminate\Database\Seeder;

class ActividadSeeder extends Seeder
{
    public function run(): void
    {
        $actividades = [
            ['clave' => 'programacion_web', 'nombre' => 'Desarrollo web', 'extra_ram_gb' => 2, 'extra_cpu_score' => 10, 'requiere_gpu' => false],
            ['clave' => 'maquinas_virtuales', 'nombre' => 'Máquinas virtuales', 'extra_ram_gb' => 8, 'extra_cpu_score' => 15, 'requiere_gpu' => false],
            ['clave' => 'ia_ml', 'nombre' => 'IA / Machine Learning', 'extra_ram_gb' => 8, 'extra_cpu_score' => 20, 'requiere_gpu' => true],
            ['clave' => 'diseno_3d', 'nombre' => 'Diseño gráfico y 3D', 'extra_ram_gb' => 8, 'extra_cpu_score' => 20, 'requiere_gpu' => true],
            ['clave' => 'edicion_video', 'nombre' => 'Edición de video', 'extra_ram_gb' => 8, 'extra_cpu_score' => 25, 'requiere_gpu' => true],
            ['clave' => 'videojuegos', 'nombre' => 'Videojuegos', 'extra_ram_gb' => 4, 'extra_cpu_score' => 20, 'requiere_gpu' => true],
            ['clave' => 'analisis_datos', 'nombre' => 'Análisis de datos', 'extra_ram_gb' => 8, 'extra_cpu_score' => 15, 'requiere_gpu' => false],
            ['clave' => 'redes_ciberseguridad', 'nombre' => 'Redes y ciberseguridad', 'extra_ram_gb' => 4, 'extra_cpu_score' => 10, 'requiere_gpu' => false],
            ['clave' => 'cad_extra', 'nombre' => 'Proyectos extra de diseño/CAD', 'extra_ram_gb' => 8, 'extra_cpu_score' => 20, 'requiere_gpu' => true],
            ['clave' => 'streaming_multitarea', 'nombre' => 'Streaming / muchas apps a la vez', 'extra_ram_gb' => 4, 'extra_cpu_score' => 10, 'requiere_gpu' => false],
        ];

        foreach ($actividades as $actividad) {
            Actividad::updateOrCreate(['clave' => $actividad['clave']], $actividad);
        }
    }
}
