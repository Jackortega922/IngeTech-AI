<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kits', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->decimal('precio_soles', 10, 2);
            $table->timestamps();
        });

        Schema::create('accesorio_kit', function (Blueprint $table) {
            $table->foreignId('kit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('accesorio_id')->constrained()->cascadeOnDelete();
            $table->primary(['kit_id', 'accesorio_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accesorio_kit');
        Schema::dropIfExists('kits');
    }
};
