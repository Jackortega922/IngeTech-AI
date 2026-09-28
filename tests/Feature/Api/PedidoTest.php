<?php

namespace Tests\Feature\Api;

use App\Models\Accesorio;
use App\Models\Kit;
use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PedidoTest extends TestCase
{
    use RefreshDatabase;

    private Laptop $laptop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->laptop = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);
    }

    private function compra(array $cambios = []): array
    {
        return array_replace_recursive([
            'laptop_id' => $this->laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Huánuco', 'ciudad' => 'Huánuco', 'direccion' => 'Jr. Dos de Mayo 123',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'],
            'acepta_terminos' => true,
        ], $cambios);
    }

    public function test_un_invitado_puede_comprar_y_el_precio_lo_calcula_el_servidor()
    {
        $kit = Kit::create(['nombre' => 'Kit estudiante', 'precio_soles' => 150]);
        $mouse = Accesorio::create(['nombre' => 'Mouse', 'tipo' => 'mouse', 'precio_soles' => 45]);

        // 2399 + (32-16)*12 + (1024-512)*0.25 + 150 + 45 = 2914
        $codigo = $this->postJson('/api/pedidos', $this->compra([
            'ram_gb' => 32, 'almacenamiento_gb' => 1024, 'kit_id' => $kit->id, 'accesorio_ids' => [$mouse->id],
            'total' => 1, // lo manda el navegador: se ignora
        ]))
            ->assertCreated()
            ->assertJsonPath('total', '2914.00')
            ->json('codigo');

        $this->assertMatchesRegularExpression('/^IT-[A-Z0-9]{8}$/', $codigo);
        $this->assertDatabaseHas('pedidos', [
            'codigo' => $codigo, 'user_id' => null, 'estado' => 'pagado', 'tarjeta_ultimos4' => '4242', 'total' => 2914,
        ]);
    }

    public function test_con_cuenta_el_pedido_queda_a_su_nombre_y_aparece_en_mis_pedidos()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/pedidos', $this->compra())->assertCreated();

        $this->actingAs($user)->getJson('/api/mis-pedidos')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.user_id', $user->id)
            ->assertJsonPath('0.personalizacion.laptop.modelo', 'Aspire 5');
    }

    public function test_la_tarjeta_de_rechazo_simulado_no_crea_pedido()
    {
        $this->postJson('/api/pedidos', $this->compra(['pago' => ['ultimos4' => '0002']]))->assertStatus(402);

        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount('personalizaciones', 0);
    }

    public function test_valida_datos_de_envio_y_terminos()
    {
        $this->postJson('/api/pedidos', $this->compra([
            'telefono' => '12345', 'departamento' => 'Narnia', 'acepta_terminos' => false,
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['telefono', 'departamento', 'acepta_terminos']);
    }

    public function test_rechaza_ram_fuera_de_lo_que_admite_la_laptop()
    {
        $this->postJson('/api/pedidos', $this->compra(['ram_gb' => 64]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ram_gb');
    }

    public function test_no_se_puede_usar_la_recomendacion_de_otra_persona()
    {
        $perfil = PerfilUsuario::create([
            'user_id' => User::factory()->create()->id, 'carrera' => 'Sistemas', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 4000, 'portabilidad' => 'cualquiera',
        ]);
        $rec = Recomendacion::create([
            'perfil_usuario_id' => $perfil->id, 'laptop_id' => $this->laptop->id, 'compatibilidad_pct' => 80, 'explicacion' => [],
        ]);

        $this->postJson('/api/pedidos', $this->compra(['recomendacion_id' => $rec->id]))->assertForbidden();
        $this->actingAs(User::factory()->create())->postJson('/api/pedidos', $this->compra(['recomendacion_id' => $rec->id]))->assertForbidden();
    }

    public function test_la_confirmacion_solo_la_ve_quien_compro()
    {
        $codigo = $this->postJson('/api/pedidos', $this->compra())->json('codigo');

        // La misma sesión que compró (invitado) sí la ve.
        $this->get("/pedido/{$codigo}")->assertOk();

        // Otra persona con el código no: 404, para no confirmar que el código existe.
        $this->flushSession();
        $this->get("/pedido/{$codigo}")->assertNotFound();
        $this->actingAs(User::factory()->create())->get("/pedido/{$codigo}")->assertNotFound();

        $this->actingAs(User::factory()->create(['is_admin' => true]))->get("/pedido/{$codigo}")->assertOk();
    }

    public function test_el_admin_ve_los_pedidos_y_cambia_el_estado()
    {
        $this->postJson('/api/pedidos', $this->compra());
        $pedido = Pedido::first();

        $this->actingAs(User::factory()->create())->getJson('/api/admin/pedidos')->assertForbidden();

        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->getJson('/api/admin/pedidos')->assertOk()->assertJsonCount(1);
        $this->actingAs($admin)->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'enviado'])
            ->assertOk()
            ->assertJsonPath('estado', 'enviado');
        $this->actingAs($admin)->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'perdido'])->assertUnprocessable();
    }
}
