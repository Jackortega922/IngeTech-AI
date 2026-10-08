<?php

use App\Http\Controllers\Tienda\BienvenidaController;
use App\Http\Controllers\Tienda\BoletaController;
use App\Http\Controllers\Tienda\LibroReclamacionesController;
use App\Http\Controllers\Tienda\PedidoConfirmacionController;
use App\Http\Controllers\Tienda\SeguimientoController;
use App\Models\Laptop;
use App\Models\MovimientoInventario;
use App\Models\Pedido;
use App\Support\UbigeoHuanuco;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Portada tipo tienda: muestra una selección (más vendidas y novedades) y lleva al catálogo
// completo con filtros en /hardware; la recomendación con IA es el valor agregado encima.
Route::get('/', fn () => Inertia::render('sistemas/welcome', [
    'laptops' => Laptop::orderBy('precio_soles')->get(),
    // id de laptop => unidades vendidas: el mismo dato que "vendidas" en Inventario del panel.
    'vendidas' => MovimientoInventario::unidadesVendidas(config('tienda.inventario.ventana_demanda_dias')),
    // Etiqueta "Nuevo": las últimas agregadas, solo si entraron hace poco.
    'nuevas' => Laptop::where('created_at', '>=', now()->subDays(config('tienda.vitrina.dias_nuevo')))
        ->latest()->orderByDesc('id')
        ->limit(config('tienda.vitrina.etiquetas'))
        ->pluck('id'),
    'etiquetas' => config('tienda.vitrina.etiquetas'),
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
// Transparencia de la IA: qué datos usa el motor, cómo calcula y cuáles son sus límites.
Route::get('como-decide-la-ia', fn () => Inertia::render('derecho/como-decide-ia'))->name('como-decide-ia');

// Libro de Reclamaciones virtual: obligatorio y sin cuenta. Los límites frenan el spam y a
// quien intente adivinar números de hoja.
Route::get('libro-reclamaciones', [LibroReclamacionesController::class, 'create'])->name('reclamos.create');
Route::post('libro-reclamaciones', [LibroReclamacionesController::class, 'store'])->middleware('throttle:5,1')->name('reclamos.store');
Route::get('libro-reclamaciones/consultar', [LibroReclamacionesController::class, 'consulta'])->name('reclamos.consulta');
Route::post('libro-reclamaciones/consultar', [LibroReclamacionesController::class, 'consultar'])->middleware('throttle:10,1')->name('reclamos.consultar');
Route::get('libro-reclamaciones/{numero}', [LibroReclamacionesController::class, 'show'])->where('numero', 'LR-[0-9]+')->name('reclamos.show');

// Compra: se puede comprar sin cuenta (personalizar, pagar y ver la confirmación). La cuenta
// solo hace falta para la recomendación con IA y para ver el historial de pedidos.
Route::get('personalizar', fn () => Inertia::render('sistemas/personalizar/index'))->name('personalizar');
Route::get('checkout', fn () => Inertia::render('sistemas/checkout/index', [
    'departamentos' => Pedido::DEPARTAMENTOS,
    'provinciasHuanuco' => UbigeoHuanuco::provincias(),
]))->name('checkout');
Route::get('pedido/{codigo}', PedidoConfirmacionController::class)->name('pedido');
// Boleta de venta (simulada) del pedido: mismo acceso que la confirmación.
Route::get('pedido/{codigo}/boleta', BoletaController::class)->name('pedido.boleta');
// Seguimiento para quien compró sin cuenta: código + correo. El límite frena a quien intente
// adivinar códigos probando muchos seguidos.
Route::get('seguimiento', [SeguimientoController::class, 'create'])->name('seguimiento');
Route::post('seguimiento', [SeguimientoController::class, 'store'])->middleware('throttle:10,1');

Route::middleware(['auth'])->group(function () {
    // Los administradores no tienen un "dashboard de cliente": van directo
    // a su panel, para que nunca vean el flujo de recomendación por error.
    Route::get('dashboard', function (Request $request) {
        if ($request->user()->es_personal) {
            return redirect()->route('admin');
        }

        return Inertia::render('sistemas/dashboard', [
            'preferencias' => $request->user()->preferencias,
            'mensaje' => session('mensaje'),
        ]);
    })->name('dashboard');

    // Cuestionario de bienvenida (Psicología): se muestra al crear la cuenta y se puede volver
    // a responder, omitir o borrar desde el panel.
    Route::get('bienvenida', [BienvenidaController::class, 'create'])->name('bienvenida');
    Route::post('bienvenida', [BienvenidaController::class, 'store']);
    Route::post('bienvenida/omitir', [BienvenidaController::class, 'omitir'])->name('bienvenida.omitir');
    Route::delete('bienvenida', [BienvenidaController::class, 'destroy'])->name('bienvenida.borrar');

    // Perfil y resultado reciben las respuestas del cuestionario para adaptar cómo se le
    // presenta la recomendación (para quién es, cómo prefiere decidir, nivel técnico).
    Route::get('perfil', fn (Request $request) => Inertia::render('sistemas/perfil/index', [
        'preferencias' => $request->user()->preferencias,
    ]))->name('perfil');
    Route::get('resultado', fn (Request $request) => Inertia::render('sistemas/resultado/index', [
        'preferencias' => $request->user()->preferencias,
    ]))->name('resultado');

    Route::get('historial', fn () => Inertia::render('sistemas/historial/index'))->name('historial');

    // Páginas de disciplinas del proyecto (Proyecto Inter y Transdisciplinario) — ver
    // docs/contexto-proyecto.md §5.1 para el detalle de qué aporta cada una.
    Route::get('marketing', fn () => Inertia::render('marketing/index'))->name('marketing');
    // Ambiental: cifras reales del programa de reciclaje y de cuántas laptops se pueden ampliar.
    Route::get('ing-ambiental', fn () => Inertia::render('ing-ambiental/index', [
        'raee' => [
            'solicitados' => Pedido::where('recojo_raee', true)->where('estado', '!=', 'cancelado')->count(),
            'recogidos' => Pedido::where('recojo_raee', true)->where('estado', 'entregado')->count(),
        ],
        'ampliables' => [
            'ram' => Laptop::whereColumn('ram_ampliable_gb', '>', 'ram_gb')->count(),
            'total' => Laptop::count(),
        ],
    ]))->name('ing-ambiental');

    Route::middleware(['admin'])->group(function () {
        Route::get('admin', fn () => Inertia::render('sistemas/admin/index'))->name('admin');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
