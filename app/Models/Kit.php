<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Kit extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'precio_soles',
    ];

    protected function casts(): array
    {
        return [
            'precio_soles' => 'decimal:2',
        ];
    }

    public function accesorios(): BelongsToMany
    {
        return $this->belongsToMany(Accesorio::class);
    }

    public function personalizacionItems(): MorphMany
    {
        return $this->morphMany(PersonalizacionItem::class, 'item');
    }
}
