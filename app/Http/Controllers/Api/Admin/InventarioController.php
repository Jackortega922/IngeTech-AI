<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\MovimientoInventario;
use App\Models\Recomendacion;
use App\Services\Tienda\Inventario;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Inventario para el admin (Administración): stock de cada laptop, cuándo reponer y cuánto
 * pedir (punto de reorden con la demanda real de las ventas), el kardex de movimientos y la
 * demanda que ve la IA (qué recomienda el motor frente a lo que hay en stock).
 */
class InventarioController extends Controller
{
    // Recomendada al menos tantas veces en la ventana sin ninguna venta: la IA la ofrece, pero no convence.
    private const MIN_RECOMENDACIONES_SIN_VENTA = 5;

    public function index()
    {
        $cfg = config('tienda.inventario');
        $orden = ['agotado' => 0, 'reponer' => 1, 'ok' => 2];

        return response()->json([
            'laptops' => $this->filas()->sortBy(fn ($l) => $orden[$l['estado']])->values(),
            'movimientos' => MovimientoInventario::with(['laptop:id,marca,modelo', 'user:id,name', 'pedido:id,codigo'])
                ->latest('id')
                ->take(50)
                ->get(),
            'parametros' => $cfg,
        ]);
    }

    /**
     * Demanda que ve la IA: cuántas veces el motor recomendó cada laptop en la ventana, frente a su
     * stock y sus ventas. Señales para decidir compras:
     * - reponer_primero: le falta stock y la IA la está recomendando (se perderán ventas).
     * - no_convence: la IA la recomienda seguido pero nadie la compra (revisar precio o ficha).
     * - capital_quieto: hay stock, pero la IA no se la recomienda a nadie y no se vende.
     * Las agotadas no se recomiendan (el motor las excluye), así que su cifra es de antes de agotarse.
     */
    public function demandaIa()
    {
        $ventana = (int) config('tienda.inventario.ventana_demanda_dias');
        $desde = now()->subDays($ventana);

        $recomendaciones = Recomendacion::where('created_at', '>=', $desde)->get(['id', 'perfil_usuario_id', 'laptop_id', 'compatibilidad_pct']);
        $veces = $recomendaciones->countBy('laptop_id');
        // Primera opción de cada consulta: la de mayor compatibilidad (a igualdad, la primera guardada).
        $primera = $recomendaciones->groupBy('perfil_usuario_id')
            ->map(fn (Collection $r) => $r->sortBy([['compatibilidad_pct', 'desc'], ['id', 'asc']])->first()->laptop_id)
            ->countBy();
        // Elecciones: solo la primera de cada consulta, como en el Dashboard.
        $elegida = EventoAnalitica::where('tipo', 'eleccion_recomendacion')->where('created_at', '>=', $desde)
            ->whereIn('recomendacion_id', $recomendaciones->pluck('id'))
            ->orderBy('created_at')->get(['recomendacion_id'])
            ->map(fn (EventoAnalitica $e) => $recomendaciones->firstWhere('id', $e->recomendacion_id))
            ->unique('perfil_usuario_id')
            ->countBy('laptop_id');

        $consultas = $recomendaciones->pluck('perfil_usuario_id')->unique()->count();
        $muestraSuficiente = $consultas >= (int) config('tienda.inventario.min_consultas_demanda');

        $prioridad = ['reponer_primero' => 0, 'no_convence' => 1, 'capital_quieto' => 2, null => 3];
        $laptops = $this->filas()->map(function (array $l) use ($veces, $primera, $elegida, $muestraSuficiente) {
            $recomendada = $veces[$l['id']] ?? 0;
            $senal = match (true) {
                $l['estado'] !== 'ok' && $recomendada > 0 => 'reponer_primero',
                $muestraSuficiente && $recomendada >= self::MIN_RECOMENDACIONES_SIN_VENTA && $l['vendidas'] === 0 => 'no_convence',
                $muestraSuficiente && $l['stock'] > 0 && $recomendada === 0 && $l['vendidas'] === 0 => 'capital_quieto',
                default => null,
            };

            return [
                ...collect($l)->only(['id', 'marca', 'modelo', 'precio_soles', 'stock', 'estado', 'vendidas', 'reponer'])->all(),
                'recomendada' => $recomendada,
                'primera_opcion' => $primera[$l['id']] ?? 0,
                'elegida' => $elegida[$l['id']] ?? 0,
                'conversion_pct' => $recomendada > 0 ? round(min($l['vendidas'], $recomendada) / $recomendada * 100, 1) : null,
                'capital_soles' => $senal === 'capital_quieto' ? round($l['stock'] * (float) $l['precio_soles'], 2) : null,
                'senal' => $senal,
            ];
        })->sortBy([fn ($a, $b) => $prioridad[$a['senal']] <=> $prioridad[$b['senal']], fn ($a, $b) => $b['recomendada'] <=> $a['recomendada']])->values();

        return response()->json([
            'ventana_dias' => $ventana,
            'consultas' => $consultas,
            'min_consultas' => (int) config('tienda.inventario.min_consultas_demanda'),
            'resumen' => [
                'reponer_primero' => $laptops->where('senal', 'reponer_primero')->count(),
                'no_convence' => $laptops->where('senal', 'no_convence')->count(),
                'capital_quieto' => $laptops->where('senal', 'capital_quieto')->count(),
                'capital_quieto_soles' => round((float) $laptops->sum('capital_soles'), 2),
            ],
            'laptops' => $laptops,
        ]);
    }

    /** Stock, demanda por ventas y punto de reorden de cada laptop (lo comparten Inventario y Demanda IA). */
    private function filas(): Collection
    {
        $cfg = config('tienda.inventario');
        $ventana = (int) $cfg['ventana_demanda_dias'];

        // Unidades vendidas en la ventana (el mismo dato da la etiqueta "Más vendido" de la portada).
        $vendidas = MovimientoInventario::unidadesVendidas($ventana);

        return Laptop::orderBy('marca')->orderBy('modelo')->get()
            ->map(function (Laptop $l) use ($vendidas, $ventana, $cfg) {
                $unidades = $vendidas[$l->id] ?? 0;
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
            });
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
