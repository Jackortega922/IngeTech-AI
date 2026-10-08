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

    /**
     * Respuestas en el formato del contrato del motor (perfil.preferencias). Vacío si no completó
     * el cuestionario (o lo omitió): entonces el motor no ajusta nada a la persona. Lo usan la
     * recomendación con IA y el comparador ("Para ti").
     *
     * @return array<string, mixed>
     */
    public function paraMotor(): array
    {
        if (! $this->completado_at) {
            return [];
        }

        return array_filter([
            'movilidad' => $this->movilidad,
            'lejos_enchufe' => $this->lejos_enchufe,
            'molestias' => $this->molestias,
            'anios_uso' => $this->anios_uso,
            'prioridades' => $this->prioridades,
            'marcas_preferidas' => $this->marcas_preferidas,
            'marcas_evitar' => $this->marcas_evitar,
            'perifericos' => $this->perifericos,
        ], fn ($v) => ! empty($v));
    }
}
