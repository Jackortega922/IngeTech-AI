<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Carrera;
use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\Software;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        $eventos = EventoAnalitica::where('tipo', 'consulta_recomendacion')->get();

        $porCarrera = [];
        $buckets = ['< S/2,000' => 0, 'S/2,000–4,000' => 0, 'S/4,000–6,000' => 0, '> S/6,000' => 0];

        foreach ($eventos as $evento) {
            $carrera = $evento->payload['carrera_clave'] ?? 'desconocida';
            $porCarrera[$carrera] = ($porCarrera[$carrera] ?? 0) + 1;

            $presupuesto = (float) ($evento->payload['presupuesto_soles'] ?? 0);
            $bucket = match (true) {
                $presupuesto < 2000 => '< S/2,000',
                $presupuesto < 4000 => 'S/2,000–4,000',
                $presupuesto < 6000 => 'S/4,000–6,000',
                default => '> S/6,000',
            };
            $buckets[$bucket]++;
        }

        return response()->json([
            'total_equipos' => Laptop::count(),
            'total_software' => Software::count(),
            'total_carreras' => Carrera::count(),
            'total_usuarios' => User::where('is_admin', false)->count(),
            'total_consultas' => $eventos->count(),
            'por_carrera' => $porCarrera,
            'por_presupuesto' => $buckets,
        ]);
    }
}
