<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Darse de baja de las ofertas por correo (Ley 29733: retirar el consentimiento debe ser tan fácil
 * como darlo). Llega desde el enlace firmado de cada correo, sin iniciar sesión.
 */
class PublicidadController extends Controller
{
    public function mostrar(Request $request, User $user)
    {
        return $this->pagina($request, $user, false);
    }

    public function confirmar(Request $request, User $user)
    {
        $user->aceptarPublicidad(false);
        $user->save();

        return $this->pagina($request, $user, true);
    }

    private function pagina(Request $request, User $user, bool $hecho)
    {
        // Solo una pista del correo: el enlace se puede reenviar y no debe mostrar el dato completo.
        [$nombre, $dominio] = explode('@', $user->email, 2);

        return Inertia::render('sistemas/publicidad-baja', [
            'correo' => Str::mask($nombre, '*', 1).'@'.$dominio,
            'recibe' => $user->acepta_publicidad_at !== null,
            'hecho' => $hecho,
            'url' => $request->fullUrl(),
        ]);
    }
}
