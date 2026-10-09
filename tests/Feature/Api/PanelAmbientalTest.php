<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelAmbientalTest extends TestCase
{
    use RefreshDatabase;

    private Laptop $laptop;

    protected function setUp(): void
    {
        parent::setUp();
        $this->laptop = Laptop::forceCreate([
            'stock' => 10, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55, 'peso_kg' => 2.0,
        ]);
    }

    private function comprar(bool $recojo): Pedido
    {
        $codigo = $this->postJson('/api/pedidos', [
            'laptop_id' => $this->laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
            'recojo_raee' => $recojo, 'raee_detalle' => $recojo ? 'Laptop HP de 2015' : null,
        ])->assertCreated()->json('codigo');
        $this->flushSession();

        return Pedido::where('codigo', $codigo)->first();
    }

    public function test_pedir_el_recojo_lo_deja_pendiente_y_no_se_puede_forzar_al_comprar()
    {
        $this->assertSame('pendiente', $this->comprar(true)->raee_estado);
        $this->assertNull($this->comprar(false)->raee_estado);
    }

    public function test_almacen_avanza_el_recojo_en_orden_y_se_miden_los_indicadores()
    {
        $con = $this->comprar(true);
        $this->comprar(true);
        $this->comprar(false);
        $almacen = User::factory()->create(['rol' => 'almacen']);
        $this->actingAs($almacen);

        // No se puede saltar de pendiente a reciclado.
        $this->patchJson("/api/admin/ambiental/{$con->id}", ['raee_estado' => 'reciclado'])->assertUnprocessable();

        $this->patchJson("/api/admin/ambiental/{$con->id}", ['raee_estado' => 'recogido'])->assertOk();
        $this->patchJson("/api/admin/ambiental/{$con->id}", ['raee_estado' => 'reciclado'])->assertOk();
        $this->assertNotNull($con->fresh()->raee_recogido_at);
        $this->assertNotNull($con->fresh()->raee_reciclado_at);

        $this->getJson('/api/admin/ambiental')
            ->assertOk()
            ->assertJsonCount(2, 'recojos')
            ->assertJsonPath('indicadores.compras', 3)
            ->assertJsonPath('indicadores.con_recojo_pct', 66.7)
            ->assertJsonPath('indicadores.por_estado.pendiente', 1)
            ->assertJsonPath('indicadores.por_estado.reciclado', 1)
            ->assertJsonPath('indicadores.recuperados', 1)
            // Estimación: 1 equipo × peso promedio del catálogo (2 kg).
            ->assertJsonPath('indicadores.kg_estimados', 2)
            ->assertJsonPath('indicadores.recogidos_por_mes.5.cantidad', 1);
    }

    public function test_un_pedido_sin_recojo_o_cancelado_no_se_gestiona()
    {
        $sin = $this->comprar(false);
        $cancelado = $this->comprar(true);
        $cancelado->update(['estado' => 'cancelado']);

        $this->actingAs(User::factory()->create(['rol' => 'admin']));
        $this->patchJson("/api/admin/ambiental/{$sin->id}", ['raee_estado' => 'recogido'])->assertUnprocessable();
        $this->patchJson("/api/admin/ambiental/{$cancelado->id}", ['raee_estado' => 'recogido'])->assertUnprocessable();
        $this->getJson('/api/admin/ambiental')->assertJsonCount(0, 'recojos');
    }
}
