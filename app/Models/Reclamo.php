<?php

namespace App\Models;

use App\Support\DiasHabiles;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Hoja del Libro de Reclamaciones virtual.
 *
 * - Reclamo: disconformidad con el producto o el servicio comprado.
 * - Queja: malestar que no tiene que ver con el producto, p. ej. con la atención recibida.
 */
class Reclamo extends Model
{
    public const TIPOS = ['reclamo', 'queja'];

    public const DOCUMENTOS = ['DNI', 'CE', 'Pasaporte'];

    public const BIENES = ['producto', 'servicio'];

    public const ESTADOS = ['pendiente', 'respondido'];

    protected $fillable = [
        'user_id',
        'pedido_codigo',
        'tipo',
        'nombre',
        'tipo_documento',
        'numero_documento',
        'domicilio',
        'telefono',
        'email',
        'menor_de_edad',
        'apoderado',
        'bien',
        'monto_reclamado',
        'descripcion_bien',
        'detalle',
        'pedido_consumidor',
        'estado',
        'fecha_limite',
        'respuesta',
        'respondido_at',
    ];

    protected $appends = ['dias_restantes'];

    protected function casts(): array
    {
        return [
            'menor_de_edad' => 'boolean',
            'monto_reclamado' => 'decimal:2',
            'fecha_limite' => 'date:Y-m-d',
            'respondido_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // El plazo corre desde el día en que se presenta.
        static::creating(function (Reclamo $r) {
            $r->fecha_limite ??= DiasHabiles::sumar(now(), (int) config('derecho.plazo_respuesta_dias_habiles'));
        });
        // Número correlativo, que el reglamento exige: sale del id, que recién existe al crear.
        static::created(function (Reclamo $r) {
            $r->numero = 'LR-'.str_pad((string) $r->id, 8, '0', STR_PAD_LEFT);
            $r->saveQuietly();
        });
    }

    /** Días hábiles que quedan para responder (negativo si venció; null si ya se respondió). */
    protected function diasRestantes(): Attribute
    {
        return Attribute::get(fn () => $this->estado === 'respondido' || ! $this->fecha_limite
            ? null
            : DiasHabiles::restantes($this->fecha_limite));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
