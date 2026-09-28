<?php

namespace Tests\Feature;

use App\Models\Laptop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PortadaTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_portada_muestra_el_catalogo_real_ordenado_por_precio()
    {
        foreach ([['HP', '15 Laptop', 1699], ['Lenovo', 'Legion 5', 6499], ['Acer', 'Aspire 3', 1799]] as [$marca, $modelo, $precio]) {
            Laptop::create([
                'marca' => $marca, 'modelo' => $modelo, 'tipo' => 'laptop', 'cpu' => 'x', 'ram_gb' => 8,
                'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
                'precio_soles' => $precio, 'rendimiento_score' => 40,
            ]);
        }

        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('sistemas/welcome')
            ->has('laptops', 3)
            ->where('laptops.0.modelo', '15 Laptop')
            ->where('laptops.2.modelo', 'Legion 5')
        );
    }

    public function test_el_contacto_viene_del_env_y_no_se_inventa()
    {
        config(['contacto.whatsapp' => null]);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('contacto.whatsapp', null));

        config(['contacto.whatsapp' => '51987654321']);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('contacto.whatsapp', '51987654321'));
    }

    public function test_preguntas_y_terminos_se_pueden_leer_sin_cuenta()
    {
        $this->get('/preguntas')->assertOk();
        $this->get('/derecho')->assertOk();
    }
}
