<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;

class ClienteController extends Controller
{
    public function index()
    {
        $clientes = User::withCount('perfiles')
            ->where('rol', 'cliente')
            ->orderByDesc('created_at')
            // La carrera/ocupación y el cargo son datos de la última consulta, no del cliente
            // en sí: alguien puede volver a consultar con otra ocupación. Sirven como dato
            // informativo para Marketing/Contabilidad (E5, E6), no alimentan el motor.
            // Se ordena por id y no por created_at: dos perfiles creados en el mismo segundo
            // empatarían en created_at, y el id sí es un orden de creación sin ambigüedad.
            ->with(['perfiles' => fn ($q) => $q->latest('id')->limit(1)])
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(function (User $u) {
                $ultimoPerfil = $u->perfiles->first();

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'created_at' => $u->created_at,
                    'perfiles_count' => $u->perfiles_count,
                    'carrera' => $ultimoPerfil?->carrera,
                    'cargo' => $ultimoPerfil?->cargo,
                ];
            });

        return response()->json($clientes);
    }
}
