<?php

namespace Tests\Feature\Api;

use App\Models\Cupon;
use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CuponTest extends TestCase
{
    use RefreshDatabase;

    private Laptop $laptop;

    protected function setUp(): void
    {
        parent::setUp();
        $this->laptop = Laptop::forceCreate([
            'stock' => 10, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55,
        ]);
    }

    private function cupon(array $extra = []): Cupon
    {
        return Cupon::create(['codigo' => 'PRIMERA10', 'descripcion' => 'Primera compra', 'tipo' => 'porcentaje', 'valor' => 10, ...$extra]);
    }

    private function comprar(?string $cupon)
    {
        return $this->postJson('/api/pedidos', [
            'laptop_id' => $this->laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true, 'cupon' => $cupon,
        ]);
    }

    public function test_el_cupon_descuenta_y_el_igv_sale_del_total_con_descuento()
    {
        $this->cupon();

        $this->postJson('/api/cupones/validar', ['codigo' => 'primera10', 'subtotal' => 2360])
            ->assertOk()->assertJsonPath('descuento', 236);

        $codigo = $this->comprar('primera10')->assertCreated()->json('codigo');
        $pedido = Pedido::where('codigo', $codigo)->first();

        $this->assertSame('236.00', $pedido->descuento);
        $this->assertSame('2124.00', $pedido->total);
        $this->assertSame(1, Cupon::first()->usos);

        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/contabilidad')
            ->assertJsonPath('ventas_total', 2124)
            ->assertJsonPath('base_imponible', 1800)  // 2124 / 1.18
            ->assertJsonPath('descuentos.monto', 236);
    }

    public function test_el_monto_fijo_nunca_supera_la_compra_y_el_porcentaje_tiene_tope()
    {
        $this->assertSame(500.0, $this->cupon(['codigo' => 'MONTO', 'tipo' => 'monto', 'valor' => 9999])->descuentoPara(500));
        $this->assertSame(50.0, $this->cupon(['codigo' => 'MITAD', 'valor' => 90])->descuentoPara(100));
    }

    public function test_rechaza_cupones_vencidos_agotados_pausados_o_bajo_el_minimo()
    {
        $this->cupon(['codigo' => 'VENCIDO', 'vence_el' => now()->subDay()->toDateString()]);
        $this->cupon(['codigo' => 'UNO', 'usos_maximos' => 1]);
        $this->cupon(['codigo' => 'PAUSADO', 'activo' => false]);
        $this->cupon(['codigo' => 'MINIMO', 'minimo_compra' => 3000]);

        foreach (['VENCIDO', 'PAUSADO', 'MINIMO', 'NOEXISTE'] as $codigo) {
            $this->comprar($codigo)->assertStatus(422)->assertJsonValidationErrors('cupon');
        }
        $this->comprar('UNO')->assertCreated();
        $this->comprar('UNO')->assertStatus(422)->assertJsonValidationErrors('cupon');

        // Los rechazos no dejan pedidos a medias ni descuentan stock.
        $this->assertSame(1, Pedido::count());
        $this->assertSame(9, $this->laptop->fresh()->stock);
    }

    public function test_marketing_crea_y_pausa_cupones_para_un_segmento()
    {
        $this->actingAs(User::factory()->create(['rol' => 'ventas']));

        $id = $this->postJson('/api/admin/cupones', [
            'codigo' => 'vuelve 15', 'descripcion' => 'Reactivación', 'tipo' => 'porcentaje', 'valor' => 15, 'segmento' => 'inactivos',
        ])->assertJsonValidationErrors('codigo')->json('id');
        $this->assertNull($id);

        $id = $this->postJson('/api/admin/cupones', [
            'codigo' => 'vuelve15', 'descripcion' => 'Reactivación', 'tipo' => 'porcentaje', 'valor' => 15, 'segmento' => 'inactivos',
        ])->assertCreated()->assertJsonPath('codigo', 'VUELVE15')->json('id');

        $this->postJson('/api/admin/cupones', ['codigo' => 'MUCHO', 'descripcion' => 'x', 'tipo' => 'porcentaje', 'valor' => 80])
            ->assertJsonValidationErrors('valor');

        $this->patchJson("/api/admin/cupones/{$id}", ['activo' => false])->assertOk();
        $this->getJson('/api/admin/cupones')->assertJsonPath('0.activo', false);

        $this->actingAs(User::factory()->create(['rol' => 'almacen']))->getJson('/api/admin/cupones')->assertForbidden();
    }
}
