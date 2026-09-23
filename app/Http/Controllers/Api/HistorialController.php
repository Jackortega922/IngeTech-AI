<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerfilUsuario;
use Illuminate\Http\Request;

class HistorialController extends Controller
{
    /**
     * Todas las consultas que ha hecho el usuario logueado, con el equipo
     * recomendado en cada una — para que pueda volver a verlas después.
     */
    public function index(Request $request)
    {
        $perfiles = PerfilUsuario::with(['recomendaciones.laptop'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($perfiles);
    }
}
