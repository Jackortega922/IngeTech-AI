<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Inventario (Administración): unidades disponibles de cada laptop y su kardex, el registro de
 * cada entrada y salida. El stock de la laptop es siempre la suma de sus movimientos.
 */
return new class extends Migration
{
    // Stock con el que arrancan las laptops que ya existen. Tienda hipotética: es un valor de
    // demostración para que el catálogo no amanezca agotado; el admin lo corrige con un ajuste.
    private const STOCK_INICIAL_DEMO = 5;

    public function up(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->unsignedInteger('stock')->default(0);
            // Stock de seguridad: por debajo de esto se avisa que hay que reponer.
            $table->unsignedInteger('stock_minimo')->default(2);
        });

        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laptop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pedido_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // quién lo registró
            $table->string('tipo', 12); // inicial | entrada | venta | anulacion | ajuste
            $table->integer('cantidad'); // + entra, - sale
            $table->unsignedInteger('stock_resultante');
            $table->string('motivo', 200)->nullable();
            $table->timestamps();
        });

        $ahora = now();
        foreach (DB::table('laptops')->pluck('id') as $id) {
            DB::table('laptops')->where('id', $id)->update(['stock' => self::STOCK_INICIAL_DEMO]);
            DB::table('movimientos_inventario')->insert([
                'laptop_id' => $id,
                'tipo' => 'inicial',
                'cantidad' => self::STOCK_INICIAL_DEMO,
                'stock_resultante' => self::STOCK_INICIAL_DEMO,
                'motivo' => 'Inventario inicial de demostración',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
        Schema::table('laptops', function (Blueprint $table) {
            $table->dropColumn(['stock', 'stock_minimo']);
        });
    }
};
