<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Recomendacion extends Model
{
    use HasFactory;

    protected $table = 'recomendaciones';

    protected $fillable = [
        'perfil_usuario_id',
        'laptop_id',
        'compatibilidad_pct',
        'explicacion',
    ];

    protected function casts(): array
    {
        return [
            'explicacion' => 'array',
        ];
    }

    public function laptop(): BelongsTo
    {
        return $this->belongsTo(Laptop::class);
    }

    public function perfilUsuario(): BelongsTo
    {
        return $this->belongsTo(PerfilUsuario::class);
    }

    public function personalizacion(): HasOne
    {
        return $this->hasOne(Personalizacion::class);
    }

    public function eventosAnalitica(): HasMany
    {
        return $this->hasMany(EventoAnalitica::class);
    }
}
