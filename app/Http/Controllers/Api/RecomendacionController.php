<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecomendarRequest;
use App\Models\Actividad;
use App\Models\Carrera;
use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\PerfilUsuario;
use App\Models\Recomendacion;
use App\Services\Recommender\RecommenderClient;
use App\Services\Recommender\RecommenderException;

class RecomendacionController extends Controller
{
    public function store(RecomendarRequest $request, RecommenderClient $recommender)
    {
        $datos = $request->validated();
        $usuarioId = $request->user()?->id;

        try {
            $respuesta = $recommender->recomendar($datos);
        } catch (RecommenderException $e) {
            return response()->json([
                'version' => 'v1',
                'error' => 'error_interno',
                'mensaje' => $e->getMessage(),
            ], 502);
        }

        if (isset($respuesta['error']) && $respuesta['error'] === 'perfil_invalido') {
            return response()->json($respuesta, 422);
        }

        $carrera = Carrera::where('clave', $datos['perfil']['carrera_clave'])->first();
        $perfilUsuario = $this->guardarPerfil($datos['perfil'], $carrera, $usuarioId);

        if (isset($respuesta['error'])) {
            $respuesta['cercanas'] = $this->enriquecer($respuesta['cercanas'] ?? []);
            $this->registrarEvento(null, $datos['perfil'], 'sin_resultados');

            return response()->json($respuesta, 422);
        }

        $primeraRecomendacionId = null;
        foreach ($respuesta['tarjetas'] as &$tarjeta) {
            $laptop = Laptop::find($tarjeta['laptop_id']);
            $pct = $laptop ? $this->compatibilidad($laptop, $respuesta['necesidad']) : 0;

            $recomendacion = Recomendacion::create([
                'perfil_usuario_id' => $perfilUsuario->id,
                'laptop_id' => $tarjeta['laptop_id'],
                'compatibilidad_pct' => $pct,
                'explicacion' => ['badges' => $tarjeta['badges'], 'necesidad' => $respuesta['necesidad']],
            ]);
            $primeraRecomendacionId ??= $recomendacion->id;

            $tarjeta['laptop'] = $laptop;
            $tarjeta['compatibilidad_pct'] = $pct;
            $tarjeta['recomendacion_id'] = $recomendacion->id;
        }
        unset($tarjeta);

        $this->registrarEvento($primeraRecomendacionId, $datos['perfil'], 'ok');

        return response()->json($respuesta);
    }

    private function guardarPerfil(array $perfil, ?Carrera $carrera, ?int $usuarioId): PerfilUsuario
    {
        $nombresActividades = Actividad::whereIn('clave', $perfil['actividades'] ?? [])->pluck('nombre')->all();

        return PerfilUsuario::create([
            'user_id' => $usuarioId,
            'carrera_id' => $carrera?->id,
            'carrera' => $carrera?->nombre,
            'portabilidad' => $perfil['portabilidad'],
            'nivel_experiencia' => $perfil['nivel_experiencia'],
            'actividades' => $nombresActividades,
            'software' => $carrera?->software->pluck('clave')->all() ?? [],
            'presupuesto_soles' => $perfil['presupuesto_soles'],
        ]);
    }

    private function registrarEvento(?int $recomendacionId, array $perfil, string $resultado): void
    {
        EventoAnalitica::create([
            'recomendacion_id' => $recomendacionId,
            'tipo' => 'consulta_recomendacion',
            'payload' => [
                'carrera_clave' => $perfil['carrera_clave'],
                'presupuesto_soles' => $perfil['presupuesto_soles'],
                'portabilidad' => $perfil['portabilidad'],
                'resultado' => $resultado,
            ],
        ]);
    }

    private function compatibilidad(Laptop $laptop, array $nec): int
    {
        $pctRam = min($laptop->ram_gb / max($nec['ram_gb'], 1), 1.5) / 1.5 * 100;
        $pctCpu = min(((int) $laptop->rendimiento_score) / max($nec['cpu_score'], 1), 1.5) / 1.5 * 100;

        return (int) round(min(100, ($pctRam + $pctCpu) / 2));
    }

    private function enriquecer(array $laptopIds): array
    {
        $laptops = Laptop::whereIn('id', $laptopIds)->get()->keyBy('id');

        return collect($laptopIds)->map(fn ($id) => $laptops->get($id))->filter()->values()->all();
    }
}
