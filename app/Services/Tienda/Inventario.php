<?php

namespace App\Services\Tienda;

use App\Models\Laptop;
use App\Models\MovimientoInventario;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Único lugar que cambia el stock: cada cambio deja su movimiento en el kardex. Debe llamarse
 * dentro de una transacción; la laptop se bloquea (lockForUpdate) para que dos compras al mismo
 * tiempo no vendan la última unidad dos veces.
 */
class Inventario
{
    public function registrar(Laptop $laptop, string $tipo, int $cantidad, ?string $motivo = null, ?Pedido $pedido = null, ?User $user = null): MovimientoInventario
    {
        $laptop = Laptop::lockForUpdate()->findOrFail($laptop->id);
        $nuevo = $laptop->stock + $cantidad;

        if ($nuevo < 0) {
            throw ValidationException::withMessages([
                'laptop_id' => "La {$laptop->marca} {$laptop->modelo} está agotada.",
            ]);
        }

        // forceFill: stock no es asignable desde formularios, solo cambia por aquí.
        $laptop->forceFill(['stock' => $nuevo])->save();

        return MovimientoInventario::create([
            'laptop_id' => $laptop->id,
            'pedido_id' => $pedido?->id,
            'user_id' => $user?->id,
            'tipo' => $tipo,
            'cantidad' => $cantidad,
            'stock_resultante' => $nuevo,
            'motivo' => $motivo,
        ]);
    }

    /** Conteo físico: deja el stock en $contado y registra la diferencia. */
    public function ajustar(Laptop $laptop, int $contado, string $motivo, User $user): MovimientoInventario
    {
        $actual = Laptop::lockForUpdate()->findOrFail($laptop->id)->stock;

        return $this->registrar($laptop, 'ajuste', $contado - $actual, $motivo, null, $user);
    }

    /** Venta: sale una unidad. Falla si no hay stock. */
    public function vender(Pedido $pedido, Laptop $laptop): void
    {
        $this->registrar($laptop, 'venta', -1, null, $pedido);
    }

    /** Cambio de estado de un pedido: anularlo devuelve la unidad; reactivarlo la vuelve a sacar. */
    public function alCambiarEstado(Pedido $pedido, string $antes, string $despues, User $user): void
    {
        $laptop = $pedido->personalizacion->laptop;

        if ($antes !== 'cancelado' && $despues === 'cancelado') {
            $this->registrar($laptop, 'anulacion', 1, "Pedido {$pedido->codigo} cancelado", $pedido, $user);
        } elseif ($antes === 'cancelado' && $despues !== 'cancelado') {
            $this->registrar($laptop, 'venta', -1, "Pedido {$pedido->codigo} reactivado", $pedido, $user);
        }
    }
}
