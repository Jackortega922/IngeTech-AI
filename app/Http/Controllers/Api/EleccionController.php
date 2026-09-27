<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventoAnalitica;
use App\Models\Recomendacion;
use Illuminate\Http\Request;

/**
 * Registra que la persona eligió una de las laptops que le recomendó la IA. Es el dato que
 * permite medir si el motor recomienda bien (tasa de elección, tiempo de decisión, opción
 * preferida) — aporte de Ingeniería Industrial, ver docs/gestion/kpis.md.
 */
class EleccionController extends Controller
{
    public function store(Request $request, Recomendacion $recomendacion)
    {
        // Solo el dueño de la recomendación puede registrar su elección: si no, cualquiera
        // podría enviar elecciones falsas a la API e inflar los KPIs.
        abort_unless($recomendacion->perfilUsuario?->user_id === $request->user()->id, 403);

        EventoAnalitica::create([
            'recomendacion_id' => $recomendacion->id,
            'tipo' => 'eleccion_recomendacion',
            'payload' => ['badges' => $recomendacion->explicacion['badges'] ?? []],
        ]);

        return response()->noContent();
    }
}
