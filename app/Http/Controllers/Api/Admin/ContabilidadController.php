<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Support\Igv;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Aporte de Contabilidad: ventas REALES a partir de los pedidos (antes era un "ingreso potencial"
 * sumando lo que la IA recomendaba, de cuando aún no existían las compras).
 *
 * - Una venta es un pedido no cancelado. Los cancelados se reportan aparte como anulaciones.
 * - Los precios incluyen IGV: se desglosa base imponible e IGV (App\Support\Igv).
 */
class ContabilidadController extends Controller
{
    public function index()
    {
        $pedidos = Pedido::with('personalizacion.laptop')->orderBy('id')->get();
        $ventas = $pedidos->where('estado', '!=', 'cancelado');
        $anuladas = $pedidos->where('estado', 'cancelado');

        $total = round($ventas->sum(fn (Pedido $p) => (float) $p->total), 2);
        $desglose = Igv::desglosar($total);

        return response()->json([
            'ventas_total' => $desglose['total'],
            'base_imponible' => $desglose['base'],
            'igv' => $desglose['igv'],
            'igv_porcentaje' => (int) round(config('tienda.igv') * 100),
            'numero_ventas' => $ventas->count(),
            // Descuentos por cupones (Marketing): las ventas ya vienen con el descuento restado.
            'descuentos' => ['cantidad' => $ventas->where('descuento', '>', 0)->count(), 'monto' => round($ventas->sum(fn (Pedido $p) => (float) $p->descuento), 2)],
            'ticket_promedio' => $ventas->count() > 0 ? round($total / $ventas->count(), 2) : 0,
            'anulaciones' => ['cantidad' => $anuladas->count(), 'monto' => round($anuladas->sum(fn (Pedido $p) => (float) $p->total), 2)],
            'por_mes' => $this->porMes($ventas),
            'por_marca' => $ventas
                ->groupBy(fn (Pedido $p) => $p->personalizacion?->laptop?->marca ?? 'Sin marca')
                ->map(fn (Collection $g) => ['ventas' => $g->count(), 'monto' => round($g->sum(fn (Pedido $p) => (float) $p->total), 2)])
                ->sortByDesc('monto')
                ->all(),
            'ultimas' => $pedidos->sortByDesc('id')->take(10)->values()->map(fn (Pedido $p) => [
                'codigo' => $p->codigo,
                'comprobante' => $p->comprobante,
                'fecha' => $p->created_at,
                'cliente' => $p->nombre,
                'laptop' => trim(($p->personalizacion?->laptop?->marca ?? '').' '.($p->personalizacion?->laptop?->modelo ?? '')),
                'total' => (float) $p->total,
                'estado' => $p->estado,
            ]),
        ]);
    }

    /**
     * Registro de ventas en CSV (se abre en Excel): una fila por comprobante, con base, IGV y total.
     * Separado por ";" y con BOM UTF-8, que es lo que Excel en español espera para leer bien las
     * columnas y las tildes.
     */
    public function exportar(): StreamedResponse
    {
        $pedidos = Pedido::orderBy('id')->get();

        return response()->streamDownload(function () use ($pedidos) {
            $salida = fopen('php://output', 'w');
            fwrite($salida, "\xEF\xBB\xBF");
            fputcsv($salida, ['Fecha', 'Comprobante', 'Pedido', 'Cliente', 'Correo', 'Descuento', 'Base imponible', 'IGV', 'Total', 'Estado'], ';');
            foreach ($pedidos as $p) {
                $d = Igv::desglosar((float) $p->total);
                fputcsv($salida, [
                    $p->created_at->format('Y-m-d H:i'),
                    $p->comprobante,
                    $p->codigo,
                    $p->nombre,
                    $p->email,
                    number_format((float) $p->descuento, 2, '.', ''),
                    number_format($d['base'], 2, '.', ''),
                    number_format($d['igv'], 2, '.', ''),
                    number_format($d['total'], 2, '.', ''),
                    $p->estado === 'cancelado' ? 'ANULADO' : 'VÁLIDO',
                ], ';');
            }
            fclose($salida);
        }, 'registro-de-ventas-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Ventas de los últimos 6 meses (incluido el actual), con los meses sin ventas en cero. */
    private function porMes(Collection $ventas): array
    {
        $meses = [];
        for ($i = 5; $i >= 0; $i--) {
            $meses[Carbon::now()->startOfMonth()->subMonths($i)->format('Y-m')] = ['ventas' => 0, 'monto' => 0.0];
        }
        foreach ($ventas as $p) {
            $mes = $p->created_at->format('Y-m');
            if (isset($meses[$mes])) {
                $meses[$mes]['ventas']++;
                $meses[$mes]['monto'] = round($meses[$mes]['monto'] + (float) $p->total, 2);
            }
        }

        return $meses;
    }
}
