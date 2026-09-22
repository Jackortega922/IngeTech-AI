<?php

namespace Tests\Feature\Api;

use App\Models\Carrera;
use App\Models\Laptop;
use App\Services\Recommender\RecommenderClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecomendacionesTest extends TestCase
{
    use RefreshDatabase;

    private function perfilValido(): array
    {
        Carrera::firstOrCreate(['clave' => 'ing_sistemas'], ['nombre' => 'Ingeniería de Sistemas', 'facultad' => 'Ingeniería']);

        return [
            'perfil' => [
                'carrera_clave' => 'ing_sistemas',
                'nivel_experiencia' => 'intermedio',
                'actividades' => [],
                'presupuesto_soles' => 4000,
                'portabilidad' => 'cualquiera',
            ],
        ];
    }

    public function test_devuelve_la_respuesta_del_motor_cuando_el_perfil_es_valido()
    {
        $laptop = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);

        $this->app->instance(RecommenderClient::class, new class($laptop->id) implements RecommenderClient
        {
            public function __construct(private int $laptopId) {}

            public function recomendar(array $payload): array
            {
                return [
                    'version' => 'v1',
                    'necesidad' => ['ram_gb' => 8, 'cpu_score' => 30, 'gpu_dedicada' => false, 'nivel' => 'min'],
                    'tarjetas' => [
                        ['laptop_id' => $this->laptopId, 'badges' => ['Mejor Opción Económica']],
                    ],
                ];
            }
        });

        $this->postJson('/api/recomendaciones', $this->perfilValido())
            ->assertOk()
            ->assertJsonPath('tarjetas.0.laptop_id', $laptop->id)
            ->assertJsonPath('tarjetas.0.laptop.id', $laptop->id);
    }

    public function test_rechaza_un_perfil_sin_carrera()
    {
        $payload = $this->perfilValido();
        $payload['perfil']['carrera_clave'] = '';

        $this->postJson('/api/recomendaciones', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('perfil.carrera_clave');
    }

    public function test_responde_en_json_aunque_el_cliente_no_pida_json_explicitamente()
    {
        // Simula un cliente (ej. curl o un fetch() sin "Accept") que no pide JSON: sin el
        // middleware ForceJsonResponse, Laravel trataría esto como un formulario web y
        // redirigiría en vez de devolver el 422 con los errores de validación.
        $payload = $this->perfilValido();
        $payload['perfil']['carrera_clave'] = '';

        $this->post('/api/recomendaciones', $payload, ['Accept' => 'text/html'])
            ->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/json');
    }

    public function test_propaga_el_error_del_motor_como_422()
    {
        $this->app->instance(RecommenderClient::class, new class implements RecommenderClient
        {
            public function recomendar(array $payload): array
            {
                return [
                    'version' => 'v1',
                    'error' => 'sin_resultados',
                    'mensaje' => 'No hay equipos dentro del presupuesto.',
                    'necesidad' => ['ram_gb' => 8, 'cpu_score' => 30, 'gpu_dedicada' => false, 'nivel' => 'min'],
                    'cercanas' => [],
                ];
            }
        });

        $this->postJson('/api/recomendaciones', $this->perfilValido())
            ->assertStatus(422)
            ->assertJsonPath('error', 'sin_resultados');
    }
}
