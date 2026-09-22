<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome'))->name('home');

Route::middleware(['auth'])->group(function () {
    // Los administradores no tienen un "dashboard de estudiante": van directo
    // a su panel, para que nunca vean el flujo de recomendación por error.
    Route::get('dashboard', function (Request $request) {
        if ($request->user()->is_admin) {
            return redirect()->route('admin');
        }

        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('perfil', fn () => Inertia::render('perfil/index'))->name('perfil');
    Route::get('resultado', fn () => Inertia::render('resultado/index'))->name('resultado');
    Route::get('personalizar', fn () => Inertia::render('personalizar/index'))->name('personalizar');

    Route::get('software', fn () => Inertia::render('software/index'))->name('software');
    Route::get('hardware', fn () => Inertia::render('hardware/index'))->name('hardware');
    Route::get('comparador', fn () => Inertia::render('comparador/index'))->name('comparador');
    Route::get('historial', fn () => Inertia::render('historial/index'))->name('historial');
    Route::get('preguntas', fn () => Inertia::render('preguntas/index'))->name('preguntas');

    Route::middleware(['admin'])->group(function () {
        Route::get('admin', fn () => Inertia::render('admin/index'))->name('admin');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
