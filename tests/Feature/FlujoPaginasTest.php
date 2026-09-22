<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlujoPaginasTest extends TestCase
{
    use RefreshDatabase;

    public function test_invitados_son_redirigidos_al_login_desde_perfil()
    {
        $this->get('/perfil')->assertRedirect('/login');
    }

    public function test_usuario_autenticado_puede_ver_las_paginas_del_flujo()
    {
        $this->actingAs(User::factory()->create(['is_admin' => false]));

        foreach (['/perfil', '/resultado', '/personalizar', '/software', '/hardware', '/comparador', '/preguntas'] as $ruta) {
            $this->get($ruta)->assertOk();
        }
    }

    public function test_un_usuario_normal_no_puede_ver_admin()
    {
        $this->actingAs(User::factory()->create(['is_admin' => false]));

        $this->get('/admin')->assertForbidden();
    }

    public function test_un_administrador_si_puede_ver_admin()
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));

        $this->get('/admin')->assertOk();
    }
}
