<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cupon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Cupones para el panel de Marketing: crearlos (opcionalmente para un segmento de la
 * segmentación con IA), activarlos o pausarlos, y ver cuánto se usaron y cuánto descontaron.
 */
class CuponController extends Controller
{
    public function index()
    {
        return response()->json(
            Cupon::withSum(['pedidos as monto_descontado' => fn ($q) => $q->where('estado', '!=', 'cancelado')], 'descuento')
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
}
