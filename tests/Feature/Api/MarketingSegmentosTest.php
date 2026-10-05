<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\User;
use App\Services\Recommender\SegmentadorClientes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketingSegmentosTest extends TestCase
{
    use RefreshDatabase;

    public ?array $enviado = null;

    private function motor(array $respuesta): void
    {
        $prueba = $this;
        $this->app->instance(SegmentadorClientes::class, new class($prueba, $respuesta) implements SegmentadorClientes
        {
            public function __construct(private $prueba, private array $respuesta) {}

            public function segmentar(array $clientes): array
            {
                $this->prueba->enviado = $clientes;

                return $this->respuesta;
            }
        });
    }

    private function perfil(User $u, float $presupuesto): void
    {
        PerfilUsuario::create([
            'user_id' => $u->id, 'portabilidad' => 'cualquiera', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => $presupuesto,
        ]);
    }

    public function test_envia_al_motor_solo_numeros_de_los_clientes_con_actividad()
    {
        $ana = User::factory()->create(['name' => 'Ana']);
        $this->perfil($ana, 2000);
        $this->perfil($ana, 3000);
        User::factory()->create(); // sin actividad: no se analiza
        User::factory()->create(['rol' => 'ventas']); // personal: no se analiza

        // Una compra de Ana.
        $laptop = Laptop::forceCreate([
            'stock' => 5, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55,
        ]);
        $this->actingAs($ana)->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Ana', 'email' => 'ana@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated();

        $this->motor(['version' => 'v0', 'error' => 'datos_insuficientes', 'mensaje' => 'Pocos clientes.']);
        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/marketing/segmentos')
            ->assertOk()
            ->assertJsonPath('error', 'datos_insuficientes')
            ->assertJsonPath('clientes_analizados', 1);

        $this->assertSame([[
            'id' => $ana->id, 'presupuesto_soles' => 2500.0, 'recomendaciones' => 2, 'pedidos' => 1, 'gasto_soles' => 2360.0, 'dias_inactivo' => 0,
        ]], $this->enviado);
    }

    public function test_al_panel_llegan_los_grupos_sin_la_lista_de_personas()
    {
        $this->motor(['version' => 'v0', 'k' => 2, 'silueta' => 0.61, 'segmentos' => [
            ['tipo' => 'interesados', 'nombre' => 'Interesados', 'accion' => 'Cupón', 'tamano' => 4, 'clientes' => [1, 2, 3, 4], 'promedio' => []],
            ['tipo' => 'alto_valor', 'nombre' => 'Alto valor', 'accion' => 'Fidelizar', 'tamano' => 2, 'clientes' => [5, 6], 'promedio' => []],
        ]]);

        $this->actingAs(User::factory()->create(['rol' => 'ventas']))->getJson('/api/admin/marketing/segmentos')
            ->assertOk()
            ->assertJsonPath('k', 2)
            ->assertJsonPath('segmentos.0.tamano', 4)
            ->assertJsonMissingPath('segmentos.0.clientes');
    }

    public function test_almacen_y_contabilidad_no_ven_marketing()
    {
        $this->actingAs(User::factory()->create(['rol' => 'almacen']))->getJson('/api/admin/marketing/segmentos')->assertForbidden();
        $this->actingAs(User::factory()->create(['rol' => 'contabilidad']))->getJson('/api/admin/marketing/segmentos')->assertForbidden();
    }
}
