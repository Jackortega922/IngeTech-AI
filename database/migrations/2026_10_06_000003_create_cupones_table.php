<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cupones de descuento (Marketing). Cada cupón puede apuntar a un segmento de clientes de la
 * segmentación con IA (p. ej. "interesados" → cupón de primera compra). El pedido guarda el
 * cupón y el descuento aplicado: el total ya viene con el descuento restado (y el IGV se calcula
 * sobre ese total, como en una boleta real).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cupones', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 30)->unique();
            $table->string('descripcion', 150);
            $table->string('tipo', 12); // porcentaje | monto
            $table->decimal('valor', 10, 2);
            $table->decimal('minimo_compra', 10, 2)->nullable();
            $table->unsignedInteger('usos_maximos')->nullable();
            $table->unsignedInteger('usos')->default(0);
            // Segmento al que se dirige (tipo de la segmentación con IA). Solo informativo: el
            // cupón lo puede usar cualquiera que tenga el código.
            $table->string('segmento', 20)->nullable();
            $table->date('vence_el')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->foreignId('cupon_id')->nullable()->after('personalizacion_id')->constrained('cupones')->nullOnDelete();
            $table->decimal('descuento', 10, 2)->default(0)->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cupon_id');
            $table->dropColumn('descuento');
        });
        Schema::dropIfExists('cupones');
    }
};
