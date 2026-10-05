<?php

use App\Http\Controllers\Api\Admin\CarreraController;
use App\Http\Controllers\Api\Admin\ClienteController;
use App\Http\Controllers\Api\Admin\ContabilidadController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\HardwareController;
use App\Http\Controllers\Api\Admin\InventarioController;
use App\Http\Controllers\Api\Admin\PedidoController as AdminPedidoController;
use App\Http\Controllers\Api\Admin\ReclamoController;
use App\Http\Controllers\Api\Admin\SoftwareController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\ChatbotController;
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
Route::get('/mis-pedidos', [PedidoController::class, 'index'])->middleware('auth');

Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/contabilidad', [ContabilidadController::class, 'index']);
    Route::get('/contabilidad/registro-ventas.csv', [ContabilidadController::class, 'exportar']);
    Route::get('/clientes', [ClienteController::class, 'index']);
    Route::get('/pedidos', [AdminPedidoController::class, 'index']);
    Route::patch('/pedidos/{pedido}', [AdminPedidoController::class, 'update']);
    Route::get('/inventario', [InventarioController::class, 'index']);
    Route::post('/inventario/{laptop}/movimientos', [InventarioController::class, 'movimiento']);
    Route::patch('/inventario/{laptop}', [InventarioController::class, 'update']);
    Route::get('/reclamos', [ReclamoController::class, 'index']);
    Route::patch('/reclamos/{reclamo}', [ReclamoController::class, 'update']);

    Route::post('/hardware', [HardwareController::class, 'store']);
    Route::put('/hardware/{laptop}', [HardwareController::class, 'update']);
    Route::delete('/hardware/{laptop}', [HardwareController::class, 'destroy']);

    Route::post('/software', [SoftwareController::class, 'store']);
    Route::put('/software/{software}', [SoftwareController::class, 'update']);
    Route::delete('/software/{software}', [SoftwareController::class, 'destroy']);

    Route::post('/carreras', [CarreraController::class, 'store']);
    Route::put('/carreras/{carrera}', [CarreraController::class, 'update']);
    Route::delete('/carreras/{carrera}', [CarreraController::class, 'destroy']);
});
