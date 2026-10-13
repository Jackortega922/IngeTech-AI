<?php

namespace Tests\Feature\Api;

use App\Models\Cupon;
use App\Models\User;
use App\Notifications\CuponOfrecido;
use App\Services\Recommender\RecommenderException;
use App\Services\Recommender\SegmentadorClientes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class CuponesPorCorreoTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->admin = User::factory()->create(['is_admin' => true]);
    }

    /** El motor pone en el grupo "interesados" a los clientes indicados. */
    private function grupoInteresados(array $ids): void
    {
        $this->app->instance(SegmentadorClientes::class, new class($ids) implements SegmentadorClientes
        {
            public function __construct(private array $ids) {}

            public function segmentar(array $clientes): array
            {
                return ['k' => 2, 'silueta' => 0.6, 'segmentos' => [
                    ['tipo' => 'interesados', 'clientes' => $this->ids],
                    ['tipo' => 'compradores', 'clientes' => [999]],
                ]];
            }
        });
    }

    private function cliente(bool $acepta): User
    {
        $u = User::factory()->create();
        $u->aceptarPublicidad($acepta);
        $u->save();

        return $u;
    }

    private function cupon(array $extra = []): Cupon
    {
        return Cupon::create(['codigo' => 'PRIMERA10', 'descripcion' => 'Tu primera laptop con descuento', 'tipo' => 'porcentaje', 'valor' => 10, 'segmento' => 'interesados', ...$extra]);
    }

    public function test_solo_llega_a_quienes_del_grupo_aceptaron_y_una_sola_vez()
    {
        $acepta = $this->cliente(true);
        $noAcepta = $this->cliente(false);
        $otroGrupo = $this->cliente(true);
        $this->grupoInteresados([$acepta->id, $noAcepta->id]);
        $cupon = $this->cupon();

        $this->actingAs($this->admin)->getJson("/api/admin/cupones/{$cupon->id}/destinatarios")
            ->assertOk()
            ->assertJson(['en_grupo' => 2, 'aceptaron' => 1, 'ya_enviados' => 0, 'por_enviar' => 1]);

        $this->postJson("/api/admin/cupones/{$cupon->id}/enviar")->assertOk()->assertJson(['enviados' => 1]);
        Notification::assertSentTo($acepta, CuponOfrecido::class);
        Notification::assertNotSentTo([$noAcepta, $otroGrupo], CuponOfrecido::class);

        // Pulsar otra vez no lo repite.
        $this->postJson("/api/admin/cupones/{$cupon->id}/enviar")->assertOk()->assertJson(['enviados' => 0]);
        Notification::assertSentToTimes($acepta, CuponOfrecido::class, 1);
        $this->getJson('/api/admin/cupones')->assertJsonPath('0.envios_count', 1);
    }

    public function test_un_cupon_para_todos_llega_a_cualquier_cliente_que_acepto()
    {
        $a = $this->cliente(true);
        $b = $this->cliente(true);
        $this->cliente(false);
        $cupon = $this->cupon(['segmento' => null]);

        $this->actingAs($this->admin)->postJson("/api/admin/cupones/{$cupon->id}/enviar")->assertJson(['enviados' => 2]);
        Notification::assertSentTo([$a, $b], CuponOfrecido::class);
        // El personal no recibe ofertas.
        Notification::assertNotSentTo($this->admin, CuponOfrecido::class);
    }

    public function test_no_se_envia_un_cupon_pausado_o_vencido()
    {
        $this->cliente(true);
        $pausado = $this->cupon(['segmento' => null, 'activo' => false]);
        $vencido = $this->cupon(['codigo' => 'VIEJO10', 'segmento' => null, 'vence_el' => now()->subDay()->toDateString()]);

        $this->actingAs($this->admin)->postJson("/api/admin/cupones/{$pausado->id}/enviar")->assertStatus(422);
        $this->postJson("/api/admin/cupones/{$vencido->id}/enviar")->assertStatus(422);
        Notification::assertNothingSent();
    }

    public function test_si_el_motor_no_responde_no_se_envia_nada()
    {
        $this->cliente(true);
        $this->app->instance(SegmentadorClientes::class, new class implements SegmentadorClientes
        {
            public function segmentar(array $clientes): array
            {
                throw new RecommenderException('caído');
            }
        });
        $cupon = $this->cupon();

        $this->actingAs($this->admin)->postJson("/api/admin/cupones/{$cupon->id}/enviar")->assertStatus(503);
        Notification::assertNothingSent();
    }

    public function test_solo_el_personal_de_marketing_envia()
    {
        $cupon = $this->cupon(['segmento' => null]);

        $this->actingAs(User::factory()->create(['rol' => 'almacen']))->postJson("/api/admin/cupones/{$cupon->id}/enviar")->assertForbidden();
        $this->actingAs($this->cliente(true))->postJson("/api/admin/cupones/{$cupon->id}/enviar")->assertForbidden();
    }

    public function test_el_correo_trae_el_codigo_y_el_enlace_para_darse_de_baja()
    {
        $cliente = $this->cliente(true);
        $correo = (new CuponOfrecido($this->cupon(['minimo_compra' => 2000])))->toMail($cliente);
        $texto = implode("\n", [...$correo->introLines, ...$correo->outroLines]);

        $this->assertStringContainsString('PRIMERA10', $texto);
        $this->assertStringContainsString('10% de descuento', $texto);
        $this->assertStringContainsString('S/ 2,000.00', $texto);
        $this->assertStringContainsString('/publicidad/baja/'.$cliente->id, $texto);
    }

    public function test_el_enlace_firmado_da_de_baja_solo_al_confirmar()
    {
        $cliente = $this->cliente(true);
        $url = URL::signedRoute('publicidad.baja', ['user' => $cliente->id]);

        // Abrirlo (como lo haría el antivirus del correo) no da de baja.
        $this->get($url)->assertOk();
        $this->assertNotNull($cliente->fresh()->acepta_publicidad_at);

        $this->post($url)->assertOk();
        $this->assertNull($cliente->fresh()->acepta_publicidad_at);

        // Sin firma, o con otro usuario en la URL, no sirve.
        $this->post("/publicidad/baja/{$cliente->id}")->assertForbidden();
        $this->post(str_replace("/baja/{$cliente->id}", '/baja/'.$this->admin->id, $url))->assertForbidden();
    }

    public function test_acepta_al_registrarse_solo_si_marca_la_casilla_y_lo_cambia_en_su_perfil()
    {
        $datos = ['nombres' => 'Rosa', 'apellidos' => 'Quispe', 'password' => 'password', 'password_confirmation' => 'password'];

        $this->post('/register', [...$datos, 'email' => 'rosa@correo.test', 'acepta_publicidad' => true]);
        $rosa = User::where('email', 'rosa@correo.test')->first();
        $this->assertNotNull($rosa->acepta_publicidad_at);
        auth()->logout();

        $this->post('/register', [...$datos, 'email' => 'luis@correo.test']);
        $this->assertNull(User::where('email', 'luis@correo.test')->first()->acepta_publicidad_at);

        $this->actingAs($rosa)->patch('/settings/profile', ['nombres' => 'Rosa', 'apellidos' => 'Quispe', 'email' => 'rosa@correo.test', 'acepta_publicidad' => false])
            ->assertSessionHasNoErrors();
        $this->assertNull($rosa->fresh()->acepta_publicidad_at);

        // El perfil sin la casilla (p. ej. el personal) no toca el permiso.
        $rosa->aceptarPublicidad(true);
        $rosa->save();
        $this->patch('/settings/profile', ['nombres' => 'Rosa', 'apellidos' => 'Quispe', 'email' => 'rosa@correo.test']);
        $this->assertNotNull($rosa->fresh()->acepta_publicidad_at);
    }
}
