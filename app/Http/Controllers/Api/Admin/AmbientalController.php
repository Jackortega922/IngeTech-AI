<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Laptop;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Ingeniería Ambiental: gestión del recojo RAEE (residuos de aparatos eléctricos y electrónicos).
 * Al comprar, el cliente puede pedir que se lleven su equipo viejo; aquí se le da seguimiento
 * (pendiente → recogido → reciclado) y se miden los resultados.
 */
class AmbientalController extends Controller
{
    // Solo hacia adelante: un equipo reciclado no vuelve a estar pendiente.
    private const SIGUIENTE = ['pendiente' => 'recogido', 'recogido' => 'reciclado'];

    public function index(): JsonResponse
    {
        // Un pedido cancelado no se entrega, así que tampoco hay equipo que recoger.
        $validos = Pedido::where('estado', '!=', 'cancelado');
        $totalCompras = (clone $validos)->count();

        $recojos = (clone $validos)->where('recojo_raee', true)
            ->orderByRaw("case raee_estado when 'pendiente' then 0 when 'recogido' then 1 else 2 end")
            ->latest()
            ->get(['id', 'codigo', 'nombre', 'distrito', 'ciudad', 'departamento', 'raee_detalle', 'raee_estado', 'raee_recogido_at', 'raee_reciclado_at', 'estado', 'created_at']);

        $porEstado = collect(Pedido::ESTADOS_RAEE)->mapWithKeys(fn ($e) => [$e => $recojos->where('raee_estado', $e)->count()]);
        $recuperados = $porEstado['recogido'] + $porEstado['reciclado'];

        // No se pesa el equipo viejo: se estima con el peso promedio de las laptops del catálogo.
        $pesoPromedio = Laptop::whereNotNull('peso_kg')->avg('peso_kg');

        return response()->json([
            'recojos' => $recojos,
            'indicadores' => [
                'compras' => $totalCompras,
                'con_recojo' => $recojos->count(),
                'con_recojo_pct' => $totalCompras === 0 ? null : round($recojos->count() / $totalCompras * 100, 1),
                'por_estado' => $porEstado,
                'recuperados' => $recuperados,
                'peso_promedio_kg' => $pesoPromedio === null ? null : round((float) $pesoPromedio, 2),
                'kg_estimados' => $pesoPromedio === null ? null : round($recuperados * (float) $pesoPromedio, 1),
                'recogidos_por_mes' => $this->recogidosPorMes($recojos),
            ],
        ]);
    }

    public function update(Request $request, Pedido $pedido): JsonResponse
    {
        $datos = $request->validate(['raee_estado' => ['required', Rule::in(['recogido', 'reciclado'])]]);

        if (! $pedido->recojo_raee || $pedido->estado === 'cancelado') {
            throw ValidationException::withMessages(['raee_estado' => 'Este pedido no tiene un recojo de equipo pendiente.']);
        }
        if ((self::SIGUIENTE[$pedido->raee_estado] ?? null) !== $datos['raee_estado']) {
            throw ValidationException::withMessages(['raee_estado' => 'El recojo avanza en orden: pendiente → recogido → reciclado.']);
        }

        $pedido->forceFill([
            'raee_estado' => $datos['raee_estado'],
            $datos['raee_estado'] === 'recogido' ? 'raee_recogido_at' : 'raee_reciclado_at' => now(),
        ])->save();

        return response()->json($pedido->only(['id', 'raee_estado', 'raee_recogido_at', 'raee_reciclado_at']));
    }

    /** Equipos recogidos en cada uno de los últimos 6 meses (incluido el actual). */
    private function recogidosPorMes($recojos): array
    {
        return collect(range(5, 0))->map(function (int $hace) use ($recojos) {
            $mes = now()->startOfMonth()->subMonths($hace);

            return [
                'mes' => $mes->format('Y-m'),
                'cantidad' => $recojos->filter(fn (Pedido $p) => $p->raee_recogido_at?->isSameMonth($mes))->count(),
            ];
        })->all();
    }
}
