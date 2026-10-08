<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Un solo administrador, con un correo real tomado del .env (ADMIN_NAME, ADMIN_EMAIL). El resto
 * del personal se registra en el sitio y el admin le asigna su rol en la pestaña Usuarios.
 *
 * Contraseña:
 * - Por defecto se genera una al azar y el administrador pone la suya con "¿Olvidaste tu
 *   contraseña?", que le llega a su correo. Así ninguna contraseña vive en el repositorio.
 * - Solo fuera de producción, ADMIN_PASSWORD en el .env (que nunca se sube a GitHub) la fija, para
 *   probar en local sin depender del correo. Volver a correr este seeder la actualiza.
 *
 * Se corre solo con: php artisan db:seed --class=AdministradorSeeder
 */
class AdministradorSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) config('app.admin.email'));

        if ($email === '') {
            $this->command?->warn('Sin ADMIN_EMAIL en el .env no se crea el administrador. Agrégalo y vuelve a ejecutar: php artisan db:seed');

            return;
        }

        $password = (string) config('app.admin.password');
        if ($password !== '' && app()->isProduction()) {
            // En producción la contraseña se pone por correo, nunca desde una variable.
            $this->command?->warn('ADMIN_PASSWORD se ignora en producción: usa «¿Olvidaste tu contraseña?».');
            $password = '';
        }

        $admin = User::firstOrNew(['email' => $email]);
        if ($password !== '') {
            $admin->password = $password; // el cast 'hashed' del modelo la cifra
        } elseif (! $admin->exists) {
            $admin->password = Str::password(32);
        }
        $admin->forceFill([
            'name' => config('app.admin.name'),
            'rol' => 'admin',
            // Es la cuenta de quien instala el sistema: su correo se da por confirmado.
            'email_verified_at' => $admin->email_verified_at ?? now(),
        ])->save();

        $this->command?->info($password !== ''
            ? "Administrador: {$email}, con la contraseña de ADMIN_PASSWORD."
            : "Administrador: {$email}. Para poner tu contraseña, usa «¿Olvidaste tu contraseña?» en /login.");
    }
}
