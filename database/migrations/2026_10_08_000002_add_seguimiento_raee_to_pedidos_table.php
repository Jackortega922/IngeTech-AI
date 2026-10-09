<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ingeniería Ambiental: seguimiento del recojo RAEE. Hasta ahora el pedido solo guardaba que el
 * cliente quería entregar su equipo viejo (recojo_raee); ahora se sigue qué pasó con él:
 * pendiente → recogido → reciclado (entregado a una empresa autorizada de reciclaje).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->string('raee_estado', 20)->nullable()->after('raee_detalle'); // null = no pidió recojo
            $table->timestamp('raee_recogido_at')->nullable()->after('raee_estado');
            $table->timestamp('raee_reciclado_at')->nullable()->after('raee_recogido_at');
        });

        // Los recojos que ya se pidieron quedan pendientes.
        DB::table('pedidos')->where('recojo_raee', true)->update(['raee_estado' => 'pendiente']);
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn(['raee_estado', 'raee_recogido_at', 'raee_reciclado_at']);
        });
    }
};
