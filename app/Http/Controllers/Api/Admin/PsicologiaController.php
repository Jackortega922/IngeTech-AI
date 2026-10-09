<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventoAnalitica;
use App\Models\PerfilUsuario;
use App\Models\PreferenciaCliente;
use App\Models\User;
use App\Support\CuestionarioBienvenida;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/**
 * Psicología: cómo son nuestros clientes según el cuestionario de bienvenida, y si la
 * recomendación les genera confianza según su forma de decidir.
 *
 * Solo cifras de conjunto, nunca respuestas de una persona con su nombre (Ley 29733: el panel no
 * necesita saber quién respondió qué para ajustar cómo se le habla a los clientes).
 */
class PsicologiaController extends Controller
{
    public function index(): JsonResponse
    {
        $clientes = User::where('rol', Roles::CLIENTE)->pluck('id');
        $preferencias = PreferenciaCliente::whereIn('user_id', $clientes)->get();
        $completas = $preferencias->whereNotNull('completado_at')->values();

        return response()->json([
            'clientes' => $clientes->count(),
            'completaron' => $completas->count(),
            'omitieron' => $preferencias->whereNull('completado_at')->whereNotNull('omitido_at')->count(),
            'preguntas' => collect(CuestionarioBienvenida::PREGUNTAS)->map(fn (array $p) => $this->resumen($p, $completas))->values(),
            'confianza' => $this->confianza($completas),
        ]);
    }

    /** Cuántos eligieron cada opción de una pregunta. */
    private function resumen(array $pregunta, Collection $completas): array
    {
        $base = ['clave' => $pregunta['clave'], 'pregunta' => $pregunta['pregunta'], 'tipo' => $pregunta['tipo']];

        if ($pregunta['tipo'] === 'marcas') {
            $contar = fn (string $campo) => collect($pregunta['opciones'])->map(fn ($etiqueta, $valor) => [
                'valor' => $valor,
                'etiqueta' => $etiqueta,
                'cantidad' => $completas->filter(fn ($p) => in_array($valor, $p->{$campo} ?? [], true))->count(),
            ])->sortByDesc('cantidad')->values();

            return $base + ['respondieron' => $completas->filter(fn ($p) => ! empty($p->marcas_preferidas) || ! empty($p->marcas_evitar))->count(),
                'preferidas' => $contar('marcas_preferidas'), 'evitadas' => $contar('marcas_evitar')];
        }

        $respuestas = $completas->pluck($pregunta['clave'])->filter(fn ($v) => $v !== null && $v !== []);

        if ($pregunta['tipo'] === 'orden') {
            // Puntaje por posición (método de Borda): el 1.º lugar suma tantos puntos como opciones
            // haya, el último suma 1. Así pesa más lo que la gente pone primero.
            $n = count($pregunta['opciones']);
            $opciones = collect($pregunta['opciones'])->map(fn ($etiqueta, $valor) => [
                'valor' => $valor,
                'etiqueta' => $etiqueta,
                'puntos' => $respuestas->sum(fn (array $orden) => ($i = array_search($valor, $orden, true)) === false ? 0 : $n - $i),
                'primero' => $respuestas->filter(fn (array $orden) => ($orden[0] ?? null) === $valor)->count(),
            ])->sortByDesc('puntos')->values();

            return $base + ['respondieron' => $respuestas->count(), 'opciones' => $opciones];
        }

        // 'unica' cuenta una respuesta por persona; 'multiple', cada opción marcada.
        $valores = $pregunta['tipo'] === 'multiple' ? $respuestas->flatten() : $respuestas;
        $opciones = collect($pregunta['opciones'])->map(fn ($etiqueta, $valor) => [
            'valor' => (string) $valor,
            'etiqueta' => $etiqueta,
            'cantidad' => $valores->filter(fn ($v) => (string) $v === (string) $valor)->count(),
        ])->values();
        if ($pregunta['tipo'] === 'multiple') {
            $opciones = $opciones->sortByDesc('cantidad')->values();
        }

        return $base + ['respondieron' => $respuestas->count(), 'opciones' => $opciones];
    }

    /**
     * ¿La recomendación genera confianza según cómo decide cada persona? Por cada perfil (consulta
     * con recomendación) se mira si eligió una laptop y cuál: si elige la primera de la lista, la
     * recomendación la convenció; si elige otra, comparó y prefirió distinto.
     */
    private function confianza(Collection $completas): array
    {
        $porUsuario = $completas->keyBy('user_id');
        $perfiles = PerfilUsuario::whereIn('user_id', $porUsuario->keys())
            ->whereHas('recomendaciones')
            ->with(['recomendaciones' => fn ($q) => $q->orderByDesc('compatibilidad_pct')->orderBy('id')])
            ->get();

        // recomendación => [perfil, puesto en su lista (1 = la más compatible)]
        $ubicacion = [];
        foreach ($perfiles as $perfil) {
            foreach ($perfil->recomendaciones->values() as $i => $r) {
                $ubicacion[$r->id] = [$perfil->id, $i + 1];
            }
        }

        // Primera elección de cada perfil (igual que el Dashboard de Industrial): volver atrás y
        // elegir otra no cuenta doble.
        $puestoElegido = EventoAnalitica::where('tipo', 'eleccion_recomendacion')
            ->whereIn('recomendacion_id', array_keys($ubicacion))
            ->orderBy('created_at')
            ->get()
            ->unique(fn (EventoAnalitica $e) => $ubicacion[$e->recomendacion_id][0])
            ->mapWithKeys(fn (EventoAnalitica $e) => [$ubicacion[$e->recomendacion_id][0] => $ubicacion[$e->recomendacion_id][1]]);

        $filas = $perfiles->map(fn (PerfilUsuario $perfil) => [
            'preferencia' => $porUsuario[$perfil->user_id],
            'posicion' => $puestoElegido[$perfil->id] ?? null,
        ]);

        $agrupar = function (string $clave) use ($filas) {
            $pregunta = collect(CuestionarioBienvenida::PREGUNTAS)->firstWhere('clave', $clave);

            return collect($pregunta['opciones'])->map(function ($etiqueta, $valor) use ($filas, $clave) {
                $grupo = $filas->filter(fn ($f) => $f['preferencia']->{$clave} === $valor);
                $eligieron = $grupo->whereNotNull('posicion');

                return [
                    'valor' => $valor,
                    'etiqueta' => $etiqueta,
                    'consultas' => $grupo->count(),
                    'eligieron' => $eligieron->count(),
                    'eligio_la_primera' => $eligieron->where('posicion', 1)->count(),
                    'posicion_promedio' => $eligieron->isEmpty() ? null : round($eligieron->avg('posicion'), 1),
                ];
            })->values();
        };

        return ['por_estilo' => $agrupar('estilo_decision'), 'por_nivel' => $agrupar('nivel_tecnologia')];
    }
}
