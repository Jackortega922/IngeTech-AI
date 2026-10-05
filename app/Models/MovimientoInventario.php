<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Una línea del kardex de una laptop. Se registra con App\Services\Tienda\Inventario, nunca a
 * mano, para que el stock y los movimientos no se desincronicen.
 */
class MovimientoInventario extends Model
{
    protected $table = 'movimientos_inventario';

    public const TIPOS = ['inicial', 'entrada', 'venta', 'anulacion', 'ajuste'];

    protected $fillable = ['laptop_id', 'pedido_id', 'user_id', 'tipo', 'cantidad', 'stock_resultante', 'motivo'];

    public function laptop(): BelongsTo
    {
        return $this->belongsTo(Laptop::class);
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
