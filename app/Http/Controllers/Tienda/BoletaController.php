<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Support\AccesoPedido;
use App\Support\Igv;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Boleta de venta electrónica SIMULADA de un pedido (Contabilidad): emisor, comprobante, cliente,
 * detalle y el total con el IGV desglosado. No se envía a SUNAT; es la representación que vería el
 * cliente. Mismo acceso que la confirmación del pedido.
 */
class BoletaController extends Controller
{
    public function __invoke(Request $request, string $codigo)
    {
        $pedido = Pedido::with(['personalizacion.laptop', 'personalizacion.items.item'])
            ->where('codigo', $codigo)
            ->firstOrFail();

        abort_unless(AccesoPedido::puedeVer($request, $pedido), 404);

        return Inertia::render('sistemas/boleta/index', [
            'pedido' => $pedido,
            'desglose' => Igv::desglosar((float) $pedido->total),
            'igvPorcentaje' => (int) round(config('tienda.igv') * 100),
            'emisor' => config('tienda.emisor'),
        ]);
    }
}
