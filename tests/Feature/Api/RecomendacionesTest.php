<?php

namespace Tests\Feature\Api;

use App\Models\Carrera;
use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Software;
use App\Services\Recommender\RecommenderClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecomendacionesTest extends TestCase
{
    use RefreshDatabase;

    public ?array $enviadoAlMotor = null;

    private function perfilValido(): array
    {
        Carrera::firstOrCreate(['clave' => 'ing_sistemas'], ['nombre' => 'Ingeniería de Sistemas', 'facultad' => 'Ingeniería']);

        return [
            'consentimiento' => true,
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

    public function test_guarda_el_cargo_si_se_indica_y_lo_deja_null_si_viene_vacio()
    {
        $this->fakeMotor(['version' => 'v0', 'error' => 'sin_resultados', 'mensaje' => 'Nada en tu presupuesto.']);

        $payload = $this->perfilValido();
        $payload['perfil']['cargo'] = '  Contador Público  ';
        $this->postJson('/api/recomendaciones', $payload)->assertStatus(422);
        $this->assertSame('Contador Público', PerfilUsuario::sole()->cargo);

        PerfilUsuario::query()->delete();
        $payload = $this->perfilValido();
        $payload['perfil']['cargo'] = '   ';
        $this->postJson('/api/recomendaciones', $payload)->assertStatus(422);
        $this->assertNull(PerfilUsuario::sole()->cargo);
    }

    public function test_rechaza_el_perfil_si_no_se_acepta_el_tratamiento_de_datos()
    {
        // Sin consentimiento no se procesa nada: ni se llama al motor ni se guarda el perfil.
        foreach ([false, null] as $valor) {
            $payload = $this->perfilValido();
            $payload['consentimiento'] = $valor;

            $this->postJson('/api/recomendaciones', $payload)
                ->assertUnprocessable()
                ->assertJsonValidationErrors('consentimiento');
        }

        $payload = $this->perfilValido();
        unset($payload['consentimiento']);

        $this->postJson('/api/recomendaciones', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('consentimiento');

        $this->assertDatabaseCount('perfiles_usuario', 0);
    }

    public function test_registra_cuando_se_dio_el_consentimiento()
    {
        $this->fakeMotor(['version' => 'v0', 'error' => 'sin_resultados', 'mensaje' => 'Nada en tu presupuesto.']);

        $this->postJson('/api/recomendaciones', $this->perfilValido());

        $this->assertNotNull(PerfilUsuario::sole()->consentimiento_at);
    }

    // La carrera es opcional (público general), pero el motor necesita saber qué hará la
    // persona: al menos un programa o una actividad.
    public function test_sin_carrera_ni_programas_ni_actividades_se_rechaza()
    {
        $payload = $this->perfilValido();
        $payload['perfil']['carrera_clave'] = '';
        $payload['perfil']['software'] = [];

        $this->postJson('/api/recomendaciones', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('perfil.software');
    }

    public function test_sin_carrera_pero_con_programas_recomienda_y_los_envia_al_motor()
    {
        Software::create([
            'clave' => 'office', 'nombre' => 'Office', 'categoria' => 'Ofimática',
            'min_ram_gb' => 4, 'min_cpu_score' => 20, 'min_gpu_dedicada' => false,
            'rec_ram_gb' => 8, 'rec_cpu_score' => 30, 'rec_gpu_dedicada' => false,
        ]);
        $prueba = $this;
        $this->app->instance(RecommenderClient::class, new class($prueba) implements RecommenderClient
        {
            public function __construct(private $prueba) {}

            public function recomendar(array $payload): array
            {
                $this->prueba->enviadoAlMotor = $payload;

                return ['version' => 'v0', 'error' => 'sin_resultados', 'mensaje' => 'Nada en tu presupuesto.'];
            }
        });

        $payload = $this->perfilValido();
        $payload['perfil']['carrera_clave'] = null;
        $payload['perfil']['software'] = ['office'];
        $payload['perfil']['tipo_uso'] = 'oficina';

        $this->postJson('/api/recomendaciones', $payload)->assertUnprocessable()->assertJsonPath('error', 'sin_resultados');

        $this->assertSame(['office'], $this->enviadoAlMotor['perfil']['software']);
        $this->assertSame('', $this->enviadoAlMotor['perfil']['carrera']);
        $this->assertDatabaseHas('perfiles_usuario', ['carrera_id' => null, 'tipo_uso' => 'oficina']);
    }

    public function test_las_laptops_agotadas_no_se_recomiendan_ni_se_sugieren()
    {
        $base = [
            'marca' => 'Acer', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16, 'almacenamiento_gb' => 512,
            'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false, 'precio_soles' => 3900, 'rendimiento_score' => 55,
        ];
        $agotada = Laptop::forceCreate([...$base, 'modelo' => 'Agotada', 'stock' => 0]);
        $disponible = Laptop::forceCreate([...$base, 'modelo' => 'Disponible', 'stock' => 3]);

        $prueba = $this;
        $this->app->instance(RecommenderClient::class, new class($prueba) implements RecommenderClient
        {
            public function __construct(private $prueba) {}

            public function recomendar(array $payload): array
            {
                $this->prueba->enviadoAlMotor = $payload;

                return ['version' => 'v0', 'error' => 'sin_resultados', 'mensaje' => 'Nada en tu presupuesto.'];
            }
        });

        $respuesta = $this->postJson('/api/recomendaciones', $this->perfilValido())->assertUnprocessable();

        $this->assertSame([$agotada->id], $this->enviadoAlMotor['opciones']['excluir_ids']);
        $this->assertSame([$disponible->id], array_column($respuesta->json('cercanas'), 'id'));
    }

    public function test_rechaza_programas_y_tipos_de_uso_que_no_existen()
    {
        $payload = $this->perfilValido();
        $payload['perfil']['software'] = ['programa_inventado'];
        $payload['perfil']['tipo_uso'] = 'astronauta';

        $this->postJson('/api/recomendaciones', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['perfil.software.0', 'perfil.tipo_uso']);
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
