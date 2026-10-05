<?php

namespace App\Support;

use App\Models\Pedido;
use Illuminate\Http\Request;

/**
 * Quién puede ver un pedido (y su boleta), que tiene dirección y teléfono del cliente: quien lo
 * compró en esta sesión o lo recuperó con código + correo (session 'pedidos_propios'), su dueño
 * si tiene cuenta, o el personal con acceso a Pedidos (admin, ventas, contabilidad). La comparten la confirmación del pedido y la boleta.
 */
class AccesoPedido
{
    public static function puedeVer(Request $request, Pedido $pedido): bool
    {
        $user = $request->user();

        return in_array($pedido->codigo, $request->session()->get('pedidos_propios', []), true)
            || ($user && ($user->puede('pedidos') || $pedido->user_id === $user->id));
    }
}
