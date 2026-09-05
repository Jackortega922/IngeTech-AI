<?php

namespace Tests\Feature\Api;

use App\Services\Recommender\RecommenderClient;
use Tests\TestCase;

class RecomendacionesTest extends TestCase
{
    private array $perfilValido = [
        'perfil' => [
            'carrera' => 'Ingeniería de Sistemas',
            'nivel_experiencia' => 'intermedio',
            'actividades' => ['programacion_web'],
            'software' => ['vscode'],
            'presupuesto_soles' => 4000,
        ],
    ];

    public function test_devuelve_la_respuesta_del_motor_cuando_el_perfil_es_valido()
    {
        $this->app->instance(RecommenderClient::class, new class implements RecommenderClient
        {
            public function recomendar(array $payload): array
            {
                return [
                    'version' => 'v0',
                    'recomendaciones' => [
                        ['laptop_id' => 1, 'compatibilidad_pct' => 84],
                    ],
                ];
            }
        });

        $this->postJson('/api/recomendaciones', $this->perfilValido)
            ->assertOk()
            ->assertJsonPath('recomendaciones.0.laptop_id', 1);
    }

    public function test_rechaza_un_perfil_sin_actividades()
    {
        $payload = $this->perfilValido;
        $payload['perfil']['actividades'] = [];

        $this->postJson('/api/recomendaciones', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('perfil.actividades');
    }

    public function test_responde_en_json_aunque_el_cliente_no_pida_json_explicitamente()
    {
        // Simula un cliente (ej. curl o un fetch() sin "Accept") que no pide JSON: sin el
        // middleware ForceJsonResponse, Laravel trataría esto como un formulario web y
        // redirigiría en vez de devolver el 422 con los errores de validación.
        $payload = $this->perfilValido;
        $payload['perfil']['actividades'] = [];

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
                    'version' => 'v0',
                    'error' => 'sin_resultados',
                    'mensaje' => 'No hay laptops dentro del presupuesto.',
                ];
            }
        });

        $this->postJson('/api/recomendaciones', $this->perfilValido)
            ->assertStatus(422)
            ->assertJsonPath('error', 'sin_resultados');
    }
}
