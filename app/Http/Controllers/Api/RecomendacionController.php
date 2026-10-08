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
use App\Models\Software;
use App\Models\User;
use App\Services\Recommender\NecesidadCalculator;
use App\Services\Recommender\RecommenderClient;
use App\Services\Recommender\RecommenderException;
use Illuminate\Support\Collection;

class RecomendacionController extends Controller
{
    public function store(RecomendarRequest $request, RecommenderClient $recommender)
    {
        $datos = $request->validated();
        $perfil = $datos['perfil'];
        $usuarioId = $request->user()?->id;

        // La carrera es opcional (público general). Si viene, RecomendarRequest ya validó que existe.
        $carrera = empty($perfil['carrera_clave'])
            ? null
            : Carrera::with('software')->where('clave', $perfil['carrera_clave'])->firstOrFail();
        $actividades = Actividad::whereIn('clave', $perfil['actividades'] ?? [])->get();
        // Los programas que la persona eligió; si no mandó la lista, los típicos de su carrera.
        $software = array_key_exists('software', $perfil)
            ? Software::whereIn('clave', $perfil['software'])->get()
            : ($carrera?->software ?? collect());
        $necesidad = NecesidadCalculator::calcular($software, $actividades, $perfil['nivel_experiencia']);

        try {
            // El motor (real o mock) solo conoce el contrato v0 documentado en
            // docs/arquitectura/contrato-motor.md — carrera_clave/portabilidad son
            // conceptos de esta capa de Laravel, no cruzan hacia el motor.
            $respuesta = $recommender->recomendar([
                'perfil' => [
                    'carrera' => $carrera?->nombre ?? '',
                    'nivel_experiencia' => $perfil['nivel_experiencia'],
                    'actividades' => $actividades->pluck('clave')->all(),
                    'software' => $software->pluck('clave')->all(),
                    'presupuesto_soles' => $perfil['presupuesto_soles'],
                    // Cuestionario de bienvenida (Psicología, B11): si lo respondió, el motor
                    // ajusta el ranking a cómo es la persona. Solo viaja a nuestro propio motor.
                    ...$this->preferenciasParaMotor($request->user()),
                ],
                // Inventario (Administración): las agotadas no se recomiendan.
                'opciones' => [...($datos['opciones'] ?? []), 'excluir_ids' => Laptop::where('stock', 0)->pluck('id')->all()],
            ]);
        } catch (RecommenderException $e) {
            return response()->json([
                'version' => 'v1',
                'error' => 'error_interno',
                'mensaje' => $e->getMessage(),
            ], 502);
        }

        $perfilUsuario = $this->guardarPerfil($perfil, $carrera, $usuarioId, $actividades, $software);

        $recomendaciones = collect($respuesta['recomendaciones'] ?? []);
        if ($perfil['portabilidad'] !== 'cualquiera') {
            $recomendaciones = $this->filtrarPorTipo($recomendaciones, $perfil['portabilidad']);
        }

        if (isset($respuesta['error']) || $recomendaciones->isEmpty()) {
            $codigo = $respuesta['error'] ?? 'sin_resultados';
            $mensaje = $respuesta['mensaje'] ?? 'Ningún equipo cumple con la portabilidad elegida dentro de tu presupuesto.';
            $this->registrarEvento(null, $perfil, $codigo);

            return response()->json([
                'version' => 'v1',
                'error' => $codigo,
                'mensaje' => $mensaje,
                'necesidad' => $necesidad,
                'cercanas' => $this->buscarCercanas((float) $perfil['presupuesto_soles'], $perfil['portabilidad']),
            ], 422);
        }

        $badges = $this->asignarBadges($recomendaciones);
        $laptops = Laptop::whereIn('id', $recomendaciones->pluck('laptop_id'))->get()->keyBy('id');
        $primeraRecomendacionId = null;

        $tarjetas = $recomendaciones->map(function (array $item) use ($perfilUsuario, $laptops, $badges, &$primeraRecomendacionId) {
            $badgesLaptop = $badges[$item['laptop_id']] ?? [];

            $recomendacion = Recomendacion::create([
                'perfil_usuario_id' => $perfilUsuario->id,
                'laptop_id' => $item['laptop_id'],
                'compatibilidad_pct' => $item['compatibilidad_pct'],
                'explicacion' => array_merge($item['explicacion'] ?? [], ['badges' => $badgesLaptop]),
            ]);
            $primeraRecomendacionId ??= $recomendacion->id;

            return [
                'laptop_id' => $item['laptop_id'],
                'badges' => $badgesLaptop,
                'laptop' => $laptops->get($item['laptop_id']),
                'compatibilidad_pct' => $item['compatibilidad_pct'],
                // De dónde sale el % cuando hubo cuestionario (técnica vs. la persona).
                'compatibilidad_tecnica_pct' => $item['compatibilidad_tecnica_pct'] ?? null,
                'afinidad_pct' => $item['afinidad_pct'] ?? null,
                // El "por qué" de la IA, para mostrarlo en el resultado (transparencia, RF-ET1).
                'explicacion' => [
                    'factores' => $item['explicacion']['factores'] ?? [],
                    'advertencias' => $item['explicacion']['advertencias'] ?? [],
                ],
                'recomendacion_id' => $recomendacion->id,
            ];
        })->values()->all();

        $this->registrarEvento($primeraRecomendacionId, $perfil, 'ok');

        return response()->json([
            'version' => 'v1',
            'necesidad' => $necesidad,
            'tarjetas' => $tarjetas,
        ]);
    }

    private function guardarPerfil(array $perfil, ?Carrera $carrera, ?int $usuarioId, Collection $actividades, Collection $software): PerfilUsuario
    {
        return PerfilUsuario::create([
            'user_id' => $usuarioId,
            'carrera_id' => $carrera?->id,
            'carrera' => $carrera?->nombre,
            // El campo es opcional en el formulario; una cadena vacía se guarda como null en
            // vez de "" para no confundir "no contestó" con "contestó algo vacío".
            'cargo' => trim((string) ($perfil['cargo'] ?? '')) ?: null,
            'tipo_uso' => $perfil['tipo_uso'] ?? null,
            'portabilidad' => $perfil['portabilidad'],
            'nivel_experiencia' => $perfil['nivel_experiencia'],
            'actividades' => $actividades->pluck('nombre')->all(),
            'software' => $software->pluck('clave')->all(),
            'presupuesto_soles' => $perfil['presupuesto_soles'],
            // RecomendarRequest ya rechazó la petición si no se aceptó, así que llegar hasta
            // aquí significa que el consentimiento se dio en este momento.
            'consentimiento_at' => now(),
        ]);
    }

    private function registrarEvento(?int $recomendacionId, array $perfil, string $resultado): void
    {
        EventoAnalitica::create([
            'recomendacion_id' => $recomendacionId,
            'tipo' => 'consulta_recomendacion',
            'payload' => [
                'carrera_clave' => $perfil['carrera_clave'] ?? null,
                'presupuesto_soles' => $perfil['presupuesto_soles'],
                'portabilidad' => $perfil['portabilidad'],
                'resultado' => $resultado,
            ],
        ]);
    }

    private function filtrarPorTipo(Collection $recomendaciones, string $tipo): Collection
    {
        $idsCompatibles = Laptop::whereIn('id', $recomendaciones->pluck('laptop_id'))
            ->where('tipo', $tipo)
            ->pluck('id');

        return $recomendaciones->whereIn('laptop_id', $idsCompatibles)->values();
    }

    /**
     * Clasifica en badges de UI las recomendaciones que ya devolvió el motor,
     * comparándolas entre sí (más barata, mejor compatibilidad, mejor relación
     * compatibilidad/precio). No depende de qué motor respondió — el mismo
     * criterio aplica igual al motor real que al mock.
     *
     * @return array<int, string[]>
     */
    private function asignarBadges(Collection $recomendaciones): array
    {
        $economica = $recomendaciones->sortBy('precio_soles')->first();
        $rendimiento = $recomendaciones->sortByDesc('compatibilidad_pct')->first();
        $equilibrada = $recomendaciones->sortByDesc(
            fn (array $r) => $r['compatibilidad_pct'] / max((float) $r['precio_soles'], 1)
        )->first();

        $badges = [];
        $badges[$economica['laptop_id']][] = 'Mejor Opción Económica';
        $badges[$equilibrada['laptop_id']][] = 'Opción Equilibrada';
        $badges[$rendimiento['laptop_id']][] = 'Mejor Rendimiento';

        return $badges;
    }

    private function buscarCercanas(float $presupuesto, string $portabilidad): array
    {
        $query = Laptop::query()->where('stock', '>', 0)->orderByRaw('ABS(precio_soles - ?)', [$presupuesto]);

        if ($portabilidad !== 'cualquiera') {
            $query->where('tipo', $portabilidad);
        }

        return $query->take(3)->get()->all();
    }

    /**
     * Cuestionario de bienvenida en el formato del contrato (perfil.preferencias). Vacío si no hay
     * sesión o si no lo completó: el motor recomienda igual que siempre.
     */
    private function preferenciasParaMotor(?User $user): array
    {
        $preferencias = $user?->preferencias?->paraMotor() ?? [];

        return $preferencias ? ['preferencias' => $preferencias] : [];
    }
}
