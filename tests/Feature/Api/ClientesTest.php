<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Reclamo;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientesTest extends TestCase
{
    use RefreshDatabase;

    private Laptop $laptop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->laptop = Laptop::forceCreate([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2399, 'rendimiento_score' => 55, 'stock' => 10,
        ]);
    }

    private function comprar(string $email, string $nombre = 'Rosa Quispe'): string
    {
        return $this->postJson('/api/pedidos', [
            'laptop_id' => $this->laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => $nombre, 'email' => $email, 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->assertCreated()->json('codigo');
    }

    private function consultar(User $cliente, string $carrera, ?string $cargo = null): PerfilUsuario
    {
        $perfil = PerfilUsuario::create([
            'user_id' => $cliente->id, 'carrera' => $carrera, 'cargo' => $cargo, 'nivel_experiencia' => 'basico',
            'actividades' => [], 'software' => [], 'presupuesto_soles' => 3000, 'portabilidad' => 'cualquiera',
        ]);
        Recomendacion::create(['perfil_usuario_id' => $perfil->id, 'laptop_id' => $this->laptop->id, 'compatibilidad_pct' => 91, 'explicacion' => []]);

        return $perfil;
    }

    public function test_resume_a_los_clientes_y_lo_que_hizo_cada_uno()
    {
        $compradora = User::factory()->create(['name' => 'Ana Flores', 'email' => 'ana@correo.test']);
        $this->consultar($compradora, 'Ingeniería de Sistemas');
        $this->actingAs($compradora);
        $this->comprar('ana@correo.test', 'Ana Flores');

        $curioso = User::factory()->create(['name' => 'Luis Ramos', 'created_at' => now()->subDays(60)]);
        $this->consultar($curioso, 'Independiente / Freelance', 'Diseñador gráfico');
        // Consulta más reciente (mayor id): la tabla muestra esta, no la primera.
        $this->consultar($curioso, 'Emprendimiento / Negocio Propio', 'Dueño de bodega');

        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/clientes')
            ->assertOk()
            ->assertJsonPath('resumen.registrados', 2)
            ->assertJsonPath('resumen.nuevos_30_dias', 1)
            ->assertJsonPath('resumen.con_compras', 1)
            ->assertJsonPath('resumen.solo_consultan', 1)
            ->assertJsonFragment(['nombre' => 'Ana Flores', 'compras' => 1, 'gasto' => 2399, 'recomendaciones' => 1, 'telefono' => '987654321'])
            ->assertJsonFragment(['nombre' => 'Luis Ramos', 'compras' => 0, 'recomendaciones' => 2, 'cargo' => 'Dueño de bodega'])
            ->assertJsonMissing(['cargo' => 'Diseñador gráfico']);
    }

    public function test_quienes_compraron_sin_cuenta_se_agrupan_por_correo()
    {
        $this->comprar('rosa@correo.test');
        $this->comprar('ROSA@correo.test');
        // Si después se creó una cuenta con ese correo, ya no se lista como "sin cuenta".
        $this->comprar('ana@correo.test', 'Ana Flores');
        User::factory()->create(['email' => 'ana@correo.test']);

        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson('/api/admin/clientes')
            ->assertOk()
            ->assertJsonPath('resumen.invitados', 1)
            ->assertJsonPath('invitados.0.email', 'rosa@correo.test')
            ->assertJsonPath('invitados.0.compras', 2)
            ->assertJsonPath('invitados.0.gasto', 4798);
    }

    public function test_la_ficha_muestra_consultas_pedidos_y_reclamos_pero_no_el_cuestionario()
    {
        $cliente = User::factory()->create(['name' => 'Ana Flores', 'email' => 'ana@correo.test']);
        $this->consultar($cliente, 'Ingeniería de Sistemas');
        $cliente->preferencias()->create(['para_quien' => 'yo', 'completado_at' => now()]);
        $this->actingAs($cliente);
        $codigo = $this->comprar('ana@correo.test', 'Ana Flores');
        Reclamo::create([
            'user_id' => $cliente->id, 'tipo' => 'reclamo', 'nombre' => 'Ana Flores', 'tipo_documento' => 'DNI', 'numero_documento' => '45678912',
            'domicilio' => 'x', 'email' => 'ana@correo.test', 'bien' => 'producto', 'descripcion_bien' => 'x', 'detalle' => 'x', 'pedido_consumidor' => 'x',
        ]);

        $this->actingAs(User::factory()->create(['is_admin' => true]))->getJson("/api/admin/clientes/{$cliente->id}")
            ->assertOk()
            ->assertJsonPath('cuestionario', true)
            ->assertJsonPath('consultas.0.mejor_opcion', 'Acer Aspire 5')
            ->assertJsonPath('consultas.0.compatibilidad', 91)
            ->assertJsonPath('pedidos.0.codigo', $codigo)
            ->assertJsonPath('pedidos.0.laptop', 'Acer Aspire 5')
            ->assertJsonPath('reclamos.0.tipo', 'reclamo')
            ->assertJsonMissingPath('para_quien');
    }

    public function test_la_ficha_de_quien_compro_sin_cuenta()
    {
        $codigo = $this->comprar('rosa@correo.test');
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->getJson('/api/admin/clientes/invitado?email=Rosa@correo.test')
            ->assertOk()
            ->assertJsonPath('pedidos.0.codigo', $codigo);
        $this->actingAs($admin)->getJson('/api/admin/clientes/invitado?email=nadie@correo.test')->assertNotFound();
    }

    public function test_la_ficha_es_solo_de_clientes_y_solo_para_quien_tiene_permiso()
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $cliente = User::factory()->create();

        $this->actingAs($admin)->getJson("/api/admin/clientes/{$admin->id}")->assertNotFound();
        $this->actingAs(User::factory()->create(['rol' => 'almacen']))->getJson("/api/admin/clientes/{$cliente->id}")->assertForbidden();
        $this->actingAs(User::factory()->create(['rol' => 'ventas']))->getJson("/api/admin/clientes/{$cliente->id}")->assertOk();
    }
}
