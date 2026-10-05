<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\Reclamo;
use App\Models\User;
use App\Support\DiasHabiles;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LibroReclamacionesTest extends TestCase
{
    use RefreshDatabase;

    private function datos(array $extra = []): array
    {
        return [
            'tipo' => 'reclamo', 'nombre' => 'Rosa Quispe', 'tipo_documento' => 'DNI', 'numero_documento' => '45678912',
            'domicilio' => 'Jr. Huallayco 123, Huánuco', 'telefono' => '987654321', 'email' => 'rosa@correo.test',
            'menor_de_edad' => false, 'bien' => 'producto', 'pedido_codigo' => 'it-abc12345', 'monto_reclamado' => 2360,
            'descripcion_bien' => 'Laptop Acer Aspire 5', 'detalle' => 'La laptop llegó con la pantalla rayada en la esquina.',
            'pedido_consumidor' => 'Cambio por una unidad nueva.', 'declara_veracidad' => true,
            ...$extra,
        ];
    }

    public function test_sin_cuenta_se_registra_la_hoja_con_numero_correlativo_y_plazo()
    {
        $this->post('/libro-reclamaciones', $this->datos())->assertRedirect('/libro-reclamaciones/LR-00000001');
        $this->post('/libro-reclamaciones', $this->datos(['tipo' => 'queja']))->assertRedirect('/libro-reclamaciones/LR-00000002');

        $reclamo = Reclamo::first();
        $this->assertSame('pendiente', $reclamo->estado);
        $this->assertSame('IT-ABC12345', $reclamo->pedido_codigo);
        $this->assertTrue($reclamo->fecha_limite->isSameDay(DiasHabiles::sumar($reclamo->created_at, 15)));
    }

    public function test_valida_documento_y_apoderado_si_es_menor()
    {
        $this->post('/libro-reclamaciones', $this->datos(['numero_documento' => '1234']))->assertSessionHasErrors('numero_documento');
        $this->post('/libro-reclamaciones', $this->datos(['menor_de_edad' => true]))->assertSessionHasErrors('apoderado');
        $this->post('/libro-reclamaciones', $this->datos(['declara_veracidad' => false]))->assertSessionHasErrors('declara_veracidad');
        $this->assertSame(0, Reclamo::count());
    }

    public function test_la_hoja_la_ve_quien_la_presento_y_se_recupera_con_numero_y_correo()
    {
        $this->post('/libro-reclamaciones', $this->datos());
        $this->get('/libro-reclamaciones/LR-00000001')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('derecho/hoja-reclamacion')->where('reclamo.numero', 'LR-00000001'));

        $this->flushSession();
        $this->get('/libro-reclamaciones/LR-00000001')->assertNotFound();

        $this->post('/libro-reclamaciones/consultar', ['numero' => 'lr-00000001', 'email' => 'otra@correo.test'])
            ->assertSessionHasErrors('numero');
        $this->post('/libro-reclamaciones/consultar', ['numero' => 'lr-00000001', 'email' => 'ROSA@correo.test'])
            ->assertRedirect('/libro-reclamaciones/LR-00000001');
        $this->get('/libro-reclamaciones/LR-00000001')->assertOk();
    }

    public function test_el_admin_responde_y_solo_el_admin()
    {
        $this->post('/libro-reclamaciones', $this->datos());
        $reclamo = Reclamo::first();

        $this->actingAs(User::factory()->create())->getJson('/api/admin/reclamos')->assertForbidden();

        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->getJson('/api/admin/reclamos')
            ->assertOk()
            ->assertJsonPath('0.numero', 'LR-00000001')
            ->assertJsonPath('0.dias_restantes', 15);

        $this->actingAs($admin)->patchJson("/api/admin/reclamos/{$reclamo->id}", ['respuesta' => 'Coordinamos el cambio de la unidad.'])
            ->assertOk()
            ->assertJsonPath('estado', 'respondido')
            ->assertJsonPath('dias_restantes', null);
    }

    public function test_los_dias_habiles_saltan_fines_de_semana_feriados_y_semana_santa()
    {
        // Viernes 24/07/2026 + 2 hábiles: sáb, dom, lun 27 (hábil), mar 28 y mié 29 (Fiestas Patrias), jue 30.
        $this->assertSame('2026-07-30', DiasHabiles::sumar(CarbonImmutable::parse('2026-07-24'), 2)->toDateString());

        // Pascua 2026: 5 de abril. Jueves 2 y viernes 3 de abril no son hábiles.
        $this->assertSame('2026-04-05', DiasHabiles::domingoDeResurreccion(2026)->toDateString());
        $this->assertFalse(DiasHabiles::esHabil(CarbonImmutable::parse('2026-04-02')));
        $this->assertSame('2026-04-06', DiasHabiles::sumar(CarbonImmutable::parse('2026-04-01'), 1)->toDateString());

        $this->assertSame(-1, DiasHabiles::restantes(CarbonImmutable::parse('2026-07-27'), CarbonImmutable::parse('2026-07-30')));
    }

    public function test_desde_un_pedido_propio_se_completan_los_datos()
    {
        $laptop = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55,
        ]);
        $codigo = $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->json('codigo');

        $this->get("/libro-reclamaciones?pedido={$codigo}")
            ->assertInertia(fn (Assert $page) => $page
                ->where('inicial.pedido_codigo', $codigo)
                ->where('inicial.descripcion_bien', 'Laptop Acer Aspire 5')
                ->where('inicial.email', 'rosa@correo.test'));

        // Otra persona con el mismo código no ve los datos de esa compra.
        $this->flushSession();
        $this->get("/libro-reclamaciones?pedido={$codigo}")
            ->assertInertia(fn (Assert $page) => $page->component('derecho/libro-reclamaciones')->where('inicial.pedido_codigo', ''));
    }
}
