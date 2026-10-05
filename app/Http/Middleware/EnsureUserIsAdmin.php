<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Panel de la tienda (/admin y /api/admin/*): sin parámetro deja pasar a todo el personal
 * (cualquier rol que no sea cliente); con parámetro exige ese permiso del rol, p. ej.
 * `admin:inventario`. Ver App\Support\Roles.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next, ?string $permiso = null): Response
    {
        $user = $request->user();

        if (! $user || ! $user->es_personal) {
            abort(403, 'Esta sección es solo para el personal de la tienda.');
        }

        if ($permiso !== null && ! $user->puede($permiso)) {
            abort(403, 'Tu rol no tiene acceso a esta sección.');
        }

        return $next($request);
    }
}
