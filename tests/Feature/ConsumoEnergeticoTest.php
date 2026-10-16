<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\User;
use App\Support\ConsumoEnergetico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsumoEnergeticoTest extends TestCase
{
    use RefreshDatabase;

    private function laptop(array $extra = []): Laptop
    {
        return Laptop::forceCreate([
            'stock' => 5, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7530U', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55, ...$extra,
        ]);
    }

    public function test_estima_la_potencia_por_el_tipo_de_procesador_y_la_grafica()
    {
        $this->assertSame(18, ConsumoEnergetico::estimarW($this->laptop(['cpu' => 'Intel Core i3-1215U'])));
        $this->assertSame(12, ConsumoEnergetico::estimarW($this->laptop(['cpu' => 'Apple M3'])));
        $this->assertSame(35, ConsumoEnergetico::estimarW($this->laptop(['cpu' => 'AMD Ryzen 7 7840HS'])));
        $this->assertSame(55, ConsumoEnergetico::estimarW($this->laptop(['cpu' => 'Intel Core i5-13500H', 'gpu_dedicada' => true])));
        $this->assertSame(25, ConsumoEnergetico::estimarW($this->laptop(['cpu' => 'Procesador desconocido'])));
        $this->assertSame(60, ConsumoEnergetico::estimarW($this->laptop(['tipo' => 'escritorio', 'cpu' => 'Intel Core i5-13400'])));
    }

    public function test_kwh_al_anio_y_soles_solo_con_tarifa_configurada()
    {
        config(['tienda.energia.tarifa_soles_kwh' => null]);
        // 18 W × 6 h × 300 días = 32.4 kWh
        $this->assertSame(['watts' => 18, 'estimado' => true, 'kwh_anio' => 32.4, 'soles_anio' => null], $this->laptop()->consumo);

        config(['tienda.energia.tarifa_soles_kwh' => '0.80']);
        $this->assertSame(25.92, $this->laptop()->consumo['soles_anio']);

        // El dato del fabricante manda sobre la estimación.
        $conDato = $this->laptop(['consumo_w' => 10]);
        $this->assertSame([10, false, 18.0], [$conDato->consumo['watts'], $conDato->consumo['estimado'], $conDato->consumo['kwh_anio']]);
    }

    public function test_el_admin_carga_el_dato_del_fabricante_y_lo_ve_la_tienda()
    {
        $laptop = $this->laptop();
        $datos = collect($laptop->toArray())->except(['id', 'stock', 'consumo', 'created_at', 'updated_at'])->all();

        $this->actingAs(User::factory()->create(['is_admin' => true]))
            ->putJson("/api/admin/hardware/{$laptop->id}", [...$datos, 'consumo_w' => 9])->assertOk();
        $this->assertSame(9, $laptop->fresh()->consumo_w);

        $this->putJson("/api/admin/hardware/{$laptop->id}", [...$datos, 'consumo_w' => 5000])->assertJsonValidationErrors('consumo_w');

        // Va en cada laptop que se serializa (catálogo, resultado de la IA, comparador).
        $this->assertSame(9, $laptop->fresh()->toArray()['consumo']['watts']);
    }
}
