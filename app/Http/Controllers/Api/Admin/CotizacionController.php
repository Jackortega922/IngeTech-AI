<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Personalizacion;

/**
 * Cotizaciones que confirmaron los clientes en /personalizar: es la lista de trabajo del
 * asesor para contactarlos y cerrar la compra.
 */
class CotizacionController extends Controller
{
    public function index()
    {
        return response()->json(
            Personalizacion::with(['user:id,name,email', 'laptop', 'items.item'])
                ->whereNotNull('user_id')
                ->latest('id')
                ->get()
        );
    }
}
