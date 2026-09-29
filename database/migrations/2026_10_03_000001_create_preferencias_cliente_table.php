<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Respuestas del cuestionario de bienvenida (Psicología): una fila por cliente. Es distinto de
 * `perfiles_usuario`, que guarda cada consulta a la IA (esa cambia en cada compra); esto es cómo
 * es el cliente y cómo decide, y se pregunta una sola vez.
 *
 * Todo es opcional: el cliente puede omitir preguntas o el cuestionario entero.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preferencias_cliente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('para_quien', 20)->nullable();
            $table->string('movilidad', 20)->nullable();
            $table->string('lejos_enchufe', 20)->nullable();
            $table->json('molestias')->nullable();
            $table->string('anios_uso', 10)->nullable();
            $table->string('nivel_tecnologia', 20)->nullable();
            $table->json('prioridades')->nullable(); // en orden, de la más a la menos importante
            $table->string('estilo_decision', 20)->nullable();
            $table->json('marcas_preferidas')->nullable();
            $table->json('marcas_evitar')->nullable();
            $table->json('perifericos')->nullable();
            // completado = llegó al final; omitido = eligió saltarse el cuestionario.
            $table->timestamp('completado_at')->nullable();
            $table->timestamp('omitido_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preferencias_cliente');
    }
};
