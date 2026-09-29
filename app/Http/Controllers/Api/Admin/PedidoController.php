<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Pedidos para el admin: ver quién compró qué y avanzar el estado del envío.
 */
class PedidoController extends Controller
{
    public function index()
    {
        return response()->json(
            Pedido::with(['personalizacion.laptop', 'personalizacion.items.item', 'eventos'])
                ->latest('id')
                ->get()
        );
    }

    public function update(Request $request, Pedido $pedido)
    {
        $datos = $request->validate(['estado' => ['required', Rule::in(Pedido::ESTADOS)]]);
        $pedido->update($datos);

        return response()->json($pedido);
    }
}
