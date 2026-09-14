<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personalizacion_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('personalizacion_id')->constrained('personalizaciones')->cascadeOnDelete();
            $table->morphs('item');
            $table->unsignedSmallInteger('cantidad')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personalizacion_items');
    }
};
