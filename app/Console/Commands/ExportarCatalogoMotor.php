<?php

namespace App\Console\Commands;

use App\Models\Laptop;
use App\Models\Software;
use Illuminate\Console\Command;

/**
 * Regenera ml-engine/data/laptops.json y software.json desde la BD, para que el motor califique
 * exactamente las mismas laptops (mismos IDs, precios y specs) y conozca los mismos programas, con
 * sus requisitos, que maneja Laravel.
 *
 * Antes esto se hacía a mano con tinker cada vez que cambiaba el seeder (tarea A14). Correrlo
 * después de `db:seed` o de editar el catálogo en el admin:
 *
 *     php artisan motor:exportar-catalogo
 */
class ExportarCatalogoMotor extends Command
{
    protected $signature = 'motor:exportar-catalogo
        {--ruta= : Archivo de laptops (por defecto ml-engine/data/laptops.json)}
        {--ruta-software= : Archivo de programas (por defecto ml-engine/data/software.json)}';

    protected $description = 'Exporta el catálogo de laptops al formato que lee el motor de recomendación';

    public function handle(): int
    {
        $laptops = Laptop::orderBy('id')->get()->map(fn (Laptop $l) => [
            'id' => $l->id,
            'marca' => $l->marca,
            'modelo' => $l->modelo,
            'cpu' => $l->cpu,
            // El motor llama cpu_score a lo que Laravel guarda como rendimiento_score.
            'cpu_score' => (int) $l->rendimiento_score,
            'ram_gb' => $l->ram_gb,
            'ram_ampliable_gb' => $l->ram_ampliable_gb,
            'almacenamiento_gb' => $l->almacenamiento_gb,
            'almacenamiento_tipo' => $l->almacenamiento_tipo,
            'gpu' => $l->gpu,
            'gpu_dedicada' => (bool) $l->gpu_dedicada,
            // Datos que usan las preferencias del cuestionario de bienvenida (B11).
            'bateria_horas' => $l->bateria_horas,
            'pantalla_pulgadas' => $l->pantalla_pulgadas,
            'pantalla_resolucion' => $l->pantalla_resolucion,
            'pantalla_hz' => $l->pantalla_hz,
            'peso_kg' => $l->peso_kg,
            'puertos' => $l->puertos ?? [],
            'precio_soles' => (float) $l->precio_soles,
            'tienda' => $l->tienda,
        ])->values();

        $ruta = $this->option('ruta') ?: base_path('ml-engine/data/laptops.json');
        file_put_contents($ruta, json_encode($laptops, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");

        $this->info("Exportadas {$laptops->count()} laptops a {$ruta}");

        // Programas con sus requisitos: el motor los usa para saber cuánta RAM, CPU y GPU pide
        // lo que el cliente dice que usa (no solo sus actividades).
        $software = Software::orderBy('clave')->get()->map(fn (Software $s) => [
            'clave' => $s->clave,
            'etiqueta' => $s->nombre,
            'categoria' => $s->categoria,
            'min_ram_gb' => $s->min_ram_gb,
            'min_cpu_score' => $s->min_cpu_score,
            'min_gpu_dedicada' => (bool) $s->min_gpu_dedicada,
            'rec_ram_gb' => $s->rec_ram_gb,
            'rec_cpu_score' => $s->rec_cpu_score,
            'rec_gpu_dedicada' => (bool) $s->rec_gpu_dedicada,
        ])->values();

        $rutaSoftware = $this->option('ruta-software') ?: base_path('ml-engine/data/software.json');
        file_put_contents($rutaSoftware, json_encode($software, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");

        $this->info("Exportados {$software->count()} programas a {$rutaSoftware}");

        return self::SUCCESS;
    }
}
