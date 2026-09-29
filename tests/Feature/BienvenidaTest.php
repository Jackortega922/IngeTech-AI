<?php

namespace Tests\Feature;

use App\Models\PreferenciaCliente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BienvenidaTest extends TestCase
{
    use RefreshDatabase;

    private function respuestas(array $cambios = []): array
    {
        return array_replace([
            'para_quien' => 'otra_persona',
            'movilidad' => 'diario',
            'lejos_enchufe' => 'muchas_horas',
            'molestias' => ['se_congela', 'bateria_corta'],
            'anios_uso' => '5_mas',
            'nivel_tecnologia' => 'principiante',
            'prioridades' => ['portabilidad', 'precio', 'durabilidad', 'rendimiento', 'diseno'],
            'estilo_decision' => 'la_mejor',
            'marcas_preferidas' => ['Lenovo'],
            'marcas_evitar' => ['Acer'],
            'perifericos' => ['proyector'],
        ], $cambios);
    }

    public function test_al_registrarse_va_primero_al_cuestionario()
    {
        $this->post('/register', [
            'name' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'password' => 'password', 'password_confirmation' => 'password',
        ])->assertRedirect('/bienvenida');
    }

    public function test_muestra_las_10_preguntas()
    {
        $this->actingAs(User::factory()->create())->get('/bienvenida')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('sistemas/bienvenida/index')->has('preguntas', 10));
    }

    public function test_guarda_las_respuestas_y_las_pasa_al_perfil_y_al_resultado()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/bienvenida', $this->respuestas())->assertRedirect('/dashboard');

        $p = PreferenciaCliente::where('user_id', $user->id)->first();
        $this->assertSame(['se_congela', 'bateria_corta'], $p->molestias);
        $this->assertSame('portabilidad', $p->prioridades[0]);
        $this->assertNotNull($p->completado_at);

        $this->actingAs($user)->get('/resultado')
            ->assertInertia(fn (Assert $page) => $page->where('preferencias.estilo_decision', 'la_mejor')->where('preferencias.nivel_tecnologia', 'principiante'));
        $this->actingAs($user)->get('/perfil')
            ->assertInertia(fn (Assert $page) => $page->where('preferencias.para_quien', 'otra_persona'));
    }

    public function test_se_puede_omitir_cualquier_pregunta()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/bienvenida', ['estilo_decision' => 'comparar'])->assertRedirect('/dashboard');

        $this->assertDatabaseHas('preferencias_cliente', ['user_id' => $user->id, 'estilo_decision' => 'comparar', 'movilidad' => null]);
    }

    public function test_rechaza_opciones_que_no_existen()
    {
        $this->actingAs(User::factory()->create())
            ->post('/bienvenida', $this->respuestas(['movilidad' => 'en_la_luna', 'molestias' => ['se_congela', 'inventada']]))
            ->assertSessionHasErrors(['movilidad', 'molestias.1']);
    }

    public function test_omitir_el_cuestionario_y_borrar_las_respuestas()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/bienvenida/omitir')->assertRedirect('/dashboard');
        $this->assertNotNull($user->fresh()->preferencias->omitido_at);

        $this->actingAs($user)->post('/bienvenida', $this->respuestas());
        $this->assertNull($user->fresh()->preferencias->omitido_at);

        $this->actingAs($user)->delete('/bienvenida')->assertRedirect('/dashboard');
        $this->assertDatabaseMissing('preferencias_cliente', ['user_id' => $user->id]);
    }

    public function test_un_invitado_no_accede_al_cuestionario()
    {
        $this->get('/bienvenida')->assertRedirect('/login');
    }
}
