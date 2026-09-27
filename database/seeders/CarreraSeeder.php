<?php

namespace Database\Seeders;

use App\Models\Carrera;
use Illuminate\Database\Seeder;

class CarreraSeeder extends Seeder
{
    public function run(): void
    {
        $carreras = [
            ['clave' => 'ing_sistemas', 'nombre' => 'Ingeniería de Sistemas', 'facultad' => 'Ingeniería'],
            ['clave' => 'ing_civil', 'nombre' => 'Ingeniería Civil', 'facultad' => 'Ingeniería'],
            ['clave' => 'medicina', 'nombre' => 'Medicina Humana', 'facultad' => 'Ciencias de la Salud'],
            ['clave' => 'educacion', 'nombre' => 'Educación', 'facultad' => 'Ciencias de la Educación'],
            ['clave' => 'administracion', 'nombre' => 'Administración', 'facultad' => 'Ciencias Empresariales'],
            ['clave' => 'ing_ambiental', 'nombre' => 'Ingeniería Ambiental', 'facultad' => 'Ingeniería'],
            ['clave' => 'enfermeria', 'nombre' => 'Enfermería', 'facultad' => 'Ciencias de la Salud'],
            ['clave' => 'ing_minas', 'nombre' => 'Ingeniería de Minas', 'facultad' => 'Ingeniería'],
            ['clave' => 'contabilidad', 'nombre' => 'Contabilidad', 'facultad' => 'Ciencias Empresariales'],
            ['clave' => 'derecho', 'nombre' => 'Derecho y Ciencias Políticas', 'facultad' => 'Derecho'],
            ['clave' => 'psicologia', 'nombre' => 'Psicología', 'facultad' => 'Ciencias de la Salud'],
            ['clave' => 'arquitectura', 'nombre' => 'Arquitectura', 'facultad' => 'Ingeniería'],
            ['clave' => 'zootecnia', 'nombre' => 'Zootecnia', 'facultad' => 'Ciencias Agrarias'],
            ['clave' => 'agronomia', 'nombre' => 'Agronomía', 'facultad' => 'Ciencias Agrarias'],
            ['clave' => 'turismo', 'nombre' => 'Turismo y Hotelería', 'facultad' => 'Ciencias Empresariales'],
            ['clave' => 'comunicacion', 'nombre' => 'Ciencias de la Comunicación', 'facultad' => 'Ciencias de la Educación'],

            // Ocupaciones no académicas: la tienda le vende a cualquier persona, no solo a
            // estudiantes. Mismo mecanismo (carrera -> software típico -> requisitos de
            // hardware), solo que agrupadas bajo "Público General" en vez de una facultad.
            ['clave' => 'oficina_general', 'nombre' => 'Trabajo de Oficina / Administrativo', 'facultad' => 'Público General'],
            ['clave' => 'independiente', 'nombre' => 'Independiente / Freelance', 'facultad' => 'Público General'],
            ['clave' => 'emprendimiento', 'nombre' => 'Emprendimiento / Negocio Propio', 'facultad' => 'Público General'],
            ['clave' => 'gaming_streaming', 'nombre' => 'Gaming y Streaming', 'facultad' => 'Público General'],
            ['clave' => 'uso_personal', 'nombre' => 'Uso Personal / Hogar', 'facultad' => 'Público General'],
        ];

        foreach ($carreras as $carrera) {
            Carrera::updateOrCreate(['clave' => $carrera['clave']], $carrera);
        }
    }
}
