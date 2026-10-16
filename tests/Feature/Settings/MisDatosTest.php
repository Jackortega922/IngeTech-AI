<?php

namespace Tests\Feature\Settings;

use App\Models\Cupon;
use App\Models\CuponEnvio;
use App\Models\EncuestaSatisfaccion;
use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Reclamo;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MisDatosTest extends TestCase
{
    use RefreshDatabase;

    private function compra(User $cliente, Laptop $laptop): Pedido
    {
        $codigo = $this->actingAs($cliente)->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => $cliente->name, 'email' => $cliente->email, 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated()->json('codigo');

        return Pedido::where('codigo', $codigo)->first();
    }

    public function test_descarga_todo_lo_suyo_y_nada_de_otra_persona()
    {
        $laptop = Laptop::forceCreate([
            'stock' => 5, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55,
        ]);
        $rosa = User::factory()->create(['nombres' => 'Rosa', 'apellidos' => 'Quispe', 'email' => 'rosa@correo.test']);
        $rosa->preferencias()->create(['movilidad' => 'diario', 'completado_at' => now()]);
        $perfil = PerfilUsuario::factory()->create(['user_id' => $rosa->id, 'presupuesto_soles' => 3500]);
        Recomendacion::create(['perfil_usuario_id' => $perfil->id, 'laptop_id' => $laptop->id, 'compatibilidad_pct' => 88, 'explicacion' => []]);
        $pedido = $this->compra($rosa, $laptop);
        $pedido->update(['estado' => 'entregado']);
        EncuestaSatisfaccion::create(['pedido_id' => $pedido->id, 'satisfaccion' => 5, 'volveria_elegirla' => 'si']);
        Reclamo::forceCreate([
            'numero' => 'LR-00000001', 'tipo' => 'queja', 'nombre' => 'Rosa Quispe', 'tipo_documento' => 'DNI', 'numero_documento' => '12345678',
            'domicilio' => 'Av. Larco 100', 'telefono' => '987654321', 'email' => 'rosa@correo.test', 'bien' => 'servicio', 'descripcion_bien' => 'Entrega',
            'detalle' => 'Demora', 'pedido_consumidor' => 'Mejorar', 'estado' => 'pendiente', 'fecha_limite' => now()->addDays(20),
        ]);
        CuponEnvio::create(['cupon_id' => Cupon::create(['codigo' => 'GRACIAS5', 'descripcion' => 'x', 'tipo' => 'porcentaje', 'valor' => 5])->id, 'user_id' => $rosa->id]);

        // Otra persona con su propio pedido: no debe aparecer.
        $luis = User::factory()->create(['email' => 'luis@correo.test']);
        $deLuis = $this->compra($luis, $laptop);

        $res = $this->actingAs($rosa)->get('/settings/mis-datos')->assertOk();
        $this->assertStringContainsString('attachment; filename="mis-datos-ingetech-ai.json"', $res->headers->get('Content-Disposition'));
        $datos = json_decode($res->getContent(), true);

        $this->assertSame(['Rosa', 'Quispe', 'rosa@correo.test'], [$datos['cuenta']['nombres'], $datos['cuenta']['apellidos'], $datos['cuenta']['correo']]);
        $this->assertSame('diario', $datos['cuestionario_de_bienvenida']['movilidad']);
        $this->assertSame('Acer Aspire 5', $datos['consultas_a_la_ia'][0]['recomendaciones'][0]['laptop']);
        $this->assertCount(1, $datos['pedidos']);
        $this->assertSame($pedido->codigo, $datos['pedidos'][0]['codigo']);
        $this->assertSame('Av. Larco 100', $datos['pedidos'][0]['envio']['direccion']);
        $this->assertSame(5, $datos['pedidos'][0]['encuesta']['satisfaccion']);
        $this->assertSame('LR-00000001', $datos['libro_de_reclamaciones'][0]['numero']);
        $this->assertSame('GRACIAS5', $datos['cupones_recibidos_por_correo'][0]['cupon']);

        $this->assertStringNotContainsString($deLuis->codigo, $res->getContent());
        $this->assertStringNotContainsString('luis@correo.test', $res->getContent());
        $this->assertStringNotContainsString('password', $res->getContent());
    }

    public function test_sin_sesion_no_hay_descarga()
    {
        $this->get('/settings/mis-datos')->assertRedirect('/login');
    }
}
