<?php

namespace Tests\Feature\Api;

use App\Models\Cupon;
use App\Models\CuponEnvio;
use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EfectividadCampanasTest extends TestCase
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

    /** Compra de S/ 2,360 con el cupón: con PRIMERA10 queda en S/ 2,124 (S/ 236 de descuento). */
    private function compra(User $cliente, string $cupon): Pedido
    {
        $codigo = $this->actingAs($cliente)->postJson('/api/pedidos', [
            'laptop_id' => $this->laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => $cliente->email, 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true, 'cupon' => $cupon,
        ])->assertCreated()->json('codigo');

        return Pedido::where('codigo', $codigo)->first();
    }

    private function enviado(Cupon $cupon, User $cliente): void
    {
        CuponEnvio::create(['cupon_id' => $cupon->id, 'user_id' => $cliente->id]);
    }

    public function test_la_conversion_cuenta_solo_a_quienes_compraron_despues_de_recibirlo()
    {
        $cupon = Cupon::create(['codigo' => 'PRIMERA10', 'descripcion' => 'Primera compra', 'tipo' => 'porcentaje', 'valor' => 10, 'segmento' => 'interesados']);
        Cupon::create(['codigo' => 'TODOS5', 'descripcion' => 'Para todos', 'tipo' => 'porcentaje', 'valor' => 5]);
        [$respondio, $noCompro, $antes, $sinCorreo, $cancelo] = User::factory()->count(5)->create()->all();

        // Compró antes de que le llegara el correo: no es respuesta a la campaña.
        $this->compra($antes, 'PRIMERA10');
        $this->travel(1)->hours();
        foreach ([$respondio, $noCompro, $antes, $cancelo] as $c) {
            $this->enviado($cupon, $c);
        }
        $this->travel(1)->days();
        $this->compra($respondio, 'PRIMERA10');
        // Lo usó sin haberlo recibido (se lo pasaron): cuenta como uso, no como conversión.
        $this->compra($sinCorreo, 'PRIMERA10');
        $this->compra($cancelo, 'PRIMERA10')->update(['estado' => 'cancelado']);

        $res = $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/cupones/efectividad')->assertOk();

        $primera = collect($res->json('cupones'))->firstWhere('codigo', 'PRIMERA10');
        $this->assertSame(4, $primera['enviados']);
        $this->assertSame(1, $primera['compraron_por_correo']);
        $this->assertEquals(25, $primera['conversion_pct']);
        $this->assertSame(3, $primera['usos']);
        $this->assertEquals(6372, $primera['ventas']);    // 3 × 2,124
        $this->assertEquals(708, $primera['descuento']);  // 3 × 236
        $this->assertEquals(9, $primera['retorno']);

        // Sin envíos ni usos no hay base para la conversión ni el retorno.
        $todos = collect($res->json('cupones'))->firstWhere('codigo', 'TODOS5');
        $this->assertNull($todos['conversion_pct']);
        $this->assertNull($todos['retorno']);

        // Por grupo, el que más responde va primero.
        $res->assertJsonPath('por_grupo.0.segmento', 'interesados')
            ->assertJsonPath('por_grupo.0.cupones', 1)
            ->assertJsonPath('por_grupo.1.segmento', 'todos');
    }

    public function test_solo_el_personal_de_marketing_la_ve()
    {
        $this->actingAs(User::factory()->create(['rol' => 'almacen']))->getJson('/api/admin/cupones/efectividad')->assertForbidden();
        $this->actingAs(User::factory()->create())->getJson('/api/admin/cupones/efectividad')->assertForbidden();
    }
}
