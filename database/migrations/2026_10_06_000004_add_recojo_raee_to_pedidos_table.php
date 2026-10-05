<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ingeniería Ambiental: al comprar, el cliente puede pedir que, al entregarle la laptop nueva, se
 * lleven su equipo anterior para reciclarlo como residuo electrónico (RAEE).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->boolean('recojo_raee')->default(false)->after('referencia');
            $table->string('raee_detalle', 120)->nullable()->after('recojo_raee'); // qué equipo entrega
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn(['recojo_raee', 'raee_detalle']);
        });
    }
};
