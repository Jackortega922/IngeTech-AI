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
        'cpu',
        'ram_gb',
        'ram_ampliable_gb',
        'almacenamiento_gb',
        'gpu',
        'precio_soles',
        'rendimiento_score',
    ];

    protected function casts(): array
    {
        return [
            'precio_soles' => 'decimal:2',
        ];
    }

    public function recomendaciones(): HasMany
    {
        return $this->hasMany(Recomendacion::class);
    }
}
