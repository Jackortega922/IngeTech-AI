<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_crea_un_solo_administrador_con_el_correo_del_env_y_ninguna_cuenta_de_prueba()
    {
        config(['app.admin' => ['name' => 'Jack Ortega', 'email' => 'jack@correo.test']]);

        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class); // volver a sembrar no duplica

        $this->assertSame(1, User::count());
        $admin = User::first();
        $this->assertSame('jack@correo.test', $admin->email);
        $this->assertSame('admin', $admin->rol);
        $this->assertNotNull($admin->email_verified_at);
        $this->assertSame(0, User::where('email', 'like', '%@ingetech.test')->count());
        $this->assertGreaterThan(0, Laptop::count());
    }

    public function test_sin_correo_de_administrador_no_crea_ninguna_cuenta()
    {
        config(['app.admin' => ['name' => 'x', 'email' => null]]);

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(0, User::count());
    }
}
