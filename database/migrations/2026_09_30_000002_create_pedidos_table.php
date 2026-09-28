<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pedido de compra: la personalización (qué laptop y cómo configurada) + quién compra, a dónde
 * se envía y cómo pagó. Se puede comprar sin cuenta, por eso user_id es opcional y los datos de
 * contacto viven en el pedido y no en users.
 *
 * El pago es SIMULADO (no hay pasarela real): solo se guardan la marca y los últimos 4 dígitos,
 * igual que haría una tienda real. El número completo de la tarjeta nunca llega al servidor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('personalizacion_id')->constrained('personalizaciones')->cascadeOnDelete();

            $table->string('nombre', 120);
            $table->string('email', 150);
            $table->string('telefono', 20);
            $table->string('departamento', 40);
            // Huánuco tiene provincia y distrito de una lista oficial, con su UBIGEO (INEI). Los
            // demás departamentos, por ahora, escriben la ciudad a mano en `ciudad`.
            $table->string('provincia', 60)->nullable();
            $table->string('distrito', 60)->nullable();
            $table->char('ubigeo', 6)->nullable();
            $table->string('ciudad', 80)->nullable();
            $table->string('direccion', 200);
            $table->string('referencia', 200)->nullable();

            $table->string('metodo_pago', 30);
            $table->string('tarjeta_marca', 20)->nullable();
            $table->char('tarjeta_ultimos4', 4)->nullable();

            $table->decimal('subtotal', 10, 2);
            $table->decimal('costo_envio', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('estado', 20)->default('pagado');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
