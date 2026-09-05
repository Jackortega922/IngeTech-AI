<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laptops', function (Blueprint $table) {
            $table->id();
            $table->string('marca');
            $table->string('modelo');
            $table->string('cpu');
            $table->unsignedSmallInteger('ram_gb');
            $table->unsignedSmallInteger('ram_ampliable_gb')->nullable();
            $table->unsignedInteger('almacenamiento_gb');
            $table->string('gpu')->nullable();
            $table->decimal('precio_soles', 10, 2);
            $table->unsignedTinyInteger('rendimiento_score')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laptops');
    }
};
