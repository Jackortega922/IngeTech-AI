<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\PreferenciaCliente;
use App\Support\CuestionarioBienvenida;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Cuestionario de bienvenida (Psicología): se muestra al crear la cuenta y se puede volver a
 * responder, omitir o borrar cuando el cliente quiera.
 */
class BienvenidaController extends Controller
{
    public function create(Request $request)
    {
        return Inertia::render('sistemas/bienvenida/index', [
            'preguntas' => CuestionarioBienvenida::PREGUNTAS,
            'respuestas' => $request->user()->preferencias,
        ]);
    }

    public function store(Request $request)
    {
        $datos = $request->validate(CuestionarioBienvenida::reglas());

        // Guarda todas las claves, también las omitidas (null), para que volver a responder
        // borre lo que el cliente dejó en blanco esta vez.
        $campos = [];
        foreach (CuestionarioBienvenida::PREGUNTAS as $p) {
            if ($p['tipo'] === 'marcas') {
                $campos['marcas_preferidas'] = $datos['marcas_preferidas'] ?? null;
                $campos['marcas_evitar'] = $datos['marcas_evitar'] ?? null;
            } else {
                $campos[$p['clave']] = $datos[$p['clave']] ?? null;
            }
        }

        PreferenciaCliente::updateOrCreate(
            ['user_id' => $request->user()->id],
            [...$campos, 'completado_at' => now(), 'omitido_at' => null],
        );

        return to_route('dashboard')->with('mensaje', '¡Gracias! Usaremos tus respuestas para recomendarte mejor.');
    }

    // "Ahora no": se recuerda para no volver a insistir, pero sigue disponible desde el panel.
    public function omitir(Request $request)
    {
        PreferenciaCliente::updateOrCreate(['user_id' => $request->user()->id], ['omitido_at' => now()]);

        return to_route('dashboard');
    }

    // Derecho del cliente a borrar sus respuestas (protección de datos).
    public function destroy(Request $request)
    {
        $request->user()->preferencias()->delete();

        return to_route('dashboard')->with('mensaje', 'Borramos tus respuestas del cuestionario.');
    }
}
