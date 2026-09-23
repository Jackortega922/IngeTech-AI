<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistorialTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_invitado_no_puede_ver_el_historial()
    {
        $this->getJson('/api/mis-recomendaciones')->assertUnauthorized();
    }

    public function test_el_usuario_solo_ve_su_propio_historial()
    {
        $yo = User::factory()->create();
        $otro = User::factory()->create();

        $laptop = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);

        $miPerfil = PerfilUsuario::create([
            'user_id' => $yo->id, 'carrera' => 'Ingeniería de Sistemas', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
        ]);
        Recomendacion::create(['perfil_usuario_id' => $miPerfil->id, 'laptop_id' => $laptop->id, 'compatibilidad_pct' => 80, 'explicacion' => ['badges' => ['Opción Equilibrada']]]);

        PerfilUsuario::create([
            'user_id' => $otro->id, 'carrera' => 'Ingeniería Civil', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
        ]);

        $this->actingAs($yo)
            ->getJson('/api/mis-recomendaciones')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.carrera', 'Ingeniería de Sistemas')
            ->assertJsonPath('0.recomendaciones.0.laptop.id', $laptop->id);
    }
}
