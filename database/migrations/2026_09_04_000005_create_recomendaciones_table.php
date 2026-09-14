<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recomendaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perfil_usuario_id')->constrained('perfiles_usuario')->cascadeOnDelete();
            $table->foreignId('laptop_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('compatibilidad_pct');
            $table->json('explicacion');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recomendaciones');
    }
};
