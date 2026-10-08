<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\User;
use Database\Seeders\AdministradorSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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

    public function test_en_local_admin_password_fija_la_contrasena_del_administrador()
    {
        config(['app.admin' => ['name' => 'Jack', 'email' => 'jack@correo.test', 'password' => 'clave-local-123']]);

        $this->seed(AdministradorSeeder::class);
        $this->assertTrue(Hash::check('clave-local-123', User::first()->password));

        // Cambiarla en el .env y volver a correr el seeder la actualiza.
        config(['app.admin.password' => 'otra-clave-456']);
        $this->seed(AdministradorSeeder::class);
        $this->assertTrue(Hash::check('otra-clave-456', User::first()->password));
        $this->assertSame(1, User::count());
    }

    public function test_en_produccion_admin_password_se_ignora()
    {
        config(['app.admin' => ['name' => 'Jack', 'email' => 'jack@correo.test', 'password' => '12345678']]);
        $this->app['env'] = 'production';

        // Directo, sin `db:seed`: en producción ese comando pide confirmación.
        (new AdministradorSeeder)->run();

        $this->assertFalse(Hash::check('12345678', User::first()->password));
    }

    public function test_sin_correo_de_administrador_no_crea_ninguna_cuenta()
    {
        config(['app.admin' => ['name' => 'x', 'email' => null]]);

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(0, User::count());
    }
}
