<?php

namespace Database\Factories;

use App\Models\Laptop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Laptop>
 */
class LaptopFactory extends Factory
{
    protected $model = Laptop::class;

    public function definition(): array
    {
        return [
            'marca' => fake()->randomElement(['Lenovo', 'HP', 'Dell', 'Asus', 'Acer']),
            'modelo' => fake()->bothify('?????-####'),
            'cpu' => fake()->randomElement(['Ryzen 5', 'Ryzen 7', 'Core i5', 'Core i7']),
            'ram_gb' => fake()->randomElement([8, 16, 32]),
            'ram_ampliable_gb' => fake()->randomElement([16, 32, 64]),
            'almacenamiento_gb' => fake()->randomElement([256, 512, 1024]),
            'gpu' => fake()->randomElement(['integrada', 'RTX 3050', 'RTX 4060', null]),
            'precio_soles' => fake()->randomFloat(2, 1800, 8000),
            'rendimiento_score' => fake()->numberBetween(40, 95),
        ];
    }
}
