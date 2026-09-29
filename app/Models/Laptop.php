<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laptop extends Model
{
    use HasFactory;

    // Claves válidas de la columna `puertos` (las etiquetas legibles están en el frontend).
    public const PUERTOS = ['usb_a', 'usb_c', 'usb_c_carga', 'thunderbolt', 'hdmi', 'lector_sd', 'ethernet'];

    protected $fillable = [
        'marca',
        'modelo',
        'descripcion',
        'imagen_url',
        'tipo',
        'cpu',
        'ram_gb',
        'ram_ampliable_gb',
        'almacenamiento_gb',
        'almacenamiento_tipo',
        'gpu',
        'gpu_dedicada',
        'bateria_horas',
        'pantalla_pulgadas',
        'pantalla_resolucion',
        'pantalla_hz',
        'peso_kg',
        'puertos',
        'precio_soles',
        'tienda',
        'rendimiento_score',
    ];

    protected function casts(): array
    {
        return [
            'precio_soles' => 'decimal:2',
            'gpu_dedicada' => 'boolean',
            'pantalla_pulgadas' => 'float',
            'peso_kg' => 'float',
            'puertos' => 'array',
        ];
    }

    public function recomendaciones(): HasMany
    {
        return $this->hasMany(Recomendacion::class);
    }
}
