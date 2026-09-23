<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('sistemas/welcome'))->name('home');

Route::middleware(['auth'])->group(function () {
    // Los administradores no tienen un "dashboard de estudiante": van directo
    // a su panel, para que nunca vean el flujo de recomendación por error.
    Route::get('dashboard', function (Request $request) {
        if ($request->user()->is_admin) {
            return redirect()->route('admin');
        }

        return Inertia::render('sistemas/dashboard');
    })->name('dashboard');

    Route::get('perfil', fn () => Inertia::render('sistemas/perfil/index'))->name('perfil');
    Route::get('resultado', fn () => Inertia::render('sistemas/resultado/index'))->name('resultado');
    Route::get('personalizar', fn () => Inertia::render('sistemas/personalizar/index'))->name('personalizar');

    Route::get('software', fn () => Inertia::render('sistemas/software/index'))->name('software');
    Route::get('hardware', fn () => Inertia::render('sistemas/hardware/index'))->name('hardware');
    Route::get('comparador', fn () => Inertia::render('sistemas/comparador/index'))->name('comparador');
    Route::get('historial', fn () => Inertia::render('sistemas/historial/index'))->name('historial');
    Route::get('preguntas', fn () => Inertia::render('sistemas/preguntas/index'))->name('preguntas');

    // Páginas de disciplinas del proyecto (Proyecto Inter y Transdisciplinario) — ver
    // docs/contexto-proyecto.md §5.1 para el detalle de qué aporta cada una.
    Route::get('derecho', fn () => Inertia::render('derecho/index'))->name('derecho');
    Route::get('marketing', fn () => Inertia::render('marketing/index'))->name('marketing');
    Route::get('ing-ambiental', fn () => Inertia::render('ing-ambiental/index'))->name('ing-ambiental');

    Route::middleware(['admin'])->group(function () {
        Route::get('admin', fn () => Inertia::render('sistemas/admin/index'))->name('admin');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
