<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('software', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique();
            $table->string('nombre');
            $table->string('categoria');
            $table->unsignedSmallInteger('min_ram_gb');
            $table->unsignedTinyInteger('min_cpu_score');
            $table->boolean('min_gpu_dedicada')->default(false);
            $table->unsignedSmallInteger('rec_ram_gb');
            $table->unsignedTinyInteger('rec_cpu_score');
            $table->boolean('rec_gpu_dedicada')->default(false);
            $table->timestamps();
        });

        // Carrera <-> Software es muchos a muchos: cada carrera usa varios
        // programas y un mismo programa (ej. Office) lo usan varias carreras.
        Schema::create('carrera_software', function (Blueprint $table) {
            $table->id();
            $table->foreignId('carrera_id')->constrained()->cascadeOnDelete();
            $table->foreignId('software_id')->constrained('software')->cascadeOnDelete();
            $table->unique(['carrera_id', 'software_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carrera_software');
        Schema::dropIfExists('software');
    }
};
