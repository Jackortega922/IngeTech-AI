<?php

namespace Tests\Feature\Api;

use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
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

        $this->putJson("/api/admin/hardware/{$id}", array_merge($payload, ['precio_soles' => 5999, 'imagen_url' => 'https://tienda.test/foto.jpg']))
            ->assertOk()
            ->assertJsonPath('precio_soles', '5999.00')
            ->assertJsonPath('imagen_url', 'https://tienda.test/foto.jpg');

        $this->deleteJson("/api/admin/hardware/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('laptops', ['id' => $id]);
    }

    public function test_rechaza_un_enlace_de_imagen_que_no_es_una_url_valida()
    {
        $this->comoAdmin();

        $payload = [
            'marca' => 'Lenovo', 'modelo' => 'Legion 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 7',
            'rendimiento_score' => 90, 'ram_gb' => 32, 'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD',
            'gpu_dedicada' => true, 'precio_soles' => 6499, 'imagen_url' => 'no-es-una-url',
        ];

        $this->postJson('/api/admin/hardware', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('imagen_url');
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

    public function test_dashboard_mide_la_calidad_de_la_recomendacion()
    {
        $this->comoAdmin();
        $laptop = Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);

        // 3 consultas: 2 con resultado y 1 sin opciones en el presupuesto -> cobertura 66,7 %.
        foreach (['ok', 'ok', 'sin_resultados'] as $resultado) {
            EventoAnalitica::create(['tipo' => 'consulta_recomendacion', 'payload' => ['resultado' => $resultado]]);
        }

        $this->travelTo(now()->startOfMinute());
        $crear = function (int $compatibilidad, string $badge) use ($laptop) {
            $perfil = PerfilUsuario::create([
                'carrera' => 'Ingeniería de Sistemas', 'nivel_experiencia' => 'basico',
                'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
            ]);

            return Recomendacion::create([
                'perfil_usuario_id' => $perfil->id, 'laptop_id' => $laptop->id,
                'compatibilidad_pct' => $compatibilidad, 'explicacion' => ['badges' => [$badge]],
            ]);
        };
        $deAna = $crear(80, 'Mejor Opción Económica');
        $deBeto = $crear(100, 'Mejor Rendimiento');

        $elegir = fn (Recomendacion $r) => EventoAnalitica::create([
            'tipo' => 'eleccion_recomendacion', 'recomendacion_id' => $r->id, 'payload' => ['badges' => $r->explicacion['badges']],
        ]);
        $this->travel(60)->seconds();
        $elegir($deAna);
        $this->travel(60)->seconds();
        $elegir($deBeto);
        // Ana vuelve atrás y elige de nuevo: no debe contar doble ni alterar su tiempo.
        $this->travel(180)->seconds();
        $elegir($deAna);

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('calidad.cobertura_pct', 66.7)
            ->assertJsonPath('calidad.compatibilidad_promedio', 90)
            ->assertJsonPath('calidad.perfiles_con_eleccion', 2)
            ->assertJsonPath('calidad.tasa_eleccion_pct', 100)
            ->assertJsonPath('calidad.tiempo_decision_mediana_seg', 90)
            ->assertJsonPath('calidad.elecciones_por_opcion', [
                'Mejor Opción Económica' => 1,
                'Opción Equilibrada' => 0,
                'Mejor Rendimiento' => 1,
            ]);
    }

    public function test_sin_datos_los_indicadores_quedan_vacios_y_no_en_cero()
    {
        // Un 0 % se leería como "la IA recomienda mal"; sin muestra, lo correcto es "sin dato".
        $this->comoAdmin();

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('calidad.cobertura_pct', null)
            ->assertJsonPath('calidad.tasa_eleccion_pct', null)
            ->assertJsonPath('calidad.tiempo_decision_mediana_seg', null)
            ->assertJsonPath('calidad.compatibilidad_promedio', null);
    }

    public function test_contabilidad_calcula_ingreso_potencial_y_ticket_promedio()
    {
        $this->comoAdmin();

        $perfil = PerfilUsuario::create([
            'carrera' => 'Ingeniería de Sistemas', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
        ]);
        $barata = Laptop::create([
            'marca' => 'HP', 'modelo' => '15 Laptop', 'tipo' => 'laptop', 'cpu' => 'i3',
            'ram_gb' => 8, 'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 1000, 'rendimiento_score' => 38,
        ]);
        $cara = Laptop::create([
            'marca' => 'Lenovo', 'modelo' => 'Legion 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 7',
            'ram_gb' => 32, 'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'RTX 4070', 'gpu_dedicada' => true, 'precio_soles' => 3000, 'rendimiento_score' => 94,
        ]);
        Recomendacion::create(['perfil_usuario_id' => $perfil->id, 'laptop_id' => $barata->id, 'compatibilidad_pct' => 80, 'explicacion' => []]);
        Recomendacion::create(['perfil_usuario_id' => $perfil->id, 'laptop_id' => $cara->id, 'compatibilidad_pct' => 95, 'explicacion' => []]);

        $this->getJson('/api/admin/contabilidad')
            ->assertOk()
            ->assertJsonPath('ingreso_potencial_total', 4000)
            ->assertJsonPath('ticket_promedio', 2000)
            ->assertJsonPath('total_recomendaciones', 2)
            ->assertJsonPath('por_rango_precio.< S/2,000', 1)
            ->assertJsonPath('por_rango_precio.S/2,000–4,000', 1);
    }

    public function test_lista_clientes_con_su_cantidad_de_recomendaciones()
    {
        $this->comoAdmin();

        $estudiante = User::factory()->create(['is_admin' => false, 'name' => 'Juan Pérez']);
        PerfilUsuario::create([
            'user_id' => $estudiante->id, 'carrera' => 'Ingeniería de Sistemas', 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
        ]);

        $this->getJson('/api/admin/clientes')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Juan Pérez', 'perfiles_count' => 1]);
    }

    public function test_lista_clientes_muestra_la_carrera_y_el_cargo_de_su_ultima_consulta()
    {
        $this->comoAdmin();
        $cliente = User::factory()->create(['is_admin' => false]);

        PerfilUsuario::create([
            'user_id' => $cliente->id, 'carrera' => 'Independiente / Freelance', 'cargo' => 'Diseñador gráfico',
            'nivel_experiencia' => 'basico', 'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000,
            'portabilidad' => 'cualquiera',
        ]);
        // Consulta más reciente (mayor id): debe mostrarse esta, no la primera.
        PerfilUsuario::create([
            'user_id' => $cliente->id, 'carrera' => 'Emprendimiento / Negocio Propio', 'cargo' => 'Dueño de bodega',
            'nivel_experiencia' => 'basico', 'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000,
            'portabilidad' => 'cualquiera',
        ]);

        $this->getJson('/api/admin/clientes')
            ->assertOk()
            ->assertJsonFragment(['carrera' => 'Emprendimiento / Negocio Propio', 'cargo' => 'Dueño de bodega'])
            ->assertJsonMissing(['cargo' => 'Diseñador gráfico']);
    }
}
