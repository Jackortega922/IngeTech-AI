<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdministradorSeeder::class,
            CarreraSeeder::class,
            SoftwareSeeder::class,
            ActividadSeeder::class,
            LaptopSeeder::class,
            AccesorioKitSeeder::class,
        ]);
    }
}
