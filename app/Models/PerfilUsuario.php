<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerfilUsuario extends Model
{
    use HasFactory;

    protected $table = 'perfiles_usuario';

    protected $fillable = [
        'carrera',
        'nivel_experiencia',
        'actividades',
        'software',
        'presupuesto_soles',
    ];

    protected function casts(): array
    {
        return [
            'actividades' => 'array',
            'software' => 'array',
            'presupuesto_soles' => 'decimal:2',
        ];
    }

    public function recomendaciones(): HasMany
    {
        return $this->hasMany(Recomendacion::class);
    }
}
