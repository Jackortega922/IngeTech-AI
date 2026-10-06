<?php

namespace Tests\Feature;

use App\Models\MovimientoInventario;
use App\Models\Pedido;
use App\Models\User;
use App\Services\Marketing\DatosSegmentacion;
use App\Services\Recommender\MockRecommenderClient;
use App\Services\Recommender\RecommenderClient;
use Database\Seeders\ActividadSeeder;
use Database\Seeders\ClientesDemoSeeder;
use Database\Seeders\LaptopSeeder;
use Database\Seeders\SoftwareSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientesDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_crea_clientes_con_actividad_suficiente_para_segmentar_y_es_idempotente()
    {
        $this->app->instance(RecommenderClient::class, new MockRecommenderClient);
        $this->seed([SoftwareSeeder::class, ActividadSeeder::class, LaptopSeeder::class]);

        $this->seed(ClientesDemoSeeder::class);

        $demo = User::where('email', 'like', '%@'.ClientesDemoSeeder::DOMINIO);
        $this->assertSame(26, $demo->count());
        $this->assertTrue($demo->get()->every(fn (User $u) => $u->rol === 'cliente'));

        // Las compras pasaron por el inventario: una venta en el kardex por pedido.
        $pedidos = Pedido::where('email', 'like', '%@'.ClientesDemoSeeder::DOMINIO)->count();
        $this->assertGreaterThan(0, $pedidos);
        $this->assertSame($pedidos, MovimientoInventario::where('tipo', 'venta')->count());

        // Hay clientes inactivos (más de 60 días) y de sobra para K-Means (mínimo 6).
        $clientes = app(DatosSegmentacion::class)->clientes();
        $this->assertGreaterThanOrEqual(20, count($clientes));
        $this->assertNotEmpty(array_filter($clientes, fn ($c) => $c['dias_inactivo'] > 60));

        $this->seed(ClientesDemoSeeder::class);
        $this->assertSame(26, User::where('email', 'like', '%@'.ClientesDemoSeeder::DOMINIO)->count());
    }
}
