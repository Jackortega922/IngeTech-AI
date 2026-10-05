<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeguimientoTest extends TestCase
{
    use RefreshDatabase;

    private function comprarComoInvitado(): string
    {
        $laptop = Laptop::forceCreate([
            // forceCreate: `stock` no es asignable en masa (solo cambia por el servicio Inventario).
            'stock' => 5,
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);

        $codigo = $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'Rosa@Correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated()->json('codigo');

        // Otra sesión: como si volviera días después desde otro navegador.
        $this->flushSession();

        return $codigo;
    }

    public function test_con_codigo_y_correo_puede_volver_a_ver_su_pedido()
    {
        $codigo = $this->comprarComoInvitado();
        $this->get("/pedido/{$codigo}")->assertNotFound();

        // Sin importar mayúsculas ni espacios de más.
        $this->post('/seguimiento', ['codigo' => ' '.strtolower($codigo), 'email' => 'rosa@correo.test'])
            ->assertRedirect("/pedido/{$codigo}");

        $this->get("/pedido/{$codigo}")->assertOk();
    }

    public function test_con_otro_correo_no_da_acceso_ni_revela_si_el_codigo_existe()
    {
        $codigo = $this->comprarComoInvitado();

        $this->post('/seguimiento', ['codigo' => $codigo, 'email' => 'otra@correo.test'])->assertRedirect('/seguimiento')->assertSessionHasErrors('codigo');
        $this->post('/seguimiento', ['codigo' => 'IT-NOEXISTE', 'email' => 'rosa@correo.test'])->assertRedirect('/seguimiento')->assertSessionHasErrors('codigo');

        $this->assertSame(session('errors')->first('codigo'), 'No encontramos un pedido con ese código y correo. Revisa que estén bien escritos.');
        $this->get("/pedido/{$codigo}")->assertNotFound();
    }

    public function test_cada_cambio_de_estado_queda_en_el_historial()
    {
        $codigo = $this->comprarComoInvitado();
        $pedido = Pedido::where('codigo', $codigo)->first();
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'preparando']);
        $this->actingAs($admin)->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'preparando']); // sin cambio: no se repite
        $this->actingAs($admin)->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'enviado']);

        $this->assertSame(['pagado', 'preparando', 'enviado'], $pedido->eventos()->pluck('estado')->all());
        $this->actingAs($admin)->getJson('/api/admin/pedidos')->assertJsonCount(3, '0.eventos');
    }

    public function test_la_pagina_de_seguimiento_es_publica()
    {
        $this->get('/seguimiento')->assertOk();
    }
}
