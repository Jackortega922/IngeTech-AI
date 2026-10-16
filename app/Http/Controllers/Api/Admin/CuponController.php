<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cupon;
use App\Models\CuponEnvio;
use App\Models\Pedido;
use App\Notifications\CuponOfrecido;
use App\Services\Marketing\DestinatariosCupon;
use App\Services\Recommender\RecommenderException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Cupones para el panel de Marketing: crearlos (opcionalmente para un segmento de la
 * segmentación con IA), activarlos o pausarlos, ver cuánto se usaron y cuánto descontaron, y
 * enviarlos por correo a su grupo (solo a quienes aceptaron recibir ofertas) y medir si funcionaron.
 */
class CuponController extends Controller
{
    public function index()
    {
        return response()->json(
            Cupon::withSum(['pedidos as monto_descontado' => fn ($q) => $q->where('estado', '!=', 'cancelado')], 'descuento')
                ->withCount('envios')
                ->latest('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->merge(['codigo' => Str::upper(trim((string) $request->input('codigo')))]);

        $datos = $request->validate([
            'codigo' => ['required', 'regex:/^[A-Z0-9-]{4,30}$/', 'unique:cupones,codigo'],
            'descripcion' => ['required', 'string', 'max:150'],
            'tipo' => ['required', Rule::in(Cupon::TIPOS)],
            'valor' => ['required', 'numeric', 'min:1', $request->input('tipo') === 'porcentaje' ? 'max:'.Cupon::PORCENTAJE_MAXIMO : 'max:5000'],
            'minimo_compra' => ['nullable', 'numeric', 'min:0'],
            'usos_maximos' => ['nullable', 'integer', 'min:1'],
            'segmento' => ['nullable', Rule::in(Cupon::SEGMENTOS)],
            'vence_el' => ['nullable', 'date', 'after_or_equal:today'],
        ], [
            'codigo.regex' => 'El código lleva de 4 a 30 letras, números o guiones (sin espacios).',
            'codigo.unique' => 'Ya existe un cupón con ese código.',
        ]);

        return response()->json(Cupon::create($datos), 201);
    }

    public function update(Request $request, Cupon $cupon)
    {
        $cupon->update($request->validate(['activo' => ['required', 'boolean']]));

        return response()->json($cupon);
    }

    /**
     * ¿Funcionaron las campañas? Por cupón y por grupo de la segmentación: a cuántos se envió, cuántos
     * de ellos compraron con el cupón después de recibirlo (conversión), cuánto se vendió y cuánto se
     * descontó. Por grupo cierra el ciclo con K-Means: muestra qué grupos responden a las ofertas.
     */
    public function efectividad()
    {
        $cupones = Cupon::with([
            'envios:id,cupon_id,user_id,created_at',
            'pedidos' => fn ($q) => $q->where('estado', '!=', 'cancelado')->select(['id', 'cupon_id', 'user_id', 'total', 'descuento', 'created_at']),
        ])->latest('id')->get();

        $filas = $cupones->map(function (Cupon $c) {
            // Cuenta como respuesta al correo solo la compra de quien lo recibió, hecha después de recibirlo.
            $enviadoA = $c->envios->keyBy('user_id');
            $compraronPorCorreo = $c->pedidos
                ->filter(fn (Pedido $p) => ($e = $enviadoA->get($p->user_id)) instanceof CuponEnvio && $p->created_at->gte($e->created_at))
                ->pluck('user_id')->unique()->count();

            return [
                'id' => $c->id,
                'codigo' => $c->codigo,
                'segmento' => $c->segmento,
                'activo' => $c->activo,
                'enviados' => $c->envios->count(),
                'compraron_por_correo' => $compraronPorCorreo,
                'usos' => $c->pedidos->count(),
                'ventas' => round((float) $c->pedidos->sum('total'), 2),
                'descuento' => round((float) $c->pedidos->sum('descuento'), 2),
            ];
        });

        $porGrupo = $filas->groupBy(fn ($f) => $f['segmento'] ?? 'todos')
            ->map(fn (Collection $g, string $segmento) => [
                'segmento' => $segmento,
                'cupones' => $g->count(),
                'enviados' => $g->sum('enviados'),
                'compraron_por_correo' => $g->sum('compraron_por_correo'),
                'usos' => $g->sum('usos'),
                'ventas' => round($g->sum('ventas'), 2),
                'descuento' => round($g->sum('descuento'), 2),
            ])
            ->values();

        return response()->json([
            'cupones' => $filas->map($this->conIndicadores(...))->values(),
            'por_grupo' => $porGrupo->map($this->conIndicadores(...))->sortByDesc('conversion_pct')->values(),
        ]);
    }

    /**
     * Conversión: de cada 100 a quienes se envió, cuántos compraron con el cupón. Retorno: soles
     * vendidos por cada sol descontado. Null cuando no hay base para calcularlos.
     */
    private function conIndicadores(array $f): array
    {
        return [
            ...$f,
            'conversion_pct' => $f['enviados'] > 0 ? round($f['compraron_por_correo'] / $f['enviados'] * 100, 1) : null,
            'retorno' => $f['descuento'] > 0 ? round($f['ventas'] / $f['descuento'], 1) : null,
        ];
    }

    /** Cuántos del grupo lo recibirían, antes de enviarlo. */
    public function destinatarios(Cupon $cupon, DestinatariosCupon $destinatarios)
    {
        try {
            $d = $destinatarios->para($cupon);
        } catch (RecommenderException) {
            return response()->json(['message' => 'El motor de IA no responde: no se pudo calcular el grupo.'], 503);
        }

        return response()->json([...collect($d)->except('pendientes')->all(), 'por_enviar' => $d['pendientes']->count()]);
    }

    public function enviar(Cupon $cupon, DestinatariosCupon $destinatarios)
    {
        // Pausado, vencido o agotado: no se ofrece algo que no se puede usar.
        if ($motivo = $cupon->motivoNoAplica(PHP_FLOAT_MAX)) {
            return response()->json(['message' => $motivo], 422);
        }

        try {
            $pendientes = $destinatarios->para($cupon)['pendientes'];
        } catch (RecommenderException) {
            return response()->json(['message' => 'El motor de IA no responde: no se pudo calcular el grupo.'], 503);
        }

        // El registro va primero (con su índice único): si dos personas del personal pulsan
        // "Enviar" a la vez, a nadie le llega dos veces. El correo sale en cola.
        $enviados = 0;
        foreach ($pendientes as $cliente) {
            $nuevo = DB::table('cupon_envios')->insertOrIgnore([
                'cupon_id' => $cupon->id, 'user_id' => $cliente->id, 'created_at' => now(),
            ]);
            if ($nuevo) {
                $cliente->notify(new CuponOfrecido($cupon));
                $enviados++;
            }
        }

        return response()->json(['enviados' => $enviados]);
    }
}
