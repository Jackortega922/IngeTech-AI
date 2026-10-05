<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AmbientalTest extends TestCase
{
    use RefreshDatabase;

    private function comprar(Laptop $laptop, array $extra = [])
    {
        return $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true, ...$extra,
        ]);
    }

    public function test_el_cliente_pide_el_recojo_de_su_equipo_y_la_pagina_lo_cuenta()
    {
        $base = [
            'stock' => 5, 'marca' => 'Acer', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16, 'almacenamiento_gb' => 512,
            'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false, 'precio_soles' => 2360, 'rendimiento_score' => 55,
        ];
        $laptop = Laptop::forceCreate([...$base, 'modelo' => 'Aspire 5', 'ram_ampliable_gb' => 32]);
        Laptop::forceCreate([...$base, 'modelo' => 'Soldada', 'ram_ampliable_gb' => 16]);

        $codigo = $this->comprar($laptop, ['recojo_raee' => true, 'raee_detalle' => 'Laptop HP 2016'])->assertCreated()->json('codigo');
        $this->comprar($laptop, ['raee_detalle' => 'se ignora sin recojo'])->assertCreated();

        $this->assertDatabaseHas('pedidos', ['codigo' => $codigo, 'recojo_raee' => true, 'raee_detalle' => 'Laptop HP 2016']);
        $this->assertSame(1, Pedido::whereNull('raee_detalle')->count());

        Pedido::where('codigo', $codigo)->first()->update(['estado' => 'entregado']);

        $this->actingAs(User::factory()->create())->get('/ing-ambiental')
            ->assertInertia(fn (Assert $page) => $page
                ->where('raee.solicitados', 1)
                ->where('raee.recogidos', 1)
                ->where('ampliables.ram', 1)
                ->where('ampliables.total', 2));
    }
}
