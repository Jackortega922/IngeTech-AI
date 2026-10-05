<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Personal de la tienda (solo administrador). Para sumar a alguien, esa persona primero crea su
 * cuenta en el sitio y el admin le asigna un rol con su correo: así nadie maneja contraseñas
 * ajenas. Para quitarle el acceso, se le devuelve el rol "cliente".
 */
class UsuarioController extends Controller
{
    public function index()
    {
        $roles = collect(Roles::TODOS)->map(fn ($rol) => [
            'valor' => $rol,
            'nombre' => Roles::NOMBRES[$rol],
            'permisos' => Roles::permisos($rol),
        ]);

        return response()->json([
            'personal' => User::whereIn('rol', Roles::PERSONAL)->orderBy('name')->get(['id', 'name', 'email', 'rol', 'created_at']),
            'roles' => $roles,
        ]);
    }

    public function asignar(Request $request)
    {
        $datos = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'rol' => ['required', Rule::in(Roles::TODOS)],
        ], [
            'email.exists' => 'No hay una cuenta con ese correo. La persona debe registrarse primero en el sitio.',
        ]);

        $usuario = User::where('email', $datos['email'])->firstOrFail();

        // Sin esto, el admin podría quitarse su propio rol y la tienda quedarse sin nadie que
        // pueda asignar roles. Como quien asigna siempre es admin, siempre queda al menos uno.
        if ($usuario->is($request->user())) {
            throw ValidationException::withMessages(['email' => 'No puedes cambiar tu propio rol.']);
        }

        $usuario->forceFill(['rol' => $datos['rol']])->save();

        return response()->json($usuario->only(['id', 'name', 'email', 'rol']));
    }
}
