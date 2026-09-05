<?php

use App\Http\Controllers\Api\RecomendacionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/recomendaciones', [RecomendacionController::class, 'store']);
