<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\Reclamo;
use App\Models\User;
use App\Notifications\PedidoEstadoActualizado;
use App\Notifications\PedidoRecibido;
use App\Notifications\ReclamoRegistrado;
use App\Notifications\ReclamoRespondido;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class CorreosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    private function comprar(string $email = 'rosa@correo.test'): Pedido
    {
        $laptop = Laptop::forceCreate([
            'stock' => 5, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55,
        ]);
        $codigo = $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => $email, 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated()->json('codigo');

        return Pedido::where('codigo', $codigo)->first();
    }

    public function test_la_compra_manda_la_confirmacion_al_correo_del_checkout()
    {
        $pedido = $this->comprar();

        Notification::assertSentOnDemand(PedidoRecibido::class, function ($n, $canales, AnonymousNotifiable $destino) use ($pedido) {
            $correo = $n->toMail($destino);

            return array_key_exists('rosa@correo.test', $destino->routes['mail'])
                && $correo->subject === "Recibimos tu pedido {$pedido->codigo}"
                // Sin dirección ni teléfono: un correo puede reenviarse.
                && ! str_contains(json_encode($correo->toArray()), 'Av. Larco');
        });
    }

    public function test_cambiar_el_estado_avisa_al_cliente_y_repetirlo_no()
    {
        $pedido = $this->comprar();
        $this->actingAs(User::factory()->create(['rol' => 'ventas']));

        $this->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'enviado'])->assertOk();
        $this->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'enviado'])->assertOk();

        Notification::assertSentOnDemandTimes(PedidoEstadoActualizado::class, 1);
    }

    public function test_el_libro_de_reclamaciones_manda_constancia_y_respuesta()
    {
        $this->post('/libro-reclamaciones', [
            'tipo' => 'reclamo', 'nombre' => 'Rosa Quispe', 'tipo_documento' => 'DNI', 'numero_documento' => '45678912',
            'domicilio' => 'Jr. Huallayco 123', 'email' => 'rosa@correo.test', 'bien' => 'producto',
            'descripcion_bien' => 'Laptop Acer', 'detalle' => 'La pantalla llegó rayada en la esquina.', 'pedido_consumidor' => 'Cambio de equipo.',
            'declara_veracidad' => true,
        ]);
        Notification::assertSentOnDemand(ReclamoRegistrado::class);

        $reclamo = Reclamo::first();
        $this->actingAs(User::factory()->create(['is_admin' => true]))
            ->patchJson("/api/admin/reclamos/{$reclamo->id}", ['respuesta' => 'Coordinamos el cambio de la unidad.'])->assertOk();
        Notification::assertSentOnDemand(ReclamoRespondido::class);
    }

    public function test_al_registrarse_se_pide_confirmar_el_correo()
    {
        $this->post('/register', ['name' => 'Rosa', 'email' => 'rosa@correo.test', 'password' => 'password', 'password_confirmation' => 'password']);

        Notification::assertSentTo(User::where('email', 'rosa@correo.test')->first(), VerifyEmail::class);
    }

    public function test_las_compras_de_invitado_pasan_a_la_cuenta_solo_al_confirmar_el_correo()
    {
        $pedido = $this->comprar('Rosa@Correo.test');
        $this->flushSession();
        $otra = $this->comprar('otra@correo.test');
        $this->flushSession();

        $rosa = User::factory()->unverified()->create(['email' => 'rosa@correo.test']);

        // Registrarse con el correo no basta: alguien podría usar el correo de otra persona.
        $this->assertNull($pedido->fresh()->user_id);

        $enlace = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $rosa->id, 'hash' => sha1($rosa->email)]);
        $this->actingAs($rosa)->get($enlace);

        $this->assertSame($rosa->id, $pedido->fresh()->user_id);
        $this->assertSame($rosa->id, $pedido->fresh()->personalizacion->user_id);
        $this->assertNull($otra->fresh()->user_id);
        $this->getJson('/api/mis-pedidos')->assertJsonCount(1)->assertJsonPath('0.codigo', $pedido->codigo);
    }
}
