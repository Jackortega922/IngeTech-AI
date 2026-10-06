<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidacionEnEspanolTest extends TestCase
{
    use RefreshDatabase;

    public function test_los_errores_de_los_formularios_salen_en_espanol_y_con_el_nombre_del_campo()
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]))
            ->postJson('/api/admin/hardware', ['precio_soles' => -5])
            ->assertJsonPath('errors.marca.0', 'Falta la marca.')
            ->assertJsonPath('errors.ram_gb.0', 'Falta la RAM.')
            ->assertJsonPath('errors.precio_soles.0', 'El precio debe ser al menos 0.');
    }
}
