<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Libro de Reclamaciones virtual (Derecho). Cada fila es una "hoja de reclamación" con los
 * campos que pide el Reglamento del Libro de Reclamaciones (D.S. 011-2011-PCM, Anexo I):
 * datos del consumidor, el bien contratado, el detalle y lo que pide, y la respuesta del
 * proveedor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reclamos', function (Blueprint $table) {
            $table->id();
            // Correlativo de la hoja (LR-00000001). Se asigna al crearse, a partir del id.
            $table->string('numero', 20)->nullable()->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Texto, no clave foránea: el consumidor puede escribir un código con errores y el
            // reclamo igual tiene que quedar registrado.
            $table->string('pedido_codigo', 20)->nullable();

            $table->string('tipo', 10); // reclamo | queja
            $table->string('nombre', 120);
            $table->string('tipo_documento', 10); // DNI | CE | Pasaporte
            $table->string('numero_documento', 15);
            $table->string('domicilio', 200);
            $table->string('telefono', 15)->nullable();
            $table->string('email', 150);
            $table->boolean('menor_de_edad')->default(false);
            $table->string('apoderado', 120)->nullable(); // padre, madre o tutor si es menor

            $table->string('bien', 10); // producto | servicio
            $table->decimal('monto_reclamado', 10, 2)->nullable();
            $table->string('descripcion_bien', 200);
            $table->text('detalle');
            $table->text('pedido_consumidor');

            $table->string('estado', 15)->default('pendiente'); // pendiente | respondido
            $table->date('fecha_limite');
            $table->text('respuesta')->nullable();
            $table->timestamp('respondido_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reclamos');
    }
};
