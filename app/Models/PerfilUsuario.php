<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerfilUsuario extends Model
{
    use HasFactory;

    protected $table = 'perfiles_usuario';

    // "¿Qué describe mejor tu uso?" del formulario de perfil (opcional).
    public const TIPOS_USO = ['estudiante', 'profesional', 'gamer', 'creador', 'oficina', 'otro'];

    protected $fillable = [
        'user_id',
        'carrera_id',
        'carrera',
        'cargo',
        'tipo_uso',
        'portabilidad',
        'nivel_experiencia',
        'actividades',
        'software',
        'presupuesto_soles',
        'consentimiento_at',
    ];

    protected function casts(): array
    {
        return [
            'actividades' => 'array',
            'software' => 'array',
            'presupuesto_soles' => 'decimal:2',
            'consentimiento_at' => 'datetime',
        ];
    }

    public function carreraRelacion(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recomendaciones(): HasMany
    {
        return $this->hasMany(Recomendacion::class);
    }
}
