<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\User;
use App\Support\Igv;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ContabilidadTest extends TestCase
{
    use RefreshDatabase;

    private function laptop(string $marca, float $precio): Laptop
    {
        return Laptop::forceCreate([
            // forceCreate: `stock` no es asignable en masa (solo cambia por el servicio Inventario).
            'stock' => 5,
            'marca' => $marca, 'modelo' => "Modelo {$marca}", 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => $precio, 'rendimiento_score' => 55,
        ]);
    }

    private function comprar(Laptop $laptop): string
    {
        return $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated()->json('codigo');
    }

    public function test_el_igv_se_desglosa_y_base_mas_igv_da_el_total()
    {
        $d = Igv::desglosar(1699);

        $this->assertSame(1439.83, $d['base']);
        $this->assertSame(259.17, $d['igv']);
        $this->assertSame(1699.0, round($d['base'] + $d['igv'], 2));
    }

    public function test_cada_pedido_recibe_una_boleta_correlativa()
    {
        $laptop = $this->laptop('Acer', 2360);
        $a = $this->comprar($laptop);
        $b = $this->comprar($laptop);

        $comprobantes = Pedido::whereIn('codigo', [$a, $b])->orderBy('id')->pluck('comprobante')->all();
        $this->assertMatchesRegularExpression('/^B001-\d{8}$/', $comprobantes[0]);
        $this->assertSame((int) substr($comprobantes[0], 5) + 1, (int) substr($comprobantes[1], 5));
    }

    public function test_el_panel_usa_ventas_reales_y_separa_las_anulaciones()
    {
        $this->comprar($this->laptop('Acer', 2360));
        $this->comprar($this->laptop('HP', 1180));
        $anulado = $this->comprar($this->laptop('Lenovo', 5000));
        Pedido::where('codigo', $anulado)->first()->update(['estado' => 'cancelado']);

        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->getJson('/api/admin/contabilidad')
            ->assertOk()
            ->assertJsonPath('ventas_total', 3540)        // 2360 + 1180; el cancelado no cuenta
            ->assertJsonPath('base_imponible', 3000)      // 3540 / 1.18
            ->assertJsonPath('igv', 540)
            ->assertJsonPath('numero_ventas', 2)
            ->assertJsonPath('ticket_promedio', 1770)
            ->assertJsonPath('anulaciones.cantidad', 1)
            ->assertJsonPath('anulaciones.monto', 5000)
            ->assertJsonPath('por_marca.Acer.monto', 2360)
            ->assertJsonPath('por_mes.'.now()->format('Y-m').'.ventas', 2);
    }

    public function test_exporta_el_registro_de_ventas_en_csv()
    {
        $codigo = $this->comprar($this->laptop('Acer', 2360));
        $admin = User::factory()->create(['is_admin' => true]);

        $csv = $this->actingAs($admin)->get('/api/admin/contabilidad/registro-ventas.csv')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('Comprobante;Pedido', $csv);
        $this->assertStringContainsString(";{$codigo};", $csv);
        $this->assertStringContainsString(';2000.00;360.00;2360.00;VÁLIDO', $csv);
    }

    public function test_solo_el_admin_ve_la_contabilidad()
    {
        $this->actingAs(User::factory()->create())->getJson('/api/admin/contabilidad')->assertForbidden();
        $this->actingAs(User::factory()->create())->get('/api/admin/contabilidad/registro-ventas.csv')->assertForbidden();
    }

    public function test_la_boleta_la_ve_quien_compro_y_nadie_mas()
    {
        $codigo = $this->comprar($this->laptop('Acer', 2360));

        $this->get("/pedido/{$codigo}/boleta")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('sistemas/boleta/index')
                ->where('desglose.base', 2000)
                ->where('desglose.igv', 360)
                ->where('igvPorcentaje', 18));

        $this->flushSession();
        $this->get("/pedido/{$codigo}/boleta")->assertNotFound();
    }
}
