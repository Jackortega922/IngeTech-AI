<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Seguimiento de pedido para quien compró sin cuenta: con el código y el correo de la compra
 * puede volver a ver su pedido desde cualquier navegador.
 *
 * Se piden los dos datos porque la página del pedido muestra dirección y teléfono: con solo el
 * código, cualquiera que lo viera (en una foto, un chat) podría ver esos datos. Si coinciden, se
 * le da acceso a esta sesión igual que a quien acaba de comprar (session 'pedidos_propios').
 */
class SeguimientoController extends Controller
{
    public function create()
    {
        return Inertia::render('sistemas/seguimiento/index');
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'codigo' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:150'],
        ]);

        $codigo = Str::upper(trim($datos['codigo']));
        $pedido = Pedido::where('codigo', $codigo)->first();

        // Mismo mensaje si no existe el código o si el correo no coincide: así no se revela
        // qué códigos son válidos.
        if (! $pedido || Str::lower(trim($pedido->email)) !== Str::lower(trim($datos['email']))) {
            // A la página de seguimiento, no back(): back() vuelve a la última página visitada, que
            // podría ser el propio pedido y mostraría "no encontrado" en vez de este mensaje.
            return redirect()->route('seguimiento')
                ->withErrors(['codigo' => 'No encontramos un pedido con ese código y correo. Revisa que estén bien escritos.'])
                ->onlyInput('codigo', 'email');
        }

        $request->session()->push('pedidos_propios', $pedido->codigo);

        return redirect()->route('pedido', $pedido->codigo);
    }
}
