<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\MovimientoInventario;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventarioTest extends TestCase
{
    use RefreshDatabase;

    private function laptop(int $stock, array $extra = []): Laptop
    {
        return Laptop::forceCreate([
            'stock' => $stock, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55, ...$extra,
        ]);
    }

    private function comprar(Laptop $laptop)
    {
        return $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ]);
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_vender_descuenta_y_la_ultima_unidad_no_se_vende_dos_veces()
    {
        $laptop = $this->laptop(1);

        $this->comprar($laptop)->assertCreated();
        $this->assertSame(0, $laptop->fresh()->stock);
        $this->assertDatabaseHas('movimientos_inventario', ['laptop_id' => $laptop->id, 'tipo' => 'venta', 'cantidad' => -1, 'stock_resultante' => 0]);

        $this->comprar($laptop)->assertStatus(422)->assertJsonValidationErrors('laptop_id');
        $this->assertSame(1, Pedido::count()); // el segundo pedido se deshizo completo
    }

    public function test_cancelar_un_pedido_devuelve_la_unidad()
    {
        $laptop = $this->laptop(3);
        $codigo = $this->comprar($laptop)->json('codigo');
        $pedido = Pedido::where('codigo', $codigo)->first();

        $this->actingAs($this->admin())->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'cancelado'])->assertOk();
        $this->assertSame(3, $laptop->fresh()->stock);

        $this->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'preparando'])->assertOk();
        $this->assertSame(2, $laptop->fresh()->stock);
    }

    public function test_entrada_y_ajuste_quedan_en_el_kardex()
    {
        $laptop = $this->laptop(2);
        $this->actingAs($this->admin());

        $this->postJson("/api/admin/inventario/{$laptop->id}/movimientos", ['tipo' => 'entrada', 'cantidad' => 10])->assertCreated();
        $this->assertSame(12, $laptop->fresh()->stock);

        $this->postJson("/api/admin/inventario/{$laptop->id}/movimientos", ['tipo' => 'ajuste', 'cantidad' => 11])
            ->assertJsonValidationErrors('motivo');
        $this->postJson("/api/admin/inventario/{$laptop->id}/movimientos", ['tipo' => 'ajuste', 'cantidad' => 11, 'motivo' => 'Conteo físico'])
            ->assertCreated()
            ->assertJsonPath('cantidad', -1);

        $this->assertSame(11, $laptop->fresh()->stock);
        // El stock siempre es la suma del kardex.
        $this->assertSame(11 - 2, (int) MovimientoInventario::where('laptop_id', $laptop->id)->sum('cantidad'));
    }

    public function test_el_stock_no_se_cambia_desde_el_formulario_de_equipos()
    {
        $laptop = $this->laptop(4);
        $laptop->update(['stock' => 99]);
        $this->assertSame(4, $laptop->fresh()->stock);
    }

    public function test_avisa_cuando_reponer_con_la_demanda_real()
    {
        $laptop = $this->laptop(6, ['stock_minimo' => 2]);
        foreach (range(1, 3) as $_) {
            $this->comprar($laptop)->assertCreated();
        }
        $quieta = $this->laptop(0, ['modelo' => 'Nitro V']);

        // Demanda: 3 unidades / 30 días = 0.1 por día. Punto de reorden: ceil(0.1 × 7) + 2 = 3.
        // Quedan 3 → reponer hasta cubrir 7 + 30 días: ceil(0.1 × 37) + 2 = 6 → pedir 3.
        $this->actingAs($this->admin())->getJson('/api/admin/inventario')
            ->assertOk()
            ->assertJsonPath('laptops.0.id', $quieta->id)
            ->assertJsonPath('laptops.0.estado', 'agotado')
            ->assertJsonPath('laptops.1.estado', 'reponer')
            ->assertJsonPath('laptops.1.vendidas', 3)
            ->assertJsonPath('laptops.1.punto_reorden', 3)
            ->assertJsonPath('laptops.1.reponer', 3)
            ->assertJsonPath('laptops.1.cobertura_dias', 30);
    }

    public function test_solo_el_admin()
    {
        $laptop = $this->laptop(1);
        $this->actingAs(User::factory()->create())->getJson('/api/admin/inventario')->assertForbidden();
        $this->postJson("/api/admin/inventario/{$laptop->id}/movimientos", ['tipo' => 'entrada', 'cantidad' => 5])->assertForbidden();
    }
}
