<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cupon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Vista previa del cupón en el checkout: dice cuánto descuenta. El descuento que vale es el que
 * se recalcula al registrar el pedido (PedidoController), no este.
 */
class CuponController extends Controller
{
    public function validar(Request $request)
    {
        $datos = $request->validate([
            'codigo' => ['required', 'string', 'max:30'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $cupon = Cupon::where('codigo', Str::upper(trim($datos['codigo'])))->first();
        $motivo = $cupon ? $cupon->motivoNoAplica((float) $datos['subtotal']) : 'Ese cupón no existe. Revisa que esté bien escrito.';
        if ($motivo) {
            throw ValidationException::withMessages(['cupon' => $motivo]);
        }

        return response()->json([
            'codigo' => $cupon->codigo,
            'descripcion' => $cupon->descripcion,
            'descuento' => $cupon->descuentoPara((float) $datos['subtotal']),
        ]);
    }
}
