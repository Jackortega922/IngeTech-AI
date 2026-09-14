<?php

namespace Tests\Feature;

use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Personalizacion;
use App\Models\Recomendacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecomendacionRelacionesTest extends TestCase
{
    use RefreshDatabase;

    public function test_una_recomendacion_resuelve_sus_relaciones()
    {
        $laptop = Laptop::factory()->create();
        $perfil = PerfilUsuario::factory()->create();

        $recomendacion = Recomendacion::create([
            'perfil_usuario_id' => $perfil->id,
            'laptop_id' => $laptop->id,
            'compatibilidad_pct' => 87,
            'explicacion' => ['factores' => [['criterio' => 'RAM suficiente', 'aporte' => 25]]],
        ]);

        $personalizacion = Personalizacion::create([
            'recomendacion_id' => $recomendacion->id,
            'ram_gb' => 16,
            'almacenamiento_gb' => 512,
            'precio_total' => 3899.00,
        ]);

        $this->assertTrue($recomendacion->laptop->is($laptop));
        $this->assertTrue($recomendacion->perfilUsuario->is($perfil));
        $this->assertTrue($recomendacion->personalizacion->is($personalizacion));
        $this->assertSame(['criterio' => 'RAM suficiente', 'aporte' => 25], $recomendacion->explicacion['factores'][0]);
    }
}
