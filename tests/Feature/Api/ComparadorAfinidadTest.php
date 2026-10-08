<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\PreferenciaCliente;
use App\Models\User;
use App\Services\Recommender\AfinidadLaptops;
use App\Services\Recommender\RecommenderException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComparadorAfinidadTest extends TestCase
{
    use RefreshDatabase;

    public ?array $enviado = null;

    public bool $llamado = false;

    /** Motor falso: guarda lo que recibió y responde lo indicado (o falla si es null). */
    private function motor(?array $respuesta): void
    {
        $this->app->instance(AfinidadLaptops::class, new class($this, $respuesta) implements AfinidadLaptops
        {
            public function __construct(private $prueba, private ?array $respuesta) {}

            public function afinidad(array $preferencias, array $laptopIds): array
            {
                $this->prueba->llamado = true;
                $this->prueba->enviado = ['preferencias' => $preferencias, 'laptop_ids' => $laptopIds];

                return $this->respuesta ?? throw new RecommenderException('motor caído');
            }
        });
    }

    /** @return list<int> */
    private function laptops(): array
    {
        return collect(['Aspire 3', 'Aspire 5'])->map(fn ($modelo) => Laptop::forceCreate([
            'marca' => 'Acer', 'modelo' => $modelo, 'tipo' => 'laptop', 'cpu' => 'x', 'ram_gb' => 8,
            'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2000,
        ])->id)->all();
    }

    private function conCuestionario(array $respuestas = ['movilidad' => 'diario', 'marcas_evitar' => ['HP']]): User
    {
        $user = User::factory()->create();
        PreferenciaCliente::create(['user_id' => $user->id, ...$respuestas, 'completado_at' => now()]);

        return $user;
    }

    public function test_con_cuestionario_el_motor_ordena_las_laptops_para_la_persona()
    {
        [$a, $b] = $this->laptops();
        $afinidades = [['laptop_id' => $b, 'afinidad_pct' => 88, 'factores' => [], 'advertencias' => []]];
        $this->motor(['version' => 'v0', 'afinidades' => $afinidades]);

        $this->actingAs($this->conCuestionario())
            ->postJson('/api/comparador/afinidad', ['laptop_ids' => [$a, $b]])
            ->assertOk()
            ->assertExactJson(['disponible' => true, 'afinidades' => $afinidades]);

        // Viajan las respuestas en el formato del contrato, sin datos personales.
        $this->assertSame(['preferencias' => ['movilidad' => 'diario', 'marcas_evitar' => ['HP']], 'laptop_ids' => [$a, $b]], $this->enviado);
    }

    public function test_sin_sesion_o_sin_cuestionario_no_recomienda_nada()
    {
        $ids = $this->laptops();
        $this->motor(['version' => 'v0', 'afinidades' => []]);

        $this->postJson('/api/comparador/afinidad', ['laptop_ids' => $ids])->assertExactJson(['disponible' => false]);

        $omitio = User::factory()->create();
        PreferenciaCliente::create(['user_id' => $omitio->id, 'movilidad' => 'diario', 'omitido_at' => now()]);
        $this->actingAs($omitio)->postJson('/api/comparador/afinidad', ['laptop_ids' => $ids])->assertExactJson(['disponible' => false]);

        $this->assertFalse($this->llamado);
    }

    public function test_si_el_motor_falla_el_comparador_queda_como_siempre()
    {
        $ids = $this->laptops();
        $user = $this->conCuestionario();

        $this->motor(null);
        $this->actingAs($user)->postJson('/api/comparador/afinidad', ['laptop_ids' => $ids])->assertExactJson(['disponible' => false]);

        $this->motor(['version' => 'v0', 'error' => 'sin_preferencias', 'mensaje' => 'x']);
        $this->actingAs($user)->postJson('/api/comparador/afinidad', ['laptop_ids' => $ids])->assertExactJson(['disponible' => false]);
    }

    public function test_valida_las_laptops_a_comparar()
    {
        [$a] = $this->laptops();
        $this->motor(['version' => 'v0', 'afinidades' => []]);

        $this->postJson('/api/comparador/afinidad', ['laptop_ids' => [$a]])->assertJsonValidationErrors('laptop_ids');
        $this->postJson('/api/comparador/afinidad', ['laptop_ids' => [$a, 999]])->assertJsonValidationErrors('laptop_ids.1');
    }
}
