<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Qué tal le fue a la persona con su laptop, después de recibirla (una por pedido). Las preguntas
 * y opciones viven aquí: las usan la validación, el correo, la página y los paneles.
 */
class EncuestaSatisfaccion extends Model
{
    protected $table = 'encuestas_satisfaccion';

    // ¿Volvería a elegirla? Una duda después de comprar ("no estoy seguro") es disonancia cognitiva:
    // la persona no termina de convencerse de su decisión.
    public const VOLVERIA = [
        'si' => 'Sí, la volvería a elegir',
        'no_seguro' => 'No estoy seguro',
        'no' => 'No, elegiría otra',
    ];

    // Lo que no salió como esperaba: los mismos aspectos que la IA pesa al recomendar, para saber
    // en qué se equivocó.
    public const ASPECTOS = [
        'rendimiento' => 'Rendimiento o velocidad',
        'bateria' => 'Duración de la batería',
        'peso' => 'Peso o tamaño',
        'pantalla' => 'Pantalla',
        'temperatura' => 'Se calienta',
        'almacenamiento' => 'Espacio de almacenamiento',
        'precio' => 'El precio que pagué',
        'entrega' => 'La entrega',
    ];

    protected $fillable = ['pedido_id', 'satisfaccion', 'volveria_elegirla', 'aspectos', 'comentario'];

    protected function casts(): array
    {
        return [
            'satisfaccion' => 'integer',
            'aspectos' => 'array',
        ];
    }

    public static function opciones(): array
    {
        return ['volveria' => self::VOLVERIA, 'aspectos' => self::ASPECTOS];
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }
}
