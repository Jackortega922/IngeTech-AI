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

    private function fakeMotor(array $respuesta): void
    {
        $this->app->instance(RecommenderClient::class, new class($respuesta) implements RecommenderClient
        {
            public function __construct(private array $respuesta) {}

            public function recomendar(array $payload): array
            {
                return $this->respuesta;
            }
        });
    }

    public function test_devuelve_la_respuesta_del_motor_cuando_el_perfil_es_valido()
    {
        $laptop = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);

        // El motor (real o mock) solo habla el contrato v0: recomendaciones[] con
        // compatibilidad_pct/explicacion, nunca "tarjetas" ni "necesidad" — eso lo
        // arma el controlador para el frontend.
        $this->fakeMotor([
            'version' => 'v0',
            'recomendaciones' => [
                [
                    'laptop_id' => $laptop->id,
                    'compatibilidad_pct' => 87,
                    'precio_soles' => 2399,
                    'sobrante_soles' => 1601,
                    'explicacion' => ['factores' => [], 'advertencias' => []],
                ],
            ],
        ]);

        $this->postJson('/api/recomendaciones', $this->perfilValido())
            ->assertOk()
            ->assertJsonPath('version', 'v1')
            ->assertJsonPath('tarjetas.0.laptop_id', $laptop->id)
            ->assertJsonPath('tarjetas.0.laptop.id', $laptop->id)
            ->assertJsonPath('tarjetas.0.compatibilidad_pct', 87)
            ->assertJsonStructure(['necesidad' => ['ram_gb', 'cpu_score', 'gpu_dedicada', 'nivel']]);

        $this->assertDatabaseHas('recomendaciones', ['laptop_id' => $laptop->id, 'compatibilidad_pct' => 87]);
        $this->assertDatabaseHas('perfiles_usuario', ['carrera' => 'Ingeniería de Sistemas']);
    }

    public function test_asigna_badges_comparando_las_recomendaciones_entre_si()
    {
        $barata = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 3', 'tipo' => 'laptop', 'cpu' => 'i3',
            'ram_gb' => 8, 'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 1800, 'rendimiento_score' => 40,
        ]);
        $potente = Laptop::create([
            'marca' => 'Lenovo', 'modelo' => 'Legion 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 7',
            'ram_gb' => 32, 'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'RTX 4060', 'gpu_dedicada' => true, 'precio_soles' => 3900, 'rendimiento_score' => 90,
        ]);

        $this->fakeMotor([
            'version' => 'v0',
            'recomendaciones' => [
                ['laptop_id' => $barata->id, 'compatibilidad_pct' => 70, 'precio_soles' => 1800, 'sobrante_soles' => 2200, 'explicacion' => ['factores' => [], 'advertencias' => []]],
                ['laptop_id' => $potente->id, 'compatibilidad_pct' => 98, 'precio_soles' => 3900, 'sobrante_soles' => 100, 'explicacion' => ['factores' => [], 'advertencias' => []]],
            ],
        ]);

        $respuesta = $this->postJson('/api/recomendaciones', $this->perfilValido())->assertOk()->json();

        $tarjetaBarata = collect($respuesta['tarjetas'])->firstWhere('laptop_id', $barata->id);
        $tarjetaPotente = collect($respuesta['tarjetas'])->firstWhere('laptop_id', $potente->id);

        $this->assertContains('Mejor Opción Económica', $tarjetaBarata['badges']);
        $this->assertContains('Mejor Rendimiento', $tarjetaPotente['badges']);
    }

    public function test_filtra_recomendaciones_que_no_calzan_con_la_portabilidad_elegida()
    {
        $escritorio = Laptop::create([
            'marca' => 'HP', 'modelo' => 'Pavilion Desktop', 'tipo' => 'escritorio', 'cpu' => 'i5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2200, 'rendimiento_score' => 55,
        ]);

        $this->fakeMotor([
            'version' => 'v0',
            'recomendaciones' => [
                ['laptop_id' => $escritorio->id, 'compatibilidad_pct' => 90, 'precio_soles' => 2200, 'sobrante_soles' => 1800, 'explicacion' => ['factores' => [], 'advertencias' => []]],
            ],
        ]);

        $payload = $this->perfilValido();
        $payload['perfil']['portabilidad'] = 'laptop';

        $this->postJson('/api/recomendaciones', $payload)
            ->assertStatus(422)
            ->assertJsonPath('error', 'sin_resultados');
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
        $this->fakeMotor([
            'version' => 'v0',
            'error' => 'sin_resultados',
            'mensaje' => 'No hay equipos dentro del presupuesto.',
        ]);

        $this->postJson('/api/recomendaciones', $this->perfilValido())
            ->assertStatus(422)
            ->assertJsonPath('version', 'v1')
            ->assertJsonPath('error', 'sin_resultados')
            ->assertJsonStructure(['necesidad', 'cercanas']);
    }
}
