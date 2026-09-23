<?php

namespace Tests\Feature\Api;

use App\Models\Accesorio;
use App\Models\Carrera;
use App\Models\Kit;
use App\Models\Laptop;
use App\Models\Software;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogoTest extends TestCase
{
    use RefreshDatabase;

    public function test_devuelve_carreras_software_hardware_kits_y_accesorios()
    {
        $carrera = Carrera::create(['clave' => 'ing_sistemas', 'nombre' => 'Ingeniería de Sistemas', 'facultad' => 'Ingeniería']);
        $software = Software::create([
            'clave' => 'vscode', 'nombre' => 'VS Code', 'categoria' => 'Desarrollo',
            'min_ram_gb' => 4, 'min_cpu_score' => 20, 'min_gpu_dedicada' => false,
            'rec_ram_gb' => 8, 'rec_cpu_score' => 30, 'rec_gpu_dedicada' => false,
        ]);
        $carrera->software()->attach($software->id);

        Laptop::create([
            'marca' => 'Acer', 'modelo' => 'Aspire 5', 'tipo' => 'laptop', 'cpu' => 'Ryzen 5',
            'ram_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD',
            'gpu' => 'integrada', 'gpu_dedicada' => false, 'precio_soles' => 2399, 'rendimiento_score' => 55,
        ]);

        $accesorio = Accesorio::create(['nombre' => 'Mouse', 'tipo' => 'mouse', 'precio_soles' => 45]);
        $kit = Kit::create(['nombre' => 'Kit Estudiante', 'precio_soles' => 149]);
        $kit->accesorios()->attach($accesorio->id);

        $this->getJson('/api/catalogos')
            ->assertOk()
            ->assertJsonStructure([
                'carreras' => [['clave', 'nombre', 'facultad', 'software']],
                'software' => [['clave', 'nombre', 'categoria', 'min_ram_gb', 'rec_ram_gb']],
                'hardware' => [['id', 'marca', 'modelo', 'tipo', 'precio_soles']],
                'accesorios' => [['id', 'nombre', 'tipo', 'precio_soles']],
                'kits' => [['id', 'nombre', 'precio_soles', 'accesorios']],
            ])
            ->assertJsonPath('carreras.0.clave', 'ing_sistemas')
            ->assertJsonPath('kits.0.nombre', 'Kit Estudiante');
    }
}
