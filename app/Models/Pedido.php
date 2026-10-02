<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Pedido extends Model
{
    // Orden del ciclo de vida; "cancelado" puede ocurrir en cualquier punto.
    public const ESTADOS = ['pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];

    public const DEPARTAMENTOS = [
        'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco',
        'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto',
        'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali',
    ];

    protected $fillable = [
        'codigo',
        'comprobante',
        'user_id',
        'personalizacion_id',
        'nombre',
        'email',
        'telefono',
        'departamento',
        'provincia',
        'distrito',
        'ubigeo',
        'ciudad',
        'direccion',
        'referencia',
        'metodo_pago',
        'tarjeta_marca',
        'tarjeta_ultimos4',
        'subtotal',
        'costo_envio',
        'total',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'costo_envio' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    // Código que ve el cliente. Aleatorio (no el id) para que no se pueda adivinar el pedido de
    // otra persona probando números seguidos.
    // Cada cambio de estado queda en el historial (pedido_eventos), venga de donde venga: al
    // crearse el pedido y cada vez que el admin lo avanza.
    protected static function booted(): void
    {
        static::created(function (Pedido $p) {
            $p->eventos()->create(['estado' => $p->estado]);
            // Boleta (simulada): el correlativo es el id, que recién existe después de crear.
            // saveQuietly para no disparar "updated" y registrar un cambio de estado falso.
            $p->comprobante = config('tienda.serie_boleta').'-'.str_pad((string) $p->id, 8, '0', STR_PAD_LEFT);
            $p->saveQuietly();
        });
        static::updated(function (Pedido $p) {
            if ($p->wasChanged('estado')) {
                $p->eventos()->create(['estado' => $p->estado]);
            }
        });
    }

    public static function nuevoCodigo(): string
    {
        do {
            $codigo = 'IT-'.Str::upper(Str::random(8));
        } while (self::where('codigo', $codigo)->exists());

        return $codigo;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function personalizacion(): BelongsTo
    {
        return $this->belongsTo(Personalizacion::class);
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(PedidoEvento::class)->orderBy('id');
    }
}
