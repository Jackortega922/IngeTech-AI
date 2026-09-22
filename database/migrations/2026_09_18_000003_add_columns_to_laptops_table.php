<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->string('tipo')->default('laptop')->after('modelo'); // laptop | escritorio
            $table->string('almacenamiento_tipo')->default('SSD')->after('almacenamiento_gb');
            $table->boolean('gpu_dedicada')->default(false)->after('gpu');
            $table->unsignedTinyInteger('bateria_horas')->nullable()->after('rendimiento_score');
            $table->string('tienda')->nullable()->after('precio_soles');
        });
    }

    public function down(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'almacenamiento_tipo', 'gpu_dedicada', 'bateria_horas', 'tienda']);
        });
    }
};
