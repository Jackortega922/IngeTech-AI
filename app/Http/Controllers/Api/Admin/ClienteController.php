<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Reclamo;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Clientes (Administración): quiénes son, qué consultaron y qué compraron, para atenderlos. Incluye
 * a quienes compraron sin cuenta (solo con los datos que dieron al comprar). Las respuestas del
 * cuestionario de bienvenida no se muestran por persona: solo si lo respondió (Ley 29733; las cifras
 * de conjunto están en "Perfil de clientes").
 */
class ClienteController extends Controller
{
    public function index()
    {
        $clientes = User::where('rol', Roles::CLIENTE)
            ->withCount('perfiles')
            ->with(['preferencias:id,user_id,completado_at'])
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'email', 'email_verified_at', 'acepta_publicidad_at', 'created_at']);

        // La carrera/ocupación y el cargo son de su última consulta: alguien puede volver a
        // consultar con otra ocupación. Por id y no por created_at: dos perfiles del mismo
        // segundo empatarían.
        $ultimosPerfiles = PerfilUsuario::whereIn('id', PerfilUsuario::whereNotNull('user_id')->selectRaw('MAX(id)')->groupBy('user_id'))
            ->get(['user_id', 'carrera', 'cargo', 'created_at'])
            ->keyBy('user_id');

        $pedidos = Pedido::where('estado', '!=', 'cancelado')
            ->orderBy('id')
            ->get(['user_id', 'nombre', 'email', 'telefono', 'distrito', 'provincia', 'ciudad', 'departamento', 'total', 'created_at']);
        $porUsuario = $pedidos->whereNotNull('user_id')->groupBy('user_id');

        $registrados = $clientes->map(function (User $u) use ($ultimosPerfiles, $porUsuario) {
            $perfil = $ultimosPerfiles->get($u->id);
            $compras = $porUsuario->get($u->id, collect());
            $ultimaCompra = $compras->last();

            return [
                'id' => $u->id,
                'nombre' => $u->name,
                'email' => $u->email,
                'telefono' => $ultimaCompra?->telefono,
                'ubicacion' => $this->ubicacion($ultimaCompra),
                'registrado_at' => $u->created_at,
                'verificado' => $u->email_verified_at !== null,
                'acepta_ofertas' => $u->acepta_publicidad_at !== null,
                'carrera' => $perfil?->carrera,
                'cargo' => $perfil?->cargo,
                'recomendaciones' => $u->perfiles_count,
                'compras' => $compras->count(),
                'gasto' => round((float) $compras->sum('total'), 2),
                'ultima_actividad' => $this->masReciente([$u->created_at, $perfil?->created_at, $ultimaCompra?->created_at]),
                'cuestionario' => $u->preferencias?->completado_at !== null,
            ];
        });

        // Compraron sin cuenta: se agrupan por correo. Si ese correo ya tiene cuenta, sus compras
        // de invitado no se listan aparte (son de la misma persona).
        $correosConCuenta = $clientes->pluck('email')->map(fn ($e) => mb_strtolower($e))->flip();
        $invitados = $pedidos->whereNull('user_id')
            ->groupBy(fn (Pedido $p) => mb_strtolower($p->email))
            ->reject(fn ($_, string $email) => $correosConCuenta->has($email))
            ->map(function (Collection $compras, string $email) {
                $ultima = $compras->last();

                return [
                    'email' => $email,
                    'nombre' => $ultima->nombre,
                    'telefono' => $ultima->telefono,
                    'ubicacion' => $this->ubicacion($ultima),
                    'compras' => $compras->count(),
                    'gasto' => round((float) $compras->sum('total'), 2),
                    'ultima_compra' => $ultima->created_at,
                ];
            })
            ->sortByDesc('ultima_compra')
            ->values();

        $hace30 = now()->subDays(30);

        return response()->json([
            'resumen' => [
                'registrados' => $registrados->count(),
                'nuevos_30_dias' => $registrados->filter(fn ($c) => $c['registrado_at']->gte($hace30))->count(),
                'con_compras' => $registrados->where('compras', '>', 0)->count(),
                'solo_consultan' => $registrados->where('compras', 0)->where('recomendaciones', '>', 0)->count(),
                'cuestionario' => $registrados->where('cuestionario', true)->count(),
                'invitados' => $invitados->count(),
            ],
            'registrados' => $registrados->values(),
            'invitados' => $invitados,
        ]);
    }

    /** Ficha de un cliente registrado: sus consultas a la IA, sus pedidos y sus reclamos. */
    public function show(User $user)
    {
        abort_unless($user->rol === Roles::CLIENTE, 404);

        $consultas = $user->perfiles()
            ->with(['recomendaciones' => fn ($q) => $q->orderByDesc('compatibilidad_pct')->with('laptop:id,marca,modelo')])
            ->latest('id')
            ->get()
            ->map(function (PerfilUsuario $p) {
                $mejor = $p->recomendaciones->first();

                return [
                    'fecha' => $p->created_at,
                    'carrera' => $p->carrera,
                    'cargo' => $p->cargo,
                    'presupuesto' => (float) $p->presupuesto_soles,
                    'mejor_opcion' => $mejor?->laptop ? "{$mejor->laptop->marca} {$mejor->laptop->modelo}" : null,
                    'compatibilidad' => $mejor?->compatibilidad_pct,
                ];
            });

        return response()->json([
            'nombre' => $user->name,
            'email' => $user->email,
            'registrado_at' => $user->created_at,
            'verificado' => $user->email_verified_at !== null,
            'acepta_ofertas' => $user->acepta_publicidad_at !== null,
            'cuestionario' => $user->preferencias?->completado_at !== null,
            'consultas' => $consultas,
            'pedidos' => $this->pedidos(Pedido::where('user_id', $user->id)),
            'reclamos' => $this->reclamos(Reclamo::where('user_id', $user->id)->orWhere('email', $user->email)),
        ]);
    }

    /** Ficha de quien compró sin cuenta: lo que se sabe de sus pedidos y reclamos con ese correo. */
    public function invitado(Request $request)
    {
        $email = mb_strtolower($request->validate(['email' => ['required', 'email']])['email']);
        $pedidos = Pedido::whereNull('user_id')->whereRaw('LOWER(email) = ?', [$email]);
        abort_unless($pedidos->exists(), 404);

        return response()->json([
            'email' => $email,
            'pedidos' => $this->pedidos($pedidos),
            'reclamos' => $this->reclamos(Reclamo::whereRaw('LOWER(email) = ?', [$email])),
        ]);
    }

    private function pedidos($consulta): Collection
    {
        return $consulta->with('personalizacion.laptop:id,marca,modelo')->latest('id')->get()->map(fn (Pedido $p) => [
            'codigo' => $p->codigo,
            'comprobante' => $p->comprobante,
            'fecha' => $p->created_at,
            'laptop' => $p->personalizacion?->laptop ? "{$p->personalizacion->laptop->marca} {$p->personalizacion->laptop->modelo}" : null,
            'total' => (float) $p->total,
            'descuento' => (float) $p->descuento,
            'estado' => $p->estado,
            'telefono' => $p->telefono,
            'ubicacion' => $this->ubicacion($p),
        ]);
    }

    private function reclamos($consulta): Collection
    {
        return $consulta->latest('id')->get(['numero', 'tipo', 'estado', 'created_at'])->map(fn (Reclamo $r) => [
            'numero' => $r->numero,
            'tipo' => $r->tipo,
            'estado' => $r->estado,
            'fecha' => $r->created_at,
        ]);
    }

    // Como lugarDeEnvio() en el navegador (distrito y provincia si es Huánuco, si no la ciudad), sin
    // repetir nombres: "Huánuco, Huánuco, Huánuco" queda en "Huánuco".
    private function ubicacion(?Pedido $p): ?string
    {
        if (! $p) {
            return null;
        }

        return collect([$p->distrito ?? $p->ciudad, $p->provincia, $p->departamento])->filter()->unique()->implode(', ') ?: null;
    }

    /** @param  list<Carbon|string|null>  $fechas */
    private function masReciente(array $fechas): ?Carbon
    {
        return collect($fechas)->filter()->map(fn ($f) => Carbon::parse($f))->max();
    }
}
