<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventoAnalitica extends Model
{
    use HasFactory;

    protected $table = 'eventos_analitica';

    protected $fillable = [
        'recomendacion_id',
        'tipo',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function recomendacion(): BelongsTo
    {
        return $this->belongsTo(Recomendacion::class);
    }
}
