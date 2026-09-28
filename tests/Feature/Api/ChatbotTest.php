<?php

namespace Tests\Feature\Api;

use App\Models\Carrera;
use App\Models\Laptop;
use App\Models\Software;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
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
        $respuesta = $this->postJson('/api/chatbot', ['mensaje' => '¿cómo funciona el comparador?'])
            ->assertOk()
            ->json('respuesta');

        $this->assertStringContainsString('Comparador', $respuesta);
    }

    public function test_valida_la_preocupacion_por_presupuesto_antes_de_responder()
    {
        $respuesta = $this->postJson('/api/chatbot', ['mensaje' => 'no me alcanza el presupuesto'])
            ->assertOk()
            ->json('respuesta');

        $this->assertStringContainsString('Entiendo', $respuesta);
    }

    public function test_responde_algo_por_defecto_si_no_encuentra_coincidencias()
    {
        $this->postJson('/api/chatbot', ['mensaje' => 'asdkjaslkdj'])
            ->assertOk()
            ->assertJsonStructure(['respuesta']);
    }

    private function conDeepseek(): void
    {
        config(['services.deepseek.key' => 'clave-de-prueba', 'services.deepseek.url' => 'https://api.deepseek.test']);
    }

    public function test_con_api_key_responde_deepseek_anclado_al_catalogo()
    {
        $this->conDeepseek();
        Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);
        Http::fake(['api.deepseek.test/*' => Http::response(['choices' => [['message' => ['content' => 'Te recomiendo la Acer Aspire 5.']]]])]);

        $this->postJson('/api/chatbot', [
            'mensaje' => '¿Cuál me sirve para programar?',
            'historial' => [['autor' => 'usuario', 'texto' => 'Hola'], ['autor' => 'bot', 'texto' => '¡Hola!']],
        ])
            ->assertOk()
            ->assertJson(['respuesta' => 'Te recomiendo la Acer Aspire 5.', 'fuente' => 'deepseek']);

        Http::assertSent(function (HttpRequest $r) {
            $mensajes = $r['messages'];

            return $r->url() === 'https://api.deepseek.test/chat/completions'
                && $r->hasHeader('Authorization', 'Bearer clave-de-prueba')
                // El catálogo real va en el prompt, con su precio.
                && str_contains($mensajes[0]['content'], 'Acer Aspire 5')
                && str_contains($mensajes[0]['content'], 'S/ 2,399')
                // El historial se conserva en orden y el mensaje nuevo va al final.
                && $mensajes[1] === ['role' => 'user', 'content' => 'Hola']
                && $mensajes[2] === ['role' => 'assistant', 'content' => '¡Hola!']
                && end($mensajes) === ['role' => 'user', 'content' => '¿Cuál me sirve para programar?'];
        });
    }

    public function test_no_se_envia_el_nombre_del_usuario_a_deepseek()
    {
        $this->conDeepseek();
        Http::fake(['api.deepseek.test/*' => Http::response(['choices' => [['message' => ['content' => 'ok']]]])]);

        $this->actingAs(User::factory()->create(['name' => 'Rosa Quispe']))
            ->postJson('/api/chatbot', ['mensaje' => 'hola'])
            ->assertOk();

        Http::assertSent(fn (HttpRequest $r) => ! str_contains(json_encode($r->data()), 'Rosa'));
    }

    public function test_si_deepseek_falla_responde_el_asistente_por_palabras_clave()
    {
        $this->conDeepseek();
        Http::fake(['api.deepseek.test/*' => Http::response(['error' => 'saturado'], 503)]);

        $respuesta = $this->postJson('/api/chatbot', ['mensaje' => '¿cómo funciona el comparador?'])
            ->assertOk()
            ->assertJsonMissingPath('fuente')
            ->json('respuesta');

        $this->assertStringContainsString('Comparador', $respuesta);
    }

    public function test_sin_api_key_no_llama_a_deepseek()
    {
        Http::fake();

        $this->postJson('/api/chatbot', ['mensaje' => '¿cómo funciona el comparador?'])->assertOk();

        Http::assertNothingSent();
    }

    public function test_rechaza_mensajes_demasiado_largos()
    {
        $this->postJson('/api/chatbot', ['mensaje' => str_repeat('a', 501)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('mensaje');
    }
}
