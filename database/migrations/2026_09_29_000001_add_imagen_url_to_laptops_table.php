<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enlace a una imagen ya alojada en otro lado (tienda o fabricante), no un archivo
        // subido al servidor: el plan gratuito de Render no tiene disco persistente, así que
        // un archivo subido desaparecería en cada redespliegue. Nullable porque hoy no hay
        // URLs reales verificadas todavía (tarea C2).
        Schema::table('laptops', function (Blueprint $table) {
            $table->string('imagen_url')->nullable()->after('descripcion');
        });
    }

    public function down(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->dropColumn('imagen_url');
        });
    }
};
