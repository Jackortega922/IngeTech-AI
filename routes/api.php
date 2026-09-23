<?php

use App\Http\Controllers\Api\Admin\CarreraController;
use App\Http\Controllers\Api\Admin\ClienteController;
use App\Http\Controllers\Api\Admin\ContabilidadController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\HardwareController;
use App\Http\Controllers\Api\Admin\SoftwareController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\HistorialController;
use App\Http\Controllers\Api\RecomendacionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/catalogos', [CatalogoController::class, 'index']);
Route::post('/recomendaciones', [RecomendacionController::class, 'store']);
Route::post('/chatbot', [ChatbotController::class, 'responder']);

Route::get('/mis-recomendaciones', [HistorialController::class, 'index'])->middleware('auth');

Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/contabilidad', [ContabilidadController::class, 'index']);
    Route::get('/clientes', [ClienteController::class, 'index']);

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
