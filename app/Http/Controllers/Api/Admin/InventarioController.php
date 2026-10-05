<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Laptop;
use App\Models\MovimientoInventario;
use App\Services\Tienda\Inventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Inventario para el admin (Administración): stock de cada laptop, cuándo reponer y cuánto
 * pedir (punto de reorden con la demanda real de las ventas), y el kardex de movimientos.
 */
class InventarioController extends Controller
{
    public function index()
    {
        $cfg = config('tienda.inventario');
        $ventana = (int) $cfg['ventana_demanda_dias'];

        // Unidades vendidas en la ventana: ventas menos anulaciones (las ventas restan stock).
        $vendidas = MovimientoInventario::whereIn('tipo', ['venta', 'anulacion'])
            ->where('created_at', '>=', now()->subDays($ventana))
            ->groupBy('laptop_id')
            ->selectRaw('laptop_id, -SUM(cantidad) as unidades')
            ->pluck('unidades', 'laptop_id');

        $orden = ['agotado' => 0, 'reponer' => 1, 'ok' => 2];
        $laptops = Laptop::orderBy('marca')->orderBy('modelo')->get()
            ->map(function (Laptop $l) use ($vendidas, $ventana, $cfg) {
                $unidades = max(0, (int) ($vendidas[$l->id] ?? 0));
                $demanda = $unidades / $ventana;
                $puntoReorden = (int) ceil($demanda * $cfg['dias_reposicion']) + $l->stock_minimo;
                $estado = $l->stock === 0 ? 'agotado' : ($l->stock <= $puntoReorden ? 'reponer' : 'ok');
                $objetivo = (int) ceil($demanda * ($cfg['dias_reposicion'] + $cfg['dias_cobertura'])) + $l->stock_minimo;

                return [
                    'id' => $l->id,
                    'marca' => $l->marca,
                    'modelo' => $l->modelo,
                    'precio_soles' => $l->precio_soles,
                    'stock' => $l->stock,
                    'stock_minimo' => $l->stock_minimo,
                    'vendidas' => $unidades,
                    'demanda_diaria' => round($demanda, 2),
                    'cobertura_dias' => $demanda > 0 ? (int) floor($l->stock / $demanda) : null,
                    'punto_reorden' => $puntoReorden,
                    'reponer' => $estado === 'ok' ? 0 : max(1, $objetivo - $l->stock),
                    'estado' => $estado,
                ];
            })
            ->sortBy(fn ($l) => $orden[$l['estado']])
            ->values();

        return response()->json([
            'laptops' => $laptops,
            'movimientos' => MovimientoInventario::with(['laptop:id,marca,modelo', 'user:id,name', 'pedido:id,codigo'])
                ->latest('id')
                ->take(50)
                ->get(),
            'parametros' => $cfg,
        ]);
    }

    /** Entrada de mercadería o ajuste por conteo físico. */
    public function movimiento(Request $request, Laptop $laptop, Inventario $inventario)
    {
        $datos = $request->validate([
            'tipo' => ['required', Rule::in(['entrada', 'ajuste'])],
            // Entrada: unidades que llegan. Ajuste: unidades contadas en el almacén.
            'cantidad' => ['required', 'integer', $request->input('tipo') === 'entrada' ? 'min:1' : 'min:0', 'max:10000'],
            'motivo' => ['required_if:tipo,ajuste', 'nullable', 'string', 'max:200'],
        ], [
            'motivo.required_if' => 'Indica el motivo del ajuste (p. ej. conteo físico, unidad dañada).',
        ]);

        $movimiento = DB::transaction(fn () => $datos['tipo'] === 'entrada'
            ? $inventario->registrar($laptop, 'entrada', $datos['cantidad'], $datos['motivo'] ?? null, null, $request->user())
            : $inventario->ajustar($laptop, $datos['cantidad'], $datos['motivo'], $request->user()));

        return response()->json($movimiento, 201);
    }

    public function update(Request $request, Laptop $laptop)
    {
        $laptop->update($request->validate(['stock_minimo' => ['required', 'integer', 'min:0', 'max:100']]));

        return response()->json($laptop);
    }
}
