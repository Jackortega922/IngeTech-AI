<?php

namespace Tests\Feature;

use App\Models\EncuestaSatisfaccion;
use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Models\User;
use App\Notifications\PedidoEstadoActualizado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class EncuestaSatisfaccionTest extends TestCase
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

    private function compra(?User $cliente = null, bool $entregado = true): Pedido
    {
        $peticion = $cliente ? $this->actingAs($cliente) : $this;
        $codigo = $peticion->postJson('/api/pedidos', [
            'laptop_id' => $this->laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => $cliente?->email ?? 'invitada@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated()->json('codigo');
        $pedido = Pedido::where('codigo', $codigo)->first();
        if ($entregado) {
            $pedido->update(['estado' => 'entregado']);
        }

        return $pedido;
    }

    private function respuestas(array $extra = []): array
    {
        return ['satisfaccion' => 4, 'volveria_elegirla' => 'si', 'aspectos' => [], 'comentario' => '', ...$extra];
    }

    public function test_el_cliente_responde_una_vez_desde_la_pagina_de_su_pedido()
    {
        $cliente = User::factory()->create();
        $pedido = $this->compra($cliente);

        $this->get("/pedido/{$pedido->codigo}")->assertInertia(fn (AssertableInertia $p) => $p
            ->where('encuesta.respondida', false)
            ->has('encuesta.opciones.aspectos'));

        $this->from("/pedido/{$pedido->codigo}")->post("/pedido/{$pedido->codigo}/encuesta", $this->respuestas(['aspectos' => ['bateria'], 'comentario' => '  La batería dura poco  ']))
            ->assertRedirect("/pedido/{$pedido->codigo}")->assertSessionHasNoErrors();

        $encuesta = $pedido->encuesta()->first();
        $this->assertSame(4, $encuesta->satisfaccion);
        $this->assertSame(['bateria'], $encuesta->aspectos);
        $this->assertSame('La batería dura poco', $encuesta->comentario);

        // Una sola por pedido.
        $this->post("/pedido/{$pedido->codigo}/encuesta", $this->respuestas(['satisfaccion' => 1]))->assertSessionHasErrors('encuesta');
        $this->assertSame(1, EncuestaSatisfaccion::count());

        $this->getJson('/api/mis-pedidos')->assertJsonPath('0.encuesta.satisfaccion', 4);
    }

    public function test_solo_se_responde_un_pedido_entregado_y_con_respuestas_validas()
    {
        $cliente = User::factory()->create();
        $enCamino = $this->compra($cliente, entregado: false);

        $this->get("/pedido/{$enCamino->codigo}")->assertInertia(fn (AssertableInertia $p) => $p->where('encuesta', null));
        $this->post("/pedido/{$enCamino->codigo}/encuesta", $this->respuestas())->assertSessionHasErrors('encuesta');

        $entregado = $this->compra($cliente);
        $this->post("/pedido/{$entregado->codigo}/encuesta", $this->respuestas(['satisfaccion' => 6, 'volveria_elegirla' => 'tal_vez', 'aspectos' => ['inventado']]))
            ->assertSessionHasErrors(['satisfaccion', 'volveria_elegirla', 'aspectos.0']);
        $this->assertSame(0, EncuestaSatisfaccion::count());
    }

    public function test_quien_compro_sin_cuenta_responde_desde_el_enlace_firmado_del_correo()
    {
        Notification::fake();
        $pedido = $this->compra(entregado: false);
        $this->flushSession(); // ya no es la sesión de la compra

        // Al marcarlo como entregado, el correo trae el enlace firmado de la encuesta.
        $this->actingAs(User::factory()->create(['is_admin' => true]))->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'entregado'])->assertOk();
        $url = null;
        Notification::assertSentTo(new AnonymousNotifiable, PedidoEstadoActualizado::class, function ($n) use (&$url) {
            $url = $n->toMail(new AnonymousNotifiable)->actionUrl;

            return true;
        });
        $this->assertStringContainsString("/pedido/{$pedido->codigo}/encuesta?signature=", $url);
        auth()->logout();

        // La página del enlace no muestra dirección ni teléfono.
        $this->get($url)->assertOk()->assertInertia(fn (AssertableInertia $p) => $p
            ->component('sistemas/encuesta/index')
            ->where('laptop', 'Acer Aspire 5')
            ->missing('pedido'));

        $this->post($url, $this->respuestas(['satisfaccion' => 5]))->assertSessionHasNoErrors();
        $this->assertSame(5, $pedido->encuesta()->first()->satisfaccion);
    }

    public function test_sin_firma_ni_acceso_al_pedido_no_se_puede_responder()
    {
        $pedido = $this->compra(User::factory()->create());
        auth()->logout();
        $this->flushSession();

        $this->post("/pedido/{$pedido->codigo}/encuesta", $this->respuestas())->assertNotFound();
        $this->get("/pedido/{$pedido->codigo}/encuesta")->assertForbidden();
        $this->actingAs(User::factory()->create())->post("/pedido/{$pedido->codigo}/encuesta", $this->respuestas())->assertNotFound();
        $this->assertSame(0, EncuestaSatisfaccion::count());
    }

    public function test_el_dashboard_compara_la_satisfaccion_de_lo_que_recomendo_la_ia()
    {
        $conIa = $this->compra(User::factory()->create());
        $rec = Recomendacion::create(['perfil_usuario_id' => PerfilUsuario::factory()->create()->id, 'laptop_id' => $this->laptop->id, 'compatibilidad_pct' => 90, 'explicacion' => []]);
        $conIa->personalizacion->update(['recomendacion_id' => $rec->id]);
        EncuestaSatisfaccion::create(['pedido_id' => $conIa->id, 'satisfaccion' => 5, 'volveria_elegirla' => 'si']);

        $sinIa = $this->compra(User::factory()->create());
        EncuestaSatisfaccion::create(['pedido_id' => $sinIa->id, 'satisfaccion' => 2, 'volveria_elegirla' => 'no', 'aspectos' => ['bateria', 'peso'], 'comentario' => 'Muy pesada']);
        $this->compra(User::factory()->create()); // entregado sin responder

        $s = $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/dashboard')->assertOk()->json('satisfaccion');

        $this->assertSame(3, $s['entregados']);
        $this->assertEquals(66.7, $s['tasa_respuesta_pct']);
        $this->assertEquals(3.5, $s['promedio']);
        $this->assertEquals(50, $s['volveria_pct']);
        $this->assertEquals(['Recomendada por la IA', 1, 5, 100], [$s['por_origen'][0]['origen'], $s['por_origen'][0]['respuestas'], $s['por_origen'][0]['promedio'], $s['por_origen'][0]['volveria_pct']]);
        $this->assertEquals([1, 2, 0], [$s['por_origen'][1]['respuestas'], $s['por_origen'][1]['promedio'], $s['por_origen'][1]['volveria_pct']]);
        $this->assertSame(['85 % o más', 1], [$s['por_compatibilidad'][0]['rango'], $s['por_compatibilidad'][0]['respuestas']]);
        $this->assertSame(0, $s['por_compatibilidad'][2]['respuestas']);
        $this->assertSame(1, collect($s['aspectos'])->firstWhere('clave', 'bateria')['cantidad']);
        $this->assertSame(['Muy pesada', $sinIa->codigo, 'Acer Aspire 5'], [$s['comentarios'][0]['texto'], $s['comentarios'][0]['pedido'], $s['comentarios'][0]['laptop']]);
    }

    public function test_psicologia_ve_quien_duda_despues_de_comprar_segun_como_decide()
    {
        $compara = User::factory()->create();
        $compara->preferencias()->create(['estilo_decision' => 'comparar', 'completado_at' => now()]);
        EncuestaSatisfaccion::create(['pedido_id' => $this->compra($compara)->id, 'satisfaccion' => 3, 'volveria_elegirla' => 'no_seguro']);

        $laMejor = User::factory()->create();
        $laMejor->preferencias()->create(['estilo_decision' => 'la_mejor', 'completado_at' => now()]);
        EncuestaSatisfaccion::create(['pedido_id' => $this->compra($laMejor)->id, 'satisfaccion' => 5, 'volveria_elegirla' => 'si']);

        $d = $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/psicologia')->assertOk()->json('despues_de_la_compra');

        $this->assertSame(2, $d['respuestas']);
        $this->assertEquals(50, $d['dudan_pct']);
        $porEstilo = collect($d['por_estilo'])->keyBy('valor');
        $this->assertEquals(100, $porEstilo['comparar']['dudan_pct']);
        $this->assertEquals(0, $porEstilo['la_mejor']['dudan_pct']);
        $this->assertNull($porEstilo['ver_todo']['dudan_pct']);
    }
}
