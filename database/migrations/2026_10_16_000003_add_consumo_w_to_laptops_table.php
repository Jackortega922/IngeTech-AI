<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Potencia promedio en uso (W) según el fabricante o medida. Opcional: si falta, el sistema la
 * estima por tipo de procesador (App\Support\ConsumoEnergetico).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->unsignedSmallInteger('consumo_w')->nullable()->after('bateria_horas');
        });
    }

    public function down(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->dropColumn('consumo_w');
        });
    }
};
