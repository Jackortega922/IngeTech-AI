<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personalizaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recomendacion_id')->constrained('recomendaciones')->cascadeOnDelete();
            $table->unsignedSmallInteger('ram_gb')->nullable();
            $table->unsignedInteger('almacenamiento_gb')->nullable();
            $table->decimal('precio_total', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personalizaciones');
    }
};
