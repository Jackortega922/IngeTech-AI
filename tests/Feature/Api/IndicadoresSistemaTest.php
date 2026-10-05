<?php

namespace Tests\Feature\Api;

use App\Models\Cupon;
use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Reclamo;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IndicadoresSistemaTest extends TestCase
{
    use RefreshDatabase;

    private function comprar(Laptop $laptop, array $extra = [])
    {
        return $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true, ...$extra,
        ])->assertCreated()->json('codigo');
    }

    public function test_sin_datos_todos_los_indicadores_quedan_vacios()
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('sistema.ventas_desde_ia_pct', null)
            ->assertJsonPath('sistema.reclamos_en_plazo_pct', null)
            ->assertJsonPath('sistema.quiebre_stock_pct', null);
    }

    public function test_un_indicador_por_disciplina_con_datos_reales()
    {
        $base = [
            'marca' => 'Acer', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16, 'almacenamiento_gb' => 512,
            'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false, 'precio_soles' => 2000, 'rendimiento_score' => 55,
        ];
        $laptop = Laptop::forceCreate([...$base, 'modelo' => 'Aspire 5', 'stock' => 10]);
        Laptop::forceCreate([...$base, 'modelo' => 'Agotada', 'stock' => 0]);
        Cupon::create(['codigo' => 'PRIMERA10', 'descripcion' => 'x', 'tipo' => 'porcentaje', 'valor' => 10]);

        // Dos consultas a la IA con resultado; una termina en compra.
        $cliente = User::factory()->create();
        $perfil = PerfilUsuario::create([
            'user_id' => $cliente->id, 'portabilidad' => 'cualquiera', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 2500,
        ]);
        $recomendacion = Recomendacion::create(['perfil_usuario_id' => $perfil->id, 'laptop_id' => $laptop->id, 'compatibilidad_pct' => 90, 'explicacion' => []]);
        EventoAnalitica::create(['tipo' => 'consulta_recomendacion', 'payload' => ['resultado' => 'ok']]);
        EventoAnalitica::create(['tipo' => 'consulta_recomendacion', 'payload' => ['resultado' => 'ok']]);

        $this->actingAs($cliente);
        $desdeIa = $this->comprar($laptop, ['recomendacion_id' => $recomendacion->id, 'cupon' => 'PRIMERA10', 'recojo_raee' => true]);
        $this->comprar($laptop);
        $cancelado = $this->comprar($laptop);
        Pedido::where('codigo', $cancelado)->first()->update(['estado' => 'cancelado']);
        Pedido::where('codigo', $desdeIa)->first()->update(['estado' => 'entregado']);

        $reclamo = Reclamo::create([
            'tipo' => 'reclamo', 'nombre' => 'Rosa', 'tipo_documento' => 'DNI', 'numero_documento' => '45678912', 'domicilio' => 'x',
            'email' => 'rosa@correo.test', 'bien' => 'producto', 'descripcion_bien' => 'x', 'detalle' => 'x', 'pedido_consumidor' => 'x',
        ]);
        $reclamo->update(['estado' => 'respondido', 'respuesta' => 'Listo', 'respondido_at' => now()]);

        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('sistema.ventas_desde_ia_pct', 50)      // 1 de 2 ventas válidas
            ->assertJsonPath('sistema.conversion_ia_pct', 50)        // 1 perfil compró / 2 consultas ok
            ->assertJsonPath('sistema.ciclo_entrega_mediana_horas', 0)
            ->assertJsonPath('sistema.reclamos_por_100_pedidos', 33.3)  // 1 / 3 pedidos
            ->assertJsonPath('sistema.reclamos_en_plazo_pct', 100)
            ->assertJsonPath('sistema.quiebre_stock_pct', 50)
            ->assertJsonPath('sistema.ventas_con_cupon_pct', 50)
            ->assertJsonPath('sistema.recojo_raee_pct', 50);
    }
}
