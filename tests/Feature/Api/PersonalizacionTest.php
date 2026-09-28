<?php

namespace Tests\Feature\Api;

use App\Models\Accesorio;
use App\Models\Kit;
use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PersonalizacionTest extends TestCase
{
    use RefreshDatabase;

    private function laptop(): Laptop
    {
        return Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);
    }

    private function recomendacionDe(User $dueno, Laptop $laptop): Recomendacion
    {
        $perfil = PerfilUsuario::create([
            'user_id' => $dueno->id, 'carrera' => 'Ingeniería de Sistemas', 'nivel_experiencia' => 'intermedio',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 4000, 'portabilidad' => 'cualquiera',
        ]);

        return Recomendacion::create([
            'perfil_usuario_id' => $perfil->id, 'laptop_id' => $laptop->id, 'compatibilidad_pct' => 87,
            'explicacion' => ['badges' => []],
        ]);
    }

    public function test_guarda_la_cotizacion_y_recalcula_el_precio_en_el_servidor()
    {
        $user = User::factory()->create();
        $laptop = $this->laptop();
        $kit = Kit::create(['nombre' => 'Kit estudiante', 'precio_soles' => 150]);
        $mouse = Accesorio::create(['nombre' => 'Mouse', 'tipo' => 'mouse', 'precio_soles' => 45]);

        // 2399 + (32-16)*12 + (1024-512)*0.25 + 150 + 45 = 2914
        $this->actingAs($user)
            ->postJson('/api/personalizaciones', [
                'laptop_id' => $laptop->id, 'ram_gb' => 32, 'almacenamiento_gb' => 1024,
                'kit_id' => $kit->id, 'accesorio_ids' => [$mouse->id],
                'precio_total' => 1, // el navegador no decide el precio: se ignora
            ])
            ->assertCreated()
            ->assertJsonPath('precio_total', '2914.00')
            ->assertJsonCount(2, 'items');

        $this->assertDatabaseHas('personalizaciones', ['user_id' => $user->id, 'laptop_id' => $laptop->id, 'recomendacion_id' => null]);
    }

    public function test_se_puede_enlazar_a_una_recomendacion_propia()
    {
        $user = User::factory()->create();
        $laptop = $this->laptop();
        $rec = $this->recomendacionDe($user, $laptop);

        $this->actingAs($user)
            ->postJson('/api/personalizaciones', ['laptop_id' => $laptop->id, 'recomendacion_id' => $rec->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512])
            ->assertCreated()
            ->assertJsonPath('recomendacion_id', $rec->id);
    }

    public function test_no_se_puede_enlazar_a_una_recomendacion_ajena()
    {
        $laptop = $this->laptop();
        $rec = $this->recomendacionDe(User::factory()->create(), $laptop);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/personalizaciones', ['laptop_id' => $laptop->id, 'recomendacion_id' => $rec->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512])
            ->assertForbidden();
    }

    public function test_rechaza_ram_fuera_de_lo_que_admite_la_laptop()
    {
        $laptop = $this->laptop();

        $this->actingAs(User::factory()->create())
            ->postJson('/api/personalizaciones', ['laptop_id' => $laptop->id, 'ram_gb' => 64, 'almacenamiento_gb' => 512])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ram_gb');
    }

    public function test_un_invitado_no_puede_guardar_cotizaciones()
    {
        $this->postJson('/api/personalizaciones', ['laptop_id' => $this->laptop()->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512])
            ->assertUnauthorized();
    }

    public function test_cada_cliente_ve_solo_sus_cotizaciones_y_el_admin_ve_todas()
    {
        $laptop = $this->laptop();
        $ana = User::factory()->create();
        $beto = User::factory()->create();
        foreach ([$ana, $beto] as $u) {
            $this->actingAs($u)->postJson('/api/personalizaciones', ['laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512]);
        }

        $this->actingAs($ana)->getJson('/api/mis-cotizaciones')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.user_id', $ana->id);

        $this->actingAs($ana)->getJson('/api/admin/cotizaciones')->assertForbidden();

        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/cotizaciones')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonStructure([['user' => ['name', 'email'], 'laptop' => ['marca', 'modelo'], 'precio_total']]);
    }
}
