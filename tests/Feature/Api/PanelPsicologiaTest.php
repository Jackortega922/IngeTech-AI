<?php

namespace Tests\Feature\Api;

use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\PreferenciaCliente;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelPsicologiaTest extends TestCase
{
    use RefreshDatabase;

    private function cliente(array $respuestas, bool $completo = true): User
    {
        $u = User::factory()->create(['rol' => 'cliente']);
        PreferenciaCliente::create(['user_id' => $u->id, ...$respuestas, $completo ? 'completado_at' : 'omitido_at' => now()]);

        return $u;
    }

    public function test_resume_el_cuestionario_sin_datos_personales()
    {
        $this->cliente(['movilidad' => 'diario', 'molestias' => ['pesada', 'se_congela'], 'prioridades' => ['portabilidad', 'precio'], 'marcas_evitar' => ['HP']]);
        $this->cliente(['movilidad' => 'diario', 'molestias' => ['pesada'], 'prioridades' => ['precio', 'portabilidad']]);
        $this->cliente(['movilidad' => 'fija'], completo: false); // lo omitió: no cuenta
        User::factory()->create(['rol' => 'ventas', 'name' => 'Vera']); // personal: no cuenta

        $r = $this->actingAs(User::factory()->create(['rol' => 'admin']))->getJson('/api/admin/psicologia')->assertOk();

        $r->assertJsonPath('clientes', 3)->assertJsonPath('completaron', 2)->assertJsonPath('omitieron', 1);
        $preguntas = collect($r->json('preguntas'))->keyBy('clave');
        $this->assertSame(2, collect($preguntas['movilidad']['opciones'])->firstWhere('valor', 'diario')['cantidad']);
        // Múltiple: ordenada de la más marcada a la menos.
        $this->assertSame(['pesada', 2], [$preguntas['molestias']['opciones'][0]['valor'], $preguntas['molestias']['opciones'][0]['cantidad']]);
        // Orden (Borda): las dos aparecen 1.ª y 2.ª una vez -> empate en puntos, 1 vez primero cada una.
        $prioridades = collect($preguntas['prioridades']['opciones'])->keyBy('valor');
        $this->assertSame($prioridades['precio']['puntos'], $prioridades['portabilidad']['puntos']);
        $this->assertSame(1, $prioridades['precio']['primero']);
        $this->assertSame(1, collect($preguntas['marcas']['evitadas'])->firstWhere('valor', 'HP')['cantidad']);
        // Nunca nombres ni correos.
        $this->assertStringNotContainsString('@', json_encode($r->json()));
    }

    public function test_mide_si_eligen_la_primera_recomendacion_segun_como_deciden()
    {
        $laptop = Laptop::forceCreate([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'x', 'ram_gb' => 8,
            'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false, 'precio_soles' => 2000,
        ]);
        $consulta = function (User $u, ?int $elige) use ($laptop) {
            $perfil = PerfilUsuario::create([
                'user_id' => $u->id, 'carrera' => 'x', 'nivel_experiencia' => 'basico',
                'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
            ]);
            $recs = collect([90, 80, 70])->map(fn ($pct) => Recomendacion::create([
                'perfil_usuario_id' => $perfil->id, 'laptop_id' => $laptop->id, 'compatibilidad_pct' => $pct, 'explicacion' => [],
            ]));
            if ($elige) {
                EventoAnalitica::create(['tipo' => 'eleccion_recomendacion', 'recomendacion_id' => $recs[$elige - 1]->id, 'payload' => []]);
            }
        };

        $clara = $this->cliente(['estilo_decision' => 'la_mejor']);
        $consulta($clara, 1);
        $consulta($clara, 1);
        $compara = $this->cliente(['estilo_decision' => 'comparar']);
        $consulta($compara, 3);
        $consulta($compara, null); // consultó y no eligió

        $estilos = collect(
            $this->actingAs(User::factory()->create(['rol' => 'ventas']))->getJson('/api/admin/psicologia')->json('confianza.por_estilo')
        )->keyBy('valor');

        $this->assertEquals([2, 2, 2, 1], array_values(array_intersect_key($estilos['la_mejor'], array_flip(['consultas', 'eligieron', 'eligio_la_primera', 'posicion_promedio']))));
        $this->assertSame(2, $estilos['comparar']['consultas']);
        $this->assertSame(1, $estilos['comparar']['eligieron']);
        $this->assertSame(0, $estilos['comparar']['eligio_la_primera']);
        $this->assertEquals(3, $estilos['comparar']['posicion_promedio']);
    }
}
