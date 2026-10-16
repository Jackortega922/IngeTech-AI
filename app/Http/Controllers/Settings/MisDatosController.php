<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CuponEnvio;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Reclamo;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

/**
 * Derecho de acceso (ARCO, Ley 29733): la persona descarga en un archivo todo lo que la tienda
 * guarda de ella. Solo sus propios datos, nunca los de otra cuenta.
 */
class MisDatosController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $fecha = fn ($f) => $f?->toIso8601String();

        $datos = [
            'generado_el' => now()->toIso8601String(),
            'aviso' => 'Datos personales que IngeTech AI guarda de ti (Ley N.° 29733, derecho de acceso). Puedes corregirlos en Configuración → Perfil o eliminar tu cuenta desde ahí.',
            'cuenta' => [
                'nombres' => $user->nombres,
                'apellidos' => $user->apellidos,
                'correo' => $user->email,
                'correo_confirmado' => $user->email_verified_at !== null,
                'creada_el' => $fecha($user->created_at),
                'acepta_ofertas_por_correo_desde' => $fecha($user->acepta_publicidad_at),
            ],
            'cuestionario_de_bienvenida' => $user->preferencias
                ? Arr::except($user->preferencias->toArray(), ['id', 'user_id'])
                : null,
            'consultas_a_la_ia' => PerfilUsuario::where('user_id', $user->id)
                ->with(['recomendaciones' => fn ($q) => $q->orderByDesc('compatibilidad_pct')->with('laptop:id,marca,modelo')])
                ->latest('id')->get()
                ->map(fn (PerfilUsuario $p) => [
                    'fecha' => $fecha($p->created_at),
                    'aceptaste_el_tratamiento_el' => $fecha($p->consentimiento_at),
                    'carrera' => $p->carrera,
                    'cargo' => $p->cargo,
                    'tipo_de_uso' => $p->tipo_uso,
                    'nivel' => $p->nivel_experiencia,
                    'actividades' => $p->actividades,
                    'programas' => $p->software,
                    'presupuesto_soles' => (float) $p->presupuesto_soles,
                    'recomendaciones' => $p->recomendaciones->map(fn ($r) => [
                        'laptop' => $r->laptop ? "{$r->laptop->marca} {$r->laptop->modelo}" : null,
                        'compatibilidad_pct' => $r->compatibilidad_pct,
                    ])->values(),
                ]),
            'pedidos' => Pedido::where('user_id', $user->id)
                ->with(['personalizacion.laptop:id,marca,modelo', 'encuesta'])
                ->latest('id')->get()
                ->map(fn (Pedido $p) => [
                    'codigo' => $p->codigo,
                    'boleta' => $p->comprobante,
                    'fecha' => $fecha($p->created_at),
                    'estado' => $p->estado,
                    'laptop' => ($l = $p->personalizacion?->laptop) ? "{$l->marca} {$l->modelo}" : null,
                    'total_soles' => (float) $p->total,
                    'envio' => Arr::only($p->toArray(), ['nombre', 'email', 'telefono', 'departamento', 'provincia', 'distrito', 'ciudad', 'direccion', 'referencia']),
                    'pago' => ['metodo' => $p->metodo_pago, 'tarjeta' => $p->tarjeta_marca, 'ultimos_4' => $p->tarjeta_ultimos4],
                    'recojo_raee' => (bool) $p->recojo_raee,
                    'encuesta' => $p->encuesta ? Arr::only($p->encuesta->toArray(), ['satisfaccion', 'volveria_elegirla', 'aspectos', 'comentario']) : null,
                ]),
            'libro_de_reclamaciones' => Reclamo::where('user_id', $user->id)->orWhere('email', $user->email)
                ->latest('id')->get()
                ->map(fn (Reclamo $r) => Arr::except($r->toArray(), ['id', 'user_id', 'updated_at'])),
            'cupones_recibidos_por_correo' => CuponEnvio::where('user_id', $user->id)->with('cupon:id,codigo')->get()
                ->map(fn (CuponEnvio $e) => ['cupon' => $e->cupon?->codigo, 'enviado_el' => $fecha($e->created_at)]),
        ];

        return response()->json($datos, 200, [
            'Content-Disposition' => 'attachment; filename="mis-datos-ingetech-ai.json"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
