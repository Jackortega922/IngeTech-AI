<?php

namespace Tests\Feature\Api;

use App\Models\Carrera;
use App\Models\Software;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatbotTest extends TestCase
{
    use RefreshDatabase;

    public function test_responde_sobre_una_carrera_conocida()
    {
        $sw = Software::create([
            'clave' => 'autocad', 'nombre' => 'AutoCAD', 'categoria' => 'Diseño / CAD',
            'min_ram_gb' => 8, 'min_cpu_score' => 40, 'min_gpu_dedicada' => true,
            'rec_ram_gb' => 16, 'rec_cpu_score' => 60, 'rec_gpu_dedicada' => true,
        ]);
        $carrera = Carrera::create(['clave' => 'ing_civil', 'nombre' => 'Ingeniería Civil', 'facultad' => 'Ingeniería']);
        $carrera->software()->attach($sw->id);

        $respuesta = $this->postJson('/api/chatbot', ['mensaje' => '¿Qué necesito para Ingeniería Civil?'])
            ->assertOk()
            ->json('respuesta');

        $this->assertStringContainsString('AutoCAD', $respuesta);
        $this->assertStringContainsString('Ingeniería Civil', $respuesta);
    }

    public function test_responde_con_faq_generica_cuando_no_reconoce_nada()
    {
        $this->postJson('/api/chatbot', ['mensaje' => '¿cómo funciona el comparador?'])
            ->assertOk()
            ->assertJsonPath('respuesta', 'Puedes marcar hasta 3 equipos en el Catálogo de Hardware y luego abrir "Comparador" para verlos lado a lado.');
    }

    public function test_responde_algo_por_defecto_si_no_encuentra_coincidencias()
    {
        $this->postJson('/api/chatbot', ['mensaje' => 'asdkjaslkdj'])
            ->assertOk()
            ->assertJsonStructure(['respuesta']);
    }
}
