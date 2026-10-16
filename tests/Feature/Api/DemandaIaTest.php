<?php

namespace Tests\Feature\Api;

use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\MovimientoInventario;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemandaIaTest extends TestCase
{
    use RefreshDatabase;

    private function laptop(string $modelo, int $stock, int $minimo = 2): Laptop
    {
        return Laptop::forceCreate([
            'stock' => $stock, 'stock_minimo' => $minimo, 'marca' => 'Acer', 'modelo' => $modelo, 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2000, 'rendimiento_score' => 55,
        ]);
    }

    /** Una consulta a la IA: la primera laptop es la de mayor compatibilidad. */
    private function consulta(Laptop ...$laptops): array
    {
        $perfil = PerfilUsuario::factory()->create();

        return collect($laptops)->values()->map(fn (Laptop $l, int $i) => Recomendacion::create([
            'perfil_usuario_id' => $perfil->id, 'laptop_id' => $l->id, 'compatibilidad_pct' => 90 - $i * 5, 'explicacion' => [],
        ]))->all();
    }

    public function test_cruza_lo_que_recomienda_la_ia_con_el_stock_y_las_ventas()
    {
        config(['tienda.inventario.min_consultas_demanda' => 6]);
        $seAcaba = $this->laptop('Se acaba', stock: 1);
        $noConvence = $this->laptop('No convence', stock: 6);
        $quieta = $this->laptop('Quieta', stock: 4);
        $vendeBien = $this->laptop('Vende bien', stock: 8);

        for ($i = 0; $i < 5; $i++) {
            $this->consulta($noConvence, $seAcaba);
        }
        [$rec] = $this->consulta($vendeBien, $seAcaba);
        EventoAnalitica::create(['recomendacion_id' => $rec->id, 'tipo' => 'eleccion_recomendacion', 'payload' => []]);
        MovimientoInventario::forceCreate(['laptop_id' => $vendeBien->id, 'tipo' => 'venta', 'cantidad' => -1, 'stock_resultante' => 8]);
        // Una consulta vieja, fuera de la ventana de 30 días, no cuenta.
        $this->travel(-40)->days();
        $this->consulta($quieta);
        $this->travelBack();

        $res = $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/inventario/demanda-ia')->assertOk();
        $fila = fn (Laptop $l) => collect($res->json('laptops'))->firstWhere('id', $l->id);

        $this->assertSame(['reponer_primero', 6, 0], [$fila($seAcaba)['senal'], $fila($seAcaba)['recomendada'], $fila($seAcaba)['primera_opcion']]);
        $this->assertSame(['no_convence', 5, 5], [$fila($noConvence)['senal'], $fila($noConvence)['recomendada'], $fila($noConvence)['primera_opcion']]);
        $this->assertSame(['capital_quieto', 0], [$fila($quieta)['senal'], $fila($quieta)['recomendada']]);
        $this->assertEquals(8000, $fila($quieta)['capital_soles']);
        $this->assertSame([null, 1, 1], [$fila($vendeBien)['senal'], $fila($vendeBien)['elegida'], $fila($vendeBien)['vendidas']]);
        $this->assertEquals(100, $fila($vendeBien)['conversion_pct']);

        $res->assertJsonPath('consultas', 6)
            ->assertJsonPath('resumen.reponer_primero', 1)
            ->assertJsonPath('resumen.no_convence', 1)
            ->assertJsonPath('resumen.capital_quieto', 1)
            ->assertJsonPath('laptops.0.modelo', 'Se acaba'); // lo urgente va primero
        $this->assertEquals(8000, $res->json('resumen.capital_quieto_soles'));
    }

    public function test_con_pocas_consultas_solo_avisa_lo_que_falta_reponer()
    {
        config(['tienda.inventario.min_consultas_demanda' => 20]);
        $seAcaba = $this->laptop('Se acaba', stock: 1);
        $quieta = $this->laptop('Quieta', stock: 4);
        $this->consulta($seAcaba);

        $res = $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/inventario/demanda-ia')->assertOk();

        $res->assertJsonPath('min_consultas', 20)
            ->assertJsonPath('resumen.reponer_primero', 1)
            ->assertJsonPath('resumen.capital_quieto', 0);
        $this->assertNull(collect($res->json('laptops'))->firstWhere('id', $quieta->id)['senal']);
    }

    public function test_solo_quien_ve_inventario()
    {
        $this->actingAs(User::factory()->create(['rol' => 'almacen']))->getJson('/api/admin/inventario/demanda-ia')->assertOk();
        $this->actingAs(User::factory()->create(['rol' => 'ventas']))->getJson('/api/admin/inventario/demanda-ia')->assertForbidden();
    }
}
