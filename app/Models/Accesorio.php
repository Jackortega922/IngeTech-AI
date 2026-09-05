<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Accesorio extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'tipo',
        'precio_soles',
    ];

    protected function casts(): array
    {
        return [
            'precio_soles' => 'decimal:2',
        ];
    }

    public function kits(): BelongsToMany
    {
        return $this->belongsToMany(Kit::class);
    }

    public function personalizacionItems(): MorphMany
    {
        return $this->morphMany(PersonalizacionItem::class, 'item');
    }
}
