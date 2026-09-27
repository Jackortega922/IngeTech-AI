<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ProxyHttpsTest extends TestCase
{
    /**
     * En producción el TLS termina en el proxy de la plataforma (Render), que reenvía la
     * petición al contenedor por HTTP plano e indica el esquema original en X-Forwarded-Proto.
     * Si Laravel no confía en esa cabecera, genera los enlaces de los assets como http://
     * dentro de una página servida por https:// — el navegador los bloquea por mixed content
     * y la aplicación queda en blanco.
     */
    public function test_genera_enlaces_https_cuando_el_proxy_lo_indica()
    {
        Route::get('/_esquema', fn () => url('/build/assets/demo.js'));

        $enlace = $this->withServerVariables(['HTTP_X_FORWARDED_PROTO' => 'https'])
            ->get('/_esquema')
            ->assertOk()
            ->getContent();

        $this->assertStringStartsWith('https://', $enlace);
    }

    public function test_sigue_usando_http_cuando_no_hay_proxy()
    {
        Route::get('/_esquema', fn () => url('/build/assets/demo.js'));

        $enlace = $this->get('/_esquema')->assertOk()->getContent();

        $this->assertStringStartsWith('http://', $enlace);
    }
}
