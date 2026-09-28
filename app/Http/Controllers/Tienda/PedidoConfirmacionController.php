<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Página "¡Gracias por tu compra!". El pedido tiene datos personales (dirección, teléfono),
 * así que solo lo ve: quien lo compró en esta sesión (aunque sea invitado), su dueño si tiene
 * cuenta, o un admin. Para cualquier otro, el código "no existe" (404, no 403, para no confirmar
 * que ese código es válido).
 */
class PedidoConfirmacionController extends Controller
{
    public function __invoke(Request $request, string $codigo)
    {
        $pedido = Pedido::with(['personalizacion.laptop', 'personalizacion.items.item'])
            ->where('codigo', $codigo)
            ->firstOrFail();

        $user = $request->user();
        $puedeVer = in_array($codigo, $request->session()->get('pedidos_propios', []), true)
            || ($user && ($user->is_admin || $pedido->user_id === $user->id));

        abort_unless($puedeVer, 404);

        return Inertia::render('sistemas/pedido/index', ['pedido' => $pedido]);
    }
}
