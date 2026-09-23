<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Carrera extends Model
{
    use HasFactory;

    protected $fillable = [
        'clave',
        'nombre',
        'facultad',
    ];

    public function software(): BelongsToMany
    {
        return $this->belongsToMany(Software::class, 'carrera_software');
    }

    public function perfiles(): HasMany
    {
        return $this->hasMany(PerfilUsuario::class);
    }
}
