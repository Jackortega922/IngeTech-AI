<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register()
    {
        $response = $this->post('/register', [
            'nombres' => 'Rosa María',
            'apellidos' => 'Quispe Huamán',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('bienvenida', absolute: false));

        // Se guardan por separado y el nombre completo (panel, correos, boleta) se arma solo.
        $user = User::firstWhere('email', 'test@example.com');
        $this->assertSame('Rosa María', $user->nombres);
        $this->assertSame('Quispe Huamán', $user->apellidos);
        $this->assertSame('Rosa María Quispe Huamán', $user->name);
    }

    public function test_el_registro_pide_nombres_y_apellidos()
    {
        $this->post('/register', [
            'nombres' => 'Rosa',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors(['apellidos' => 'Falta el apellido.']);

        $this->assertGuest();
    }
}
