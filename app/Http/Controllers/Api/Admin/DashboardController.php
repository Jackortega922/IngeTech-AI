<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Carrera;
use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\Pedido;
use App\Models\Reclamo;
use App\Models\Recomendacion;
use App\Models\Software;
use App\Models\User;
use Illuminate\Support\Collection;

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
            'total_usuarios' => User::where('rol', 'cliente')->count(),
            'total_consultas' => $eventos->count(),
            'por_carrera' => $porCarrera,
            'por_presupuesto' => $buckets,
            'calidad' => $this->calidadDeLaRecomendacion($eventos),
            'sistema' => $this->indicadoresDelSistema($eventos),
        ]);
    }

    /**
     * KPIs de Ingeniería Industrial: ¿la IA recomienda bien? Definiciones, fórmulas y metas en
     * docs/gestion/kpis.md. Las tasas son null si todavía no hay datos para calcularlas, para
     * no mostrar un 0% que parezca un resultado malo cuando en realidad no hay muestra.
     *
     * @param  Collection<int, EventoAnalitica>  $consultas
     */
    private function calidadDeLaRecomendacion(Collection $consultas): array
    {
        $conResultado = $consultas->filter(fn (EventoAnalitica $e) => ($e->payload['resultado'] ?? null) === 'ok')->count();

        // Se cuenta solo la primera elección de cada perfil: si alguien vuelve atrás y elige
        // otra opción, no debe pesar doble en la tasa ni en la opción preferida.
        $primeraEleccionPorPerfil = EventoAnalitica::where('tipo', 'eleccion_recomendacion')
            ->with('recomendacion.perfilUsuario')
            ->orderBy('created_at')
            ->get()
            ->filter(fn (EventoAnalitica $e) => $e->recomendacion?->perfilUsuario !== null)
            ->unique(fn (EventoAnalitica $e) => $e->recomendacion->perfil_usuario_id);

        // Relojes del servidor en ambos extremos (no el del navegador). Mediana y no promedio:
        // alguien que deja la pestaña abierta una hora no debe distorsionar el indicador.
        $tiemposDecision = $primeraEleccionPorPerfil->map(
            fn (EventoAnalitica $e) => (int) round(abs($e->recomendacion->perfilUsuario->created_at->diffInSeconds($e->created_at)))
        );

        $porOpcion = ['Mejor Opción Económica' => 0, 'Opción Equilibrada' => 0, 'Mejor Rendimiento' => 0];
        foreach ($primeraEleccionPorPerfil as $eleccion) {
            // Una misma laptop puede ganar dos categorías a la vez; se cuentan ambas.
            foreach ($eleccion->payload['badges'] ?? [] as $badge) {
                $porOpcion[$badge] = ($porOpcion[$badge] ?? 0) + 1;
            }
        }

        $compatibilidad = Recomendacion::avg('compatibilidad_pct');

        return [
            'consultas_con_resultado' => $conResultado,
            'cobertura_pct' => $consultas->isEmpty() ? null : round($conResultado / $consultas->count() * 100, 1),
            'compatibilidad_promedio' => $compatibilidad === null ? null : round((float) $compatibilidad, 1),
            'perfiles_con_eleccion' => $primeraEleccionPorPerfil->count(),
            'tasa_eleccion_pct' => $conResultado === 0 ? null : round($primeraEleccionPorPerfil->count() / $conResultado * 100, 1),
            'tiempo_decision_mediana_seg' => $tiemposDecision->isEmpty() ? null : (int) $tiemposDecision->median(),
            'elecciones_por_opcion' => $porOpcion,
        ];
    }

    /**
     * Ingeniería Industrial mira el sistema completo: un indicador por disciplina, con la IA en
     * el centro (¿la recomendación termina en una venta?). Definiciones y metas en
     * docs/gestion/kpis.md. Igual que arriba: null cuando no hay muestra.
     *
     * @param  Collection<int, EventoAnalitica>  $consultas
     */
    private function indicadoresDelSistema(Collection $consultas): array
    {
        $pedidos = Pedido::with(['personalizacion.recomendacion', 'eventos'])->get();
        $validos = $pedidos->where('estado', '!=', 'cancelado');
        $pct = fn (int $parte, int $total) => $total === 0 ? null : round($parte / $total * 100, 1);

        // IA → venta: pedidos que nacieron de una recomendación, y perfiles distintos que compraron.
        $desdeIa = $validos->filter(fn (Pedido $p) => $p->personalizacion?->recomendacion_id !== null);
        $perfilesQueCompraron = $desdeIa->map(fn (Pedido $p) => $p->personalizacion->recomendacion?->perfil_usuario_id)->filter()->unique()->count();
        $consultasOk = $consultas->filter(fn (EventoAnalitica $e) => ($e->payload['resultado'] ?? null) === 'ok')->count();

        // Ciclo del pedido: desde que se paga hasta que se entrega (historial pedido_eventos).
        $horasEntrega = $pedidos->map(function (Pedido $p) {
            $entregado = $p->eventos->firstWhere('estado', 'entregado');

            return $entregado ? $p->created_at->diffInMinutes($entregado->created_at) / 60 : null;
        })->filter(fn ($h) => $h !== null);

        $respondidos = Reclamo::where('estado', 'respondido')->get();
        $enPlazo = $respondidos->filter(fn (Reclamo $r) => $r->respondido_at->toDateString() <= $r->fecha_limite->toDateString())->count();
        $totalLaptops = Laptop::count();

        return [
            'ventas_desde_ia_pct' => $pct($desdeIa->count(), $validos->count()),
            'conversion_ia_pct' => $pct($perfilesQueCompraron, $consultasOk),
            'ciclo_entrega_mediana_horas' => $horasEntrega->isEmpty() ? null : round((float) $horasEntrega->median(), 1),
            'reclamos_por_100_pedidos' => $pedidos->isEmpty() ? null : round(Reclamo::count() / $pedidos->count() * 100, 1),
            'reclamos_en_plazo_pct' => $pct($enPlazo, $respondidos->count()),
            'quiebre_stock_pct' => $pct(Laptop::where('stock', 0)->count(), $totalLaptops),
            'ventas_con_cupon_pct' => $pct($validos->filter(fn (Pedido $p) => (float) $p->descuento > 0)->count(), $validos->count()),
            'recojo_raee_pct' => $pct($validos->where('recojo_raee', true)->count(), $validos->count()),
        ];
    }
}
