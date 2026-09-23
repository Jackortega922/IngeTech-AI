<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Software extends Model
{
    use HasFactory;

    protected $table = 'software';

    protected $fillable = [
        'clave',
        'nombre',
        'descripcion',
        'categoria',
        'min_ram_gb',
        'min_cpu_score',
        'min_gpu_dedicada',
        'rec_ram_gb',
        'rec_cpu_score',
        'rec_gpu_dedicada',
    ];

    protected function casts(): array
    {
        return [
            'min_gpu_dedicada' => 'boolean',
            'rec_gpu_dedicada' => 'boolean',
        ];
    }

    public function carreras(): BelongsToMany
    {
        return $this->belongsToMany(Carrera::class, 'carrera_software');
    }
}
