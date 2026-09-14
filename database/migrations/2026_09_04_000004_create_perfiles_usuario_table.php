<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perfiles_usuario', function (Blueprint $table) {
            $table->id();
            $table->string('carrera')->nullable();
            $table->string('nivel_experiencia');
            $table->json('actividades');
            $table->json('software');
            $table->decimal('presupuesto_soles', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perfiles_usuario');
    }
};
