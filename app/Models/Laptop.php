<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laptop extends Model
{
    use HasFactory;

    protected $fillable = [
        'marca',
        'modelo',
        'descripcion',
        'tipo',
        'cpu',
        'ram_gb',
        'ram_ampliable_gb',
        'almacenamiento_gb',
        'almacenamiento_tipo',
        'gpu',
        'gpu_dedicada',
        'bateria_horas',
        'precio_soles',
        'tienda',
        'rendimiento_score',
    ];

    protected function casts(): array
    {
        return [
            'precio_soles' => 'decimal:2',
            'gpu_dedicada' => 'boolean',
        ];
    }

    public function recomendaciones(): HasMany
    {
        return $this->hasMany(Recomendacion::class);
    }
}
