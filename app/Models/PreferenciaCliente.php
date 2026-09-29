<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Cómo es el cliente y cómo decide (cuestionario de bienvenida, Psicología). Ver
 * App\Support\CuestionarioBienvenida para las preguntas y sus opciones.
 */
class PreferenciaCliente extends Model
{
    protected $table = 'preferencias_cliente';

    protected $fillable = [
        'user_id',
        'para_quien',
        'movilidad',
        'lejos_enchufe',
        'molestias',
        'anios_uso',
        'nivel_tecnologia',
        'prioridades',
        'estilo_decision',
        'marcas_preferidas',
        'marcas_evitar',
        'perifericos',
        'completado_at',
        'omitido_at',
    ];

    protected function casts(): array
    {
        return [
            'molestias' => 'array',
            'prioridades' => 'array',
            'marcas_preferidas' => 'array',
            'marcas_evitar' => 'array',
            'perifericos' => 'array',
            'completado_at' => 'datetime',
            'omitido_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
