<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Actividad extends Model
{
    use HasFactory;

    protected $table = 'actividades';

    protected $fillable = [
        'clave',
        'nombre',
        'extra_ram_gb',
        'extra_cpu_score',
        'requiere_gpu',
    ];

    protected function casts(): array
    {
        return [
            'requiere_gpu' => 'boolean',
        ];
    }
}
