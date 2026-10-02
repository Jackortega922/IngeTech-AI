<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Las pruebas no dependen de los assets compilados por Vite.
        $this->withoutVite();

        // Inertia busca las páginas en js/Pages (con mayúscula) por defecto, y la carpeta del
        // proyecto es js/pages. En Windows da igual, pero en Linux (la CI) assertInertia()
        // decía que las páginas "no existen".
        config(['inertia.testing.page_paths' => [resource_path('js/pages')]]);
    }
}
