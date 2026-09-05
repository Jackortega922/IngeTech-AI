<?php

namespace Database\Factories;

use App\Models\PerfilUsuario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PerfilUsuario>
 */
class PerfilUsuarioFactory extends Factory
{
    protected $model = PerfilUsuario::class;

    public function definition(): array
    {
        return [
            'carrera' => fake()->randomElement(['Ingeniería de Sistemas', 'Ingeniería Industrial', 'Mecatrónica']),
            'nivel_experiencia' => fake()->randomElement(['basico', 'intermedio', 'avanzado']),
            'actividades' => fake()->randomElements(
                ['programacion_web', 'maquinas_virtuales', 'ia_ml', 'diseno_3d'],
                fake()->numberBetween(1, 3)
            ),
            'software' => fake()->randomElements(['vscode', 'docker', 'photoshop', 'blender'], fake()->numberBetween(1, 3)),
            'presupuesto_soles' => fake()->randomFloat(2, 1500, 6000),
        ];
    }
}
