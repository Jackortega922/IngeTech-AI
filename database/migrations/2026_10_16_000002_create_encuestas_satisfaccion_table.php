<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Encuesta de satisfacción después de la entrega (Psicología + Industrial): una por pedido. Es lo
 * único que dice si la laptop que recomendó la IA le sirvió de verdad a la persona.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encuestas_satisfaccion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('satisfaccion'); // 1 a 5
            $table->string('volveria_elegirla', 12);     // si, no_seguro, no
            $table->json('aspectos')->nullable();         // lo que no salió como esperaba
            $table->text('comentario')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encuestas_satisfaccion');
    }
};
