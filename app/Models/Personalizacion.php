<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Personalizacion extends Model
{
    use HasFactory;

    protected $table = 'personalizaciones';

    protected $fillable = [
        'recomendacion_id',
        'ram_gb',
        'almacenamiento_gb',
        'precio_total',
    ];

    protected function casts(): array
    {
        return [
            'precio_total' => 'decimal:2',
        ];
    }

    public function recomendacion(): BelongsTo
    {
        return $this->belongsTo(Recomendacion::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PersonalizacionItem::class);
    }
}
