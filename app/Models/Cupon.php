<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Cupón de descuento (Marketing). El descuento siempre lo calcula el servidor con
 * descuentoPara(): el navegador solo lo muestra.
 */
class Cupon extends Model
{
    protected $table = 'cupones';

    public const TIPOS = ['porcentaje', 'monto'];

    // Tipos de la segmentación con IA (ml-engine/recommender/segmentacion.py).
    public const SEGMENTOS = ['alto_valor', 'compradores', 'interesados', 'exploradores', 'inactivos'];

    // Tope de un cupón por porcentaje: más que esto deja de ser una promoción y es un error.
    public const PORCENTAJE_MAXIMO = 50;

    protected $fillable = ['codigo', 'descripcion', 'tipo', 'valor', 'minimo_compra', 'usos_maximos', 'segmento', 'vence_el', 'activo'];

    protected function casts(): array
    {
        return [
            'valor' => 'decimal:2',
            'minimo_compra' => 'decimal:2',
            'vence_el' => 'date:Y-m-d',
            'activo' => 'boolean',
        ];
    }

    /** Por qué no se puede usar con esta compra, o null si sí se puede. */
    public function motivoNoAplica(float $subtotal): ?string
    {
        return match (true) {
            ! $this->activo => 'Este cupón ya no está vigente.',
            $this->vence_el !== null && $this->vence_el->endOfDay()->isPast() => 'Este cupón venció el '.$this->vence_el->format('d/m/Y').'.',
            $this->usos_maximos !== null && $this->usos >= $this->usos_maximos => 'Este cupón ya se agotó.',
            $this->minimo_compra !== null && $subtotal < (float) $this->minimo_compra => 'Este cupón es para compras desde S/ '.number_format((float) $this->minimo_compra, 0, '.', ',').'.',
            default => null,
        };
    }

    public function descuentoPara(float $subtotal): float
    {
        $descuento = $this->tipo === 'porcentaje'
            ? $subtotal * min((float) $this->valor, self::PORCENTAJE_MAXIMO) / 100
            : (float) $this->valor;

        // Nunca más que la compra misma.
        return round(min($descuento, $subtotal), 2);
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }
}
