<?php

namespace Tests\Feature\Api;

use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RolesTest extends TestCase
{
    use RefreshDatabase;

    private function con(string $rol): User
    {
        return User::factory()->create(['rol' => $rol]);
    }

    private function pedido(): Pedido
    {
        $laptop = Laptop::forceCreate([
            'stock' => 5, 'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5', 'ram_gb' => 16,
            'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu_dedicada' => false,
            'precio_soles' => 2360, 'rendimiento_score' => 55,
        ]);
        $codigo = $this->postJson('/api/pedidos', [
            'laptop_id' => $laptop->id, 'ram_gb' => 16, 'almacenamiento_gb' => 512, 'accesorio_ids' => [],
            'nombre' => 'Rosa Quispe', 'email' => 'rosa@correo.test', 'telefono' => '987654321',
            'departamento' => 'Lima', 'ciudad' => 'Miraflores', 'direccion' => 'Av. Larco 100',
            'pago' => ['marca' => 'visa', 'ultimos4' => '4242'], 'acepta_terminos' => true,
        ])->json('codigo');
        $this->flushSession();

        return Pedido::where('codigo', $codigo)->first();
    }

    public static function matriz(): array
    {
        // [rol, endpoint, código esperado]
        return [
            'ventas ve pedidos' => ['ventas', '/api/admin/pedidos', 200],
            'ventas ve reclamos' => ['ventas', '/api/admin/reclamos', 200],
            'ventas no ve inventario' => ['ventas', '/api/admin/inventario', 403],
            'ventas no ve contabilidad' => ['ventas', '/api/admin/contabilidad', 403],
            'almacén ve inventario' => ['almacen', '/api/admin/inventario', 200],
            'almacén no ve pedidos' => ['almacen', '/api/admin/pedidos', 403],
            'almacén no ve clientes' => ['almacen', '/api/admin/clientes', 403],
            'contabilidad ve contabilidad' => ['contabilidad', '/api/admin/contabilidad', 200],
            'contabilidad ve pedidos' => ['contabilidad', '/api/admin/pedidos', 200],
            'contabilidad no ve reclamos' => ['contabilidad', '/api/admin/reclamos', 403],
            'solo el admin gestiona usuarios' => ['ventas', '/api/admin/usuarios', 403],
            'el admin ve todo' => ['admin', '/api/admin/usuarios', 200],
            'un cliente no entra' => ['cliente', '/api/admin/dashboard', 403],
        ];
    }

    #[DataProvider('matriz')]
    public function test_cada_rol_ve_solo_sus_secciones(string $rol, string $url, int $esperado)
    {
        $this->actingAs($this->con($rol))->getJson($url)->assertStatus($esperado);
    }

    public function test_contabilidad_ve_los_pedidos_pero_no_les_cambia_el_estado()
    {
        $pedido = $this->pedido();

        $this->actingAs($this->con('contabilidad'))->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'cancelado'])->assertForbidden();
        $this->actingAs($this->con('ventas'))->patchJson("/api/admin/pedidos/{$pedido->id}", ['estado' => 'preparando'])->assertOk();
    }

    public function test_la_boleta_la_ve_el_personal_de_pedidos_y_no_almacen()
    {
        $pedido = $this->pedido();

        $this->actingAs($this->con('contabilidad'))->get("/pedido/{$pedido->codigo}/boleta")->assertOk();
        $this->actingAs($this->con('almacen'))->get("/pedido/{$pedido->codigo}/boleta")->assertNotFound();
    }

    public function test_el_personal_entra_al_panel_y_recibe_sus_permisos()
    {
        $this->actingAs($this->con('almacen'))->get('/dashboard')->assertRedirect('/admin');
        $this->get('/admin')->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.es_personal', true)
            ->where('auth.user.is_admin', false)
            ->where('auth.permisos', ['dashboard', 'inventario', 'hardware']));
    }

    public function test_el_admin_asigna_y_quita_roles_pero_no_el_suyo()
    {
        $admin = $this->con('admin');
        $juana = User::factory()->create(['email' => 'juana@correo.test']);

        $this->actingAs($admin)->postJson('/api/admin/usuarios/rol', ['email' => 'juana@correo.test', 'rol' => 'almacen'])
            ->assertOk()->assertJsonPath('rol', 'almacen');
        $this->assertTrue($juana->fresh()->puede('inventario'));

        $this->postJson('/api/admin/usuarios/rol', ['email' => 'juana@correo.test', 'rol' => 'cliente'])->assertOk();
        $this->assertFalse($juana->fresh()->es_personal);

        $this->postJson('/api/admin/usuarios/rol', ['email' => $admin->email, 'rol' => 'ventas'])->assertJsonValidationErrors('email');
        $this->postJson('/api/admin/usuarios/rol', ['email' => 'nadie@correo.test', 'rol' => 'ventas'])->assertJsonValidationErrors('email');
        $this->getJson('/api/admin/usuarios')->assertOk()->assertJsonCount(1, 'personal');
    }

    public function test_el_rol_no_se_puede_poner_desde_el_registro_ni_el_perfil()
    {
        $this->post('/register', [
            'name' => 'Intruso', 'email' => 'intruso@correo.test', 'password' => 'password', 'password_confirmation' => 'password', 'rol' => 'admin',
        ]);

        $this->assertSame('cliente', User::where('email', 'intruso@correo.test')->value('rol'));
    }
}
