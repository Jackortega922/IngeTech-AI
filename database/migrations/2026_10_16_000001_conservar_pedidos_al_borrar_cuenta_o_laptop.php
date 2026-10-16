<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un pedido (y su boleta) nunca debe borrarse en cadena: es una venta registrada en Contabilidad
 * y la ley tributaria obliga a conservar los comprobantes. Antes, borrar una cuenta, una laptop o
 * una recomendación borraba su personalización y, con ella, el pedido:
 *
 * - personalizaciones.user_id: al eliminar la cuenta queda en NULL (antes: se borraba).
 * - personalizaciones.recomendacion_id: si se borra la recomendación queda en NULL (antes: se borraba).
 * - personalizaciones.laptop_id: no se puede borrar una laptop que alguien armó o compró (antes: se borraba).
 * - pedidos.personalizacion_id: no se puede borrar una personalización con pedido (antes: se borraba el pedido).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personalizaciones', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['laptop_id']);
            $table->dropForeign(['recomendacion_id']);
        });
        Schema::table('personalizaciones', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('laptop_id')->references('id')->on('laptops')->restrictOnDelete();
            $table->foreign('recomendacion_id')->references('id')->on('recomendaciones')->nullOnDelete();
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropForeign(['personalizacion_id']);
        });
        Schema::table('pedidos', function (Blueprint $table) {
            $table->foreign('personalizacion_id')->references('id')->on('personalizaciones')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropForeign(['personalizacion_id']);
        });
        Schema::table('pedidos', function (Blueprint $table) {
            $table->foreign('personalizacion_id')->references('id')->on('personalizaciones')->cascadeOnDelete();
        });

        Schema::table('personalizaciones', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['laptop_id']);
            $table->dropForeign(['recomendacion_id']);
        });
        Schema::table('personalizaciones', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('laptop_id')->references('id')->on('laptops')->cascadeOnDelete();
            $table->foreign('recomendacion_id')->references('id')->on('recomendaciones')->cascadeOnDelete();
        });
    }
};
