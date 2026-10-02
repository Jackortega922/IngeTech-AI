<?php

namespace Tests\Feature\Api;

use App\Models\Carrera;
use App\Models\Laptop;
use App\Models\PreferenciaCliente;
use App\Models\Software;
use App\Models\User;
use App\Services\Recommender\RecommenderClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * B11: las respuestas del cuestionario de bienvenida viajan al motor y la explicación de la IA
 * vuelve a la pantalla.
 */
class PreferenciasEnMotorTest extends TestCase
{
    use RefreshDatabase;

    public ?array $enviado = null;

    private Laptop $laptop;

    protected function setUp(): void
    {
        parent::setUp();

        Carrera::create(['clave' => 'ing_sistemas', 'nombre' => 'Ingeniería de Sistemas', 'facultad' => 'Ingeniería']);
        $this->laptop = Laptop::create([
            'marca' => 'HP', 'modelo' => 'Pavilion Aero 13', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2999, 'rendimiento_score' => 62,
        ]);

        // Motor falso que guarda lo que Laravel le mandó.
        $prueba = $this;
        $this->app->instance(RecommenderClient::class, new class($prueba, $this->laptop->id) implements RecommenderClient
        {
            public function __construct(private $prueba, private int $laptopId) {}

            public function recomendar(array $payload): array
            {
                $this->prueba->enviado = $payload;

                return ['version' => 'v0', 'recomendaciones' => [[
                    'laptop_id' => $this->laptopId, 'compatibilidad_pct' => 90, 'compatibilidad_tecnica_pct' => 85, 'afinidad_pct' => 100,
                    'precio_soles' => 2999, 'sobrante_soles' => 1001,
                    'explicacion' => [
                        'factores' => [['criterio' => 'Ligera para llevarla contigo (0.99 kg)', 'aporte' => 12]],
                        'advertencias' => ['Su batería (6 h) puede quedarse corta para lo que nos contaste'],
                    ],
                ]]];
            }
        });
    }

    private function pedir(?User $user = null)
    {
        $peticion = $user ? $this->actingAs($user) : $this;

        return $peticion->postJson('/api/recomendaciones', ['consentimiento' => true, 'perfil' => [
            'carrera_clave' => 'ing_sistemas', 'nivel_experiencia' => 'intermedio', 'actividades' => [],
            'presupuesto_soles' => 4000, 'portabilidad' => 'cualquiera',
        ]]);
    }

    public function test_con_el_cuestionario_completo_las_preferencias_viajan_al_motor()
    {
        $user = User::factory()->create();
        PreferenciaCliente::create([
            'user_id' => $user->id, 'movilidad' => 'diario', 'molestias' => ['se_congela'],
            'prioridades' => ['portabilidad', 'precio'], 'marcas_evitar' => ['Acer'], 'perifericos' => [],
            'nivel_tecnologia' => 'principiante', 'completado_at' => now(),
        ]);

        $this->pedir($user)->assertOk();

        $preferencias = $this->enviado['perfil']['preferencias'];
        $this->assertSame('diario', $preferencias['movilidad']);
        $this->assertSame(['portabilidad', 'precio'], $preferencias['prioridades']);
        $this->assertSame(['Acer'], $preferencias['marcas_evitar']);
        // Lo vacío no viaja, y lo que solo cambia la presentación (nivel técnico) tampoco.
        $this->assertArrayNotHasKey('perifericos', $preferencias);
        $this->assertArrayNotHasKey('nivel_tecnologia', $preferencias);
    }

    public function test_sin_cuestionario_u_omitido_el_motor_recibe_el_perfil_de_siempre()
    {
        $this->pedir()->assertOk();
        $this->assertArrayNotHasKey('preferencias', $this->enviado['perfil']);

        $omitio = User::factory()->create();
        PreferenciaCliente::create(['user_id' => $omitio->id, 'movilidad' => 'diario', 'omitido_at' => now()]);
        $this->pedir($omitio)->assertOk();
        $this->assertArrayNotHasKey('preferencias', $this->enviado['perfil']);
    }

    public function test_la_explicacion_de_la_ia_llega_al_resultado()
    {
        $this->pedir()
            ->assertOk()
            ->assertJsonPath('tarjetas.0.afinidad_pct', 100)
            ->assertJsonPath('tarjetas.0.compatibilidad_tecnica_pct', 85)
            ->assertJsonPath('tarjetas.0.explicacion.factores.0.criterio', 'Ligera para llevarla contigo (0.99 kg)')
            ->assertJsonPath('tarjetas.0.explicacion.advertencias.0', 'Su batería (6 h) puede quedarse corta para lo que nos contaste');
    }

    public function test_el_comando_exporta_el_catalogo_con_los_datos_del_cuestionario()
    {
        $this->laptop->update(['peso_kg' => 0.99, 'bateria_horas' => 10, 'puertos' => ['usb_a', 'hdmi']]);
        Software::create([
            'clave' => 'autocad', 'nombre' => 'AutoCAD', 'categoria' => 'Diseño / CAD',
            'min_ram_gb' => 8, 'min_cpu_score' => 40, 'min_gpu_dedicada' => true,
            'rec_ram_gb' => 16, 'rec_cpu_score' => 60, 'rec_gpu_dedicada' => true,
        ]);
        // Las DOS rutas a archivos temporales: sin --ruta-software, la prueba sobrescribía el
        // ml-engine/data/software.json real con la BD de pruebas (vacía) y dejaba al motor sin
        // programas.
        $ruta = tempnam(sys_get_temp_dir(), 'laptops');
        $rutaSoftware = tempnam(sys_get_temp_dir(), 'software');

        $this->artisan('motor:exportar-catalogo', ['--ruta' => $ruta, '--ruta-software' => $rutaSoftware])->assertSuccessful();

        $exportado = json_decode(file_get_contents($ruta), true);
        $programas = json_decode(file_get_contents($rutaSoftware), true);
        unlink($ruta);
        unlink($rutaSoftware);
        $this->assertSame($this->laptop->id, $exportado[0]['id']);
        $this->assertSame(62, $exportado[0]['cpu_score']);
        $this->assertSame(0.99, $exportado[0]['peso_kg']);
        $this->assertSame(['usb_a', 'hdmi'], $exportado[0]['puertos']);
        $this->assertSame(['clave' => 'autocad', 'rec_ram_gb' => 16, 'rec_gpu_dedicada' => true], array_intersect_key($programas[0], array_flip(['clave', 'rec_ram_gb', 'rec_gpu_dedicada'])));
    }
}
