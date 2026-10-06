<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reclamo;
use App\Notifications\ReclamoRespondido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

/**
 * Libro de Reclamaciones para el admin: ver las hojas con su plazo y responderlas. Primero las
 * pendientes que vencen antes.
 */
class ReclamoController extends Controller
{
    public function index()
    {
        return response()->json(
            Reclamo::orderByRaw("CASE WHEN estado = 'pendiente' THEN 0 ELSE 1 END")
                ->orderBy('fecha_limite')
                ->latest('id')
                ->get()
        );
    }

    public function update(Request $request, Reclamo $reclamo)
    {
        $datos = $request->validate(['respuesta' => ['required', 'string', 'min:10', 'max:3000']]);

        $reclamo->update([
            'respuesta' => $datos['respuesta'],
            'estado' => 'respondido',
            'respondido_at' => now(),
        ]);

        Notification::route('mail', [$reclamo->email => $reclamo->nombre])->notify(new ReclamoRespondido($reclamo));

        return response()->json($reclamo);
    }
}
