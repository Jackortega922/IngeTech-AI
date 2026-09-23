<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Recomendacion;

/**
 * Aporte de Contabilidad: métricas financieras básicas derivadas de las
 * recomendaciones generadas (no hay ventas confirmadas todavía en el MVP,
 * así que "ingreso" es el valor potencial de lo recomendado). Ver
 * docs/contexto-proyecto.md §5.1.
 */
class ContabilidadController extends Controller
{
    public function index()
    {
        $recomendaciones = Recomendacion::with('laptop')->get()->filter(fn (Recomendacion $r) => $r->laptop !== null);

        $ingresoPotencialTotal = round($recomendaciones->sum(fn (Recomendacion $r) => (float) $r->laptop->precio_soles), 2);
        $total = $recomendaciones->count();
        $ticketPromedio = $total > 0 ? round($ingresoPotencialTotal / $total, 2) : 0;

        $buckets = ['< S/2,000' => 0, 'S/2,000–4,000' => 0, 'S/4,000–6,000' => 0, '> S/6,000' => 0];
        foreach ($recomendaciones as $r) {
            $precio = (float) $r->laptop->precio_soles;
            $bucket = match (true) {
                $precio < 2000 => '< S/2,000',
                $precio < 4000 => 'S/2,000–4,000',
                $precio < 6000 => 'S/4,000–6,000',
                default => '> S/6,000',
            };
            $buckets[$bucket]++;
        }

        return response()->json([
            'ingreso_potencial_total' => $ingresoPotencialTotal,
            'ticket_promedio' => $ticketPromedio,
            'total_recomendaciones' => $total,
            'por_rango_precio' => $buckets,
        ]);
    }
}
