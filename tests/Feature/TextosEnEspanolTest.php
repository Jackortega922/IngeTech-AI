<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\User;
use App\Notifications\PedidoEstadoActualizado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Lo que el sistema muestra fuera de las páginas de React también va en español. */
class TextosEnEspanolTest extends TestCase
{
    use RefreshDatabase;

    public function test_las_paginas_de_error_estan_en_espanol()
    {
        $this->get('/pedido/NO-EXISTE')->assertNotFound()->assertSee('No encontramos esta página')->assertDontSee('Not Found');
        // Enlace firmado alterado (encuesta o baja de ofertas).
        $cliente = User::factory()->create();
        $this->get("/publicidad/baja/{$cliente->id}?signature=falsa")->assertForbidden()->assertSee('el enlace que abriste ya no es válido', false);

        foreach ([419 => 'La página venció', 429 => 'Demasiados intentos', 500 => 'Algo salió mal', 503 => 'Estamos en mantenimiento'] as $codigo => $titulo) {
            $this->assertStringContainsString($titulo, view("errors.$codigo")->render());
        }
    }

    public function test_el_aviso_de_recuperar_contrasena_esta_en_espanol()
    {
        User::factory()->create(['email' => 'rosa@correo.test']);

        $this->post('/forgot-password', ['email' => 'rosa@correo.test'])
            ->assertSessionHas('status', fn (string $s) => str_starts_with($s, 'Si hay una cuenta con ese correo'));
    }

    public function test_el_asunto_del_correo_dice_el_estado_en_palabras()
    {
        $pedido = new Pedido(['codigo' => 'IT-ABC123', 'nombre' => 'Rosa', 'estado' => 'enviado']);

        $this->assertSame('Tu pedido IT-ABC123: va en camino', (new PedidoEstadoActualizado($pedido))->toMail(new User)->subject);
    }
}
