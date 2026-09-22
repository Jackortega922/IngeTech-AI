<?php

namespace Tests\Feature\Api;

use App\Models\Carrera;
use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\Software;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private function comoAdmin(): self
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));

        return $this;
    }

    public function test_un_usuario_normal_no_puede_entrar_al_api_de_admin()
    {
        $this->actingAs(User::factory()->create(['is_admin' => false]));

        $this->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_un_invitado_no_puede_entrar_al_api_de_admin()
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_crea_actualiza_y_elimina_un_equipo()
    {
        $this->comoAdmin();

        $payload = [
            'marca' => 'Lenovo', 'modelo' => 'Legion 5', 'descripcion' => 'Equipo de prueba', 'tipo' => 'laptop', 'cpu' => 'Ryzen 7',
            'rendimiento_score' => 90, 'ram_gb' => 32, 'ram_ampliable_gb' => 32,
            'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'RTX 4070', 'gpu_dedicada' => true, 'bateria_horas' => 5,
            'precio_soles' => 6499, 'tienda' => 'Tienda X',
        ];

        $id = $this->postJson('/api/admin/hardware', $payload)
            ->assertCreated()
            ->json('id');

        $this->putJson("/api/admin/hardware/{$id}", array_merge($payload, ['precio_soles' => 5999]))
            ->assertOk()
            ->assertJsonPath('precio_soles', '5999.00');

        $this->deleteJson("/api/admin/hardware/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('laptops', ['id' => $id]);
    }

    public function test_crea_actualiza_y_elimina_software()
    {
        $this->comoAdmin();

        $payload = [
            'clave' => 'nuevo_sw', 'nombre' => 'Nuevo Software', 'descripcion' => 'Descripción de prueba', 'categoria' => 'General',
            'min_ram_gb' => 4, 'min_cpu_score' => 20, 'min_gpu_dedicada' => false,
            'rec_ram_gb' => 8, 'rec_cpu_score' => 30, 'rec_gpu_dedicada' => false,
        ];

        $id = $this->postJson('/api/admin/software', $payload)->assertCreated()->json('id');

        $this->putJson("/api/admin/software/{$id}", array_merge($payload, ['nombre' => 'Editado']))
            ->assertOk()->assertJsonPath('nombre', 'Editado');

        $this->deleteJson("/api/admin/software/{$id}")->assertNoContent();
    }

    public function test_crea_una_carrera_con_su_software_asociado()
    {
        $this->comoAdmin();

        $sw = Software::create([
            'clave' => 'office', 'nombre' => 'Office', 'categoria' => 'Ofimática',
            'min_ram_gb' => 4, 'min_cpu_score' => 15, 'min_gpu_dedicada' => false,
            'rec_ram_gb' => 8, 'rec_cpu_score' => 25, 'rec_gpu_dedicada' => false,
        ]);

        $response = $this->postJson('/api/admin/carreras', [
            'clave' => 'nueva_carrera', 'nombre' => 'Nueva Carrera', 'facultad' => 'Test',
            'software_claves' => ['office'],
        ])->assertCreated();

        $this->assertCount(1, $response->json('software'));
    }

    public function test_dashboard_agrupa_consultas_por_carrera_y_presupuesto_y_cuenta_catalogos()
    {
        $this->comoAdmin();

        Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);
        User::factory()->create(['is_admin' => false]);

        EventoAnalitica::create(['tipo' => 'consulta_recomendacion', 'payload' => ['carrera_clave' => 'ing_sistemas', 'presupuesto_soles' => 1500]]);
        EventoAnalitica::create(['tipo' => 'consulta_recomendacion', 'payload' => ['carrera_clave' => 'ing_sistemas', 'presupuesto_soles' => 5000]]);

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('total_consultas', 2)
            ->assertJsonPath('total_equipos', 1)
            ->assertJsonPath('total_usuarios', 1)
            ->assertJsonPath('por_carrera.ing_sistemas', 2);
    }

    public function test_lista_clientes_con_su_cantidad_de_recomendaciones()
    {
        $this->comoAdmin();

        $estudiante = User::factory()->create(['is_admin' => false, 'name' => 'Juan Pérez']);
        \App\Models\PerfilUsuario::create([
            'user_id' => $estudiante->id, 'carrera' => 'Ingeniería de Sistemas', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
        ]);

        $this->getJson('/api/admin/clientes')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Juan Pérez', 'perfiles_count' => 1]);
    }
}
