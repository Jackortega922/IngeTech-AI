<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cupon;
use App\Notifications\CuponOfrecido;
use App\Services\Marketing\DestinatariosCupon;
use App\Services\Recommender\RecommenderException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Cupones para el panel de Marketing: crearlos (opcionalmente para un segmento de la
 * segmentación con IA), activarlos o pausarlos, ver cuánto se usaron y cuánto descontaron, y
 * enviarlos por correo a su grupo (solo a quienes aceptaron recibir ofertas).
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
