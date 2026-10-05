<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Services\Tienda\Inventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function update(Request $request, Pedido $pedido, Inventario $inventario)
    {
        $datos = $request->validate(['estado' => ['required', Rule::in(Pedido::ESTADOS)]]);

        // Cancelar devuelve la laptop al inventario; reactivar un cancelado la vuelve a sacar.
        DB::transaction(function () use ($pedido, $datos, $inventario, $request) {
            $antes = $pedido->estado;
            $pedido->update($datos);
            $inventario->alCambiarEstado($pedido, $antes, $datos['estado'], $request->user());
        });

        return response()->json($pedido);
    }
}
