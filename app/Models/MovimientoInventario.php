<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

/**
 * Una línea del kardex de una laptop. Se registra con App\Services\Tienda\Inventario, nunca a
 * mano, para que el stock y los movimientos no se desincronicen.
 */
class MovimientoInventario extends Model
{
    protected $table = 'movimientos_inventario';

    public const TIPOS = ['inicial', 'entrada', 'venta', 'anulacion', 'ajuste'];

    protected $fillable = ['laptop_id', 'pedido_id', 'user_id', 'tipo', 'cantidad', 'stock_resultante', 'motivo'];

    /**
     * Unidades vendidas por laptop en los últimos $dias: ventas menos anulaciones (las ventas
     * restan stock, por eso el signo). Solo laptops con al menos una venta neta.
     *
     * @return Collection<int, int> id de laptop => unidades
     */
    public static function unidadesVendidas(int $dias): Collection
    {
        return static::whereIn('tipo', ['venta', 'anulacion'])
            ->where('created_at', '>=', now()->subDays($dias))
            ->groupBy('laptop_id')
            ->selectRaw('laptop_id, -SUM(cantidad) as unidades')
            ->pluck('unidades', 'laptop_id')
            ->map(fn ($n) => max(0, (int) $n))
            ->filter();
    }

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
