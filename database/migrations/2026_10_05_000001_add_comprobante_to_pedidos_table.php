<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Número de la boleta de venta (simulada) de cada pedido: serie + correlativo de 8 dígitos,
 * ej. B001-00000012 (el formato de las boletas electrónicas en Perú). El correlativo es el id del
 * pedido, así es único y no se salta números.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->string('comprobante', 13)->nullable()->unique()->after('codigo');
        });

        // Los pedidos que ya existían también reciben su boleta.
        $serie = config('tienda.serie_boleta', 'B001');
        foreach (DB::table('pedidos')->pluck('id') as $id) {
            DB::table('pedidos')->where('id', $id)->update(['comprobante' => $serie.'-'.str_pad((string) $id, 8, '0', STR_PAD_LEFT)]);
        }
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropUnique(['comprobante']);
            $table->dropColumn('comprobante');
        });
    }
};
