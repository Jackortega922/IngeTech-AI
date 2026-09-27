<?php

namespace Tests\Feature\Api;

use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EleccionTest extends TestCase
{
    use RefreshDatabase;

    private function recomendacionDe(User $dueno): Recomendacion
    {
        $perfil = PerfilUsuario::create([
            'user_id' => $dueno->id, 'carrera' => 'Ingeniería de Sistemas', 'nivel_experiencia' => 'intermedio',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 4000, 'portabilidad' => 'cualquiera',
        ]);
        $laptop = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);

        return Recomendacion::create([
            'perfil_usuario_id' => $perfil->id, 'laptop_id' => $laptop->id, 'compatibilidad_pct' => 87,
            'explicacion' => ['badges' => ['Mejor Opción Económica']],
        ]);
    }

    public function test_registra_la_eleccion_con_la_opcion_elegida()
    {
        $dueno = User::factory()->create();
        $recomendacion = $this->recomendacionDe($dueno);

        $this->actingAs($dueno)
            ->postJson("/api/recomendaciones/{$recomendacion->id}/eleccion")
            ->assertNoContent();

        $evento = EventoAnalitica::where('tipo', 'eleccion_recomendacion')->sole();
        $this->assertSame($recomendacion->id, $evento->recomendacion_id);
        $this->assertSame(['Mejor Opción Económica'], $evento->payload['badges']);
    }

    public function test_nadie_puede_registrar_la_eleccion_de_otra_persona()
    {
        // Si no se verificara el dueño, cualquiera podría inflar los KPIs con elecciones falsas.
        $recomendacion = $this->recomendacionDe(User::factory()->create());

        $this->actingAs(User::factory()->create())
            ->postJson("/api/recomendaciones/{$recomendacion->id}/eleccion")
            ->assertForbidden();

        $this->assertDatabaseMissing('eventos_analitica', ['tipo' => 'eleccion_recomendacion']);
    }

    public function test_un_invitado_no_puede_registrar_elecciones()
    {
        $recomendacion = $this->recomendacionDe(User::factory()->create());

        $this->postJson("/api/recomendaciones/{$recomendacion->id}/eleccion")->assertUnauthorized();
    }
}
