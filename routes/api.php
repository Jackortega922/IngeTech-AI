<?php

use App\Http\Controllers\Api\Admin\CarreraController;
use App\Http\Controllers\Api\Admin\ClienteController;
use App\Http\Controllers\Api\Admin\ContabilidadController;
use App\Http\Controllers\Api\Admin\CuponController as AdminCuponController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\HardwareController;
use App\Http\Controllers\Api\Admin\InventarioController;
use App\Http\Controllers\Api\Admin\MarketingController;
use App\Http\Controllers\Api\Admin\PedidoController as AdminPedidoController;
use App\Http\Controllers\Api\Admin\ReclamoController;
use App\Http\Controllers\Api\Admin\SoftwareController;
use App\Http\Controllers\Api\Admin\UsuarioController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\CuponController;
use App\Http\Controllers\Api\EleccionController;
use App\Http\Controllers\Api\HistorialController;
use App\Http\Controllers\Api\PedidoController;
use App\Http\Controllers\Api\RecomendacionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/catalogos', [CatalogoController::class, 'index']);
Route::post('/recomendaciones', [RecomendacionController::class, 'store']);
// Límite por minuto: con DeepSeek configurado, cada mensaje cuesta una llamada a la API.
Route::post('/chatbot', [ChatbotController::class, 'responder'])->middleware('throttle:20,1');

Route::post('/recomendaciones/{recomendacion}/eleccion', [EleccionController::class, 'store'])->middleware('auth');

Route::get('/mis-recomendaciones', [HistorialController::class, 'index'])->middleware('auth');

// Compra: abierta a invitados (el pago es simulado). El límite evita que alguien llene la BD
// de pedidos falsos en ráfaga.
Route::post('/pedidos', [PedidoController::class, 'store'])->middleware('throttle:10,1');
// Vista previa del cupón en el checkout. El límite frena a quien pruebe códigos al azar.
Route::post('/cupones/validar', [CuponController::class, 'validar'])->middleware('throttle:20,1');
Route::get('/mis-pedidos', [PedidoController::class, 'index'])->middleware('auth');

// Panel de la tienda: 'admin' deja entrar a todo el personal y 'admin:<permiso>' limita cada
// sección al rol que le corresponde (App\Support\Roles).
Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('admin:dashboard');

    Route::middleware('admin:contabilidad')->group(function () {
        Route::get('/contabilidad', [ContabilidadController::class, 'index']);
        Route::get('/contabilidad/registro-ventas.csv', [ContabilidadController::class, 'exportar']);
    });

    Route::get('/clientes', [ClienteController::class, 'index'])->middleware('admin:clientes');
    Route::get('/pedidos', [AdminPedidoController::class, 'index'])->middleware('admin:pedidos');
    Route::patch('/pedidos/{pedido}', [AdminPedidoController::class, 'update'])->middleware('admin:pedidos.editar');

    Route::middleware('admin:inventario')->group(function () {
        Route::get('/inventario', [InventarioController::class, 'index']);
        Route::post('/inventario/{laptop}/movimientos', [InventarioController::class, 'movimiento']);
        Route::patch('/inventario/{laptop}', [InventarioController::class, 'update']);
    });

    Route::middleware('admin:reclamos')->group(function () {
        Route::get('/reclamos', [ReclamoController::class, 'index']);
        Route::patch('/reclamos/{reclamo}', [ReclamoController::class, 'update']);
    });

    Route::middleware('admin:marketing')->group(function () {
        Route::get('/marketing/segmentos', [MarketingController::class, 'segmentos']);
        Route::get('/cupones', [AdminCuponController::class, 'index']);
        Route::post('/cupones', [AdminCuponController::class, 'store']);
        Route::patch('/cupones/{cupon}', [AdminCuponController::class, 'update']);
    });

    Route::middleware('admin:hardware')->group(function () {
        Route::post('/hardware', [HardwareController::class, 'store']);
        Route::put('/hardware/{laptop}', [HardwareController::class, 'update']);
        Route::delete('/hardware/{laptop}', [HardwareController::class, 'destroy']);
    });

    Route::middleware('admin:software')->group(function () {
        Route::post('/software', [SoftwareController::class, 'store']);
        Route::put('/software/{software}', [SoftwareController::class, 'update']);
        Route::delete('/software/{software}', [SoftwareController::class, 'destroy']);
    });

    Route::middleware('admin:carreras')->group(function () {
        Route::post('/carreras', [CarreraController::class, 'store']);
        Route::put('/carreras/{carrera}', [CarreraController::class, 'update']);
        Route::delete('/carreras/{carrera}', [CarreraController::class, 'destroy']);
    });

    Route::middleware('admin:usuarios')->group(function () {
        Route::get('/usuarios', [UsuarioController::class, 'index']);
        Route::post('/usuarios/rol', [UsuarioController::class, 'asignar']);
    });
});
