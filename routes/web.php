<?php

use App\Http\Controllers\Tienda\PedidoConfirmacionController;
use App\Models\Laptop;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Portada tipo tienda: la vitrina muestra el catálogo real (sin IA); la recomendación con IA
// es el valor agregado que se ofrece encima.
Route::get('/', fn () => Inertia::render('sistemas/welcome', [
    'laptops' => Laptop::orderBy('precio_soles')->get(),
]))->name('home');

// Catálogo abierto al público: navegar y comparar specs no pide cuenta, como en cualquier
// tienda. Solo la recomendación con IA (que guarda perfil e historial) pide sesión.
Route::get('software', fn () => Inertia::render('sistemas/software/index'))->name('software');
Route::get('hardware', fn () => Inertia::render('sistemas/hardware/index'))->name('hardware');
Route::get('comparador', fn () => Inertia::render('sistemas/comparador/index'))->name('comparador');
// Públicas porque el footer de la tienda las enlaza: los términos y la garantía se tienen que
// poder leer antes de comprar, sin crear cuenta.
Route::get('preguntas', fn () => Inertia::render('sistemas/preguntas/index'))->name('preguntas');
Route::get('derecho', fn () => Inertia::render('derecho/index'))->name('derecho');

// Compra: se puede comprar sin cuenta (personalizar, pagar y ver la confirmación). La cuenta
// solo hace falta para la recomendación con IA y para ver el historial de pedidos.
Route::get('personalizar', fn () => Inertia::render('sistemas/personalizar/index'))->name('personalizar');
Route::get('checkout', fn () => Inertia::render('sistemas/checkout/index', [
    'departamentos' => Pedido::DEPARTAMENTOS,
]))->name('checkout');
Route::get('pedido/{codigo}', PedidoConfirmacionController::class)->name('pedido');

Route::middleware(['auth'])->group(function () {
    // Los administradores no tienen un "dashboard de cliente": van directo
    // a su panel, para que nunca vean el flujo de recomendación por error.
    Route::get('dashboard', function (Request $request) {
        if ($request->user()->is_admin) {
            return redirect()->route('admin');
        }

        return Inertia::render('sistemas/dashboard');
    })->name('dashboard');

    Route::get('perfil', fn () => Inertia::render('sistemas/perfil/index'))->name('perfil');
    Route::get('resultado', fn () => Inertia::render('sistemas/resultado/index'))->name('resultado');

    Route::get('historial', fn () => Inertia::render('sistemas/historial/index'))->name('historial');

    // Páginas de disciplinas del proyecto (Proyecto Inter y Transdisciplinario) — ver
    // docs/contexto-proyecto.md §5.1 para el detalle de qué aporta cada una.
    Route::get('marketing', fn () => Inertia::render('marketing/index'))->name('marketing');
    Route::get('ing-ambiental', fn () => Inertia::render('ing-ambiental/index'))->name('ing-ambiental');

    Route::middleware(['admin'])->group(function () {
        Route::get('admin', fn () => Inertia::render('sistemas/admin/index'))->name('admin');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
