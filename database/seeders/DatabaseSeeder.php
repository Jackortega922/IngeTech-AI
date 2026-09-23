<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Cuenta de administrador: ve y edita catálogos, carreras y métricas.
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@ingetech.test',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        // Cuenta de estudiante normal: solo ve el flujo de recomendación,
        // catálogos y comparador — sin acceso a /admin.
        User::factory()->create([
            'name' => 'Estudiante Demo',
            'email' => 'estudiante@ingetech.test',
            'password' => bcrypt('password'),
            'is_admin' => false,
        ]);

        $this->call([
            CarreraSeeder::class,
            SoftwareSeeder::class,
            ActividadSeeder::class,
            LaptopSeeder::class,
            AccesorioKitSeeder::class,
        ]);
    }
}
