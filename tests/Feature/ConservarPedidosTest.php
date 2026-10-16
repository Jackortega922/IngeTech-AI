<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Un pedido es una venta con su boleta: borrar una cuenta, una laptop o una recomendación no lo borra. */
class ConservarPedidosTest extends TestCase
{
    use RefreshDatabase;

    private Laptop $laptop;

    protected function setUp(): void
    {
        parent::setUp();
        $this->laptop = Laptop::forceCreate([
            'stock' => 5, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55,
        ]);
    }

    private function compra(User $cliente): Pedido
    {
        $codigo = $this->actingAs($cliente)->postJson('/api/pedidos', [
            'laptop_id' => $this->laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => $cliente->email, 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated()->json('codigo');

        return Pedido::where('codigo', $codigo)->first();
    }

    public function test_eliminar_la_cuenta_conserva_sus_pedidos_y_las_ventas()
    {
        $cliente = User::factory()->create();
        $pedido = $this->compra($cliente);

        $this->actingAs($cliente)->delete('/settings/profile', ['password' => 'password'])->assertRedirect('/');
        $this->assertNull(User::find($cliente->id));

        $pedido->refresh();
        $this->assertNull($pedido->user_id);
        $this->assertNull($pedido->personalizacion->user_id);
        $this->assertSame($this->laptop->id, $pedido->personalizacion->laptop_id);

        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/contabilidad')
            ->assertJsonPath('ventas_total', 2360);
    }

    public function test_no_se_elimina_una_laptop_con_ventas_pero_si_una_sin_historial()
    {
        $pedido = $this->compra(User::factory()->create());
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->deleteJson("/api/admin/hardware/{$this->laptop->id}")
            ->assertStatus(409)
            ->assertJsonPath('message', fn (string $m) => str_contains($m, 'stock en 0'));
        $this->assertNotNull($pedido->fresh());

        $nueva = $this->laptop->replicate();
        $nueva->modelo = 'Aspire 7';
        $nueva->save();
        $this->deleteJson("/api/admin/hardware/{$nueva->id}")->assertNoContent();
    }

    public function test_borrar_la_recomendacion_no_borra_el_pedido_que_salio_de_ella()
    {
        $pedido = $this->compra(User::factory()->create());
        $perfil = PerfilUsuario::factory()->create();
        $rec = Recomendacion::create(['perfil_usuario_id' => $perfil->id, 'laptop_id' => $this->laptop->id, 'compatibilidad_pct' => 90, 'explicacion' => []]);
        $pedido->personalizacion->update(['recomendacion_id' => $rec->id]);

        $perfil->delete(); // borra en cadena sus recomendaciones

        $this->assertNull(Recomendacion::find($rec->id));
        $this->assertNotNull($pedido->fresh());
        $this->assertNull($pedido->personalizacion->fresh()->recomendacion_id);
    }
}
