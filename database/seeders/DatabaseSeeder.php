<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->crearAdministrador();

        $this->call([
            CarreraSeeder::class,
            SoftwareSeeder::class,
            ActividadSeeder::class,
            LaptopSeeder::class,
            AccesorioKitSeeder::class,
        ]);
    }

    /**
     * Un solo administrador, con un correo real tomado del .env (ADMIN_NAME, ADMIN_EMAIL). El
     * resto del personal se registra en el sitio y el admin le asigna su rol en la pestaña
     * Usuarios. Ya no se crean cuentas de prueba con correos @ingetech.test, que no existen.
     *
     * La contraseña no se guarda en el repositorio ni en el .env: se genera una al azar y el
     * administrador pone la suya con "¿Olvidaste tu contraseña?", que le llega a su correo.
     */
    private function crearAdministrador(): void
    {
        $email = trim((string) config('app.admin.email'));

        if ($email === '') {
            $this->command?->warn('Sin ADMIN_EMAIL en el .env no se crea el administrador. Agrégalo y vuelve a ejecutar: php artisan db:seed');

            return;
        }

        $admin = User::firstOrNew(['email' => $email]);
        if (! $admin->exists) {
            $admin->password = Str::password(32);
        }
        $admin->forceFill([
            'name' => config('app.admin.name'),
            'rol' => 'admin',
            // Es la cuenta de quien instala el sistema: su correo se da por confirmado.
            'email_verified_at' => $admin->email_verified_at ?? now(),
        ])->save();

        $this->command?->info("Administrador: {$email}. Para poner tu contraseña, usa «¿Olvidaste tu contraseña?» en /login.");
    }
}
