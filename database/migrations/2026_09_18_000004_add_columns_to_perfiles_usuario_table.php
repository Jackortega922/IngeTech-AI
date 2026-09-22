<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->foreignId('carrera_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('portabilidad')->nullable()->after('carrera_id'); // laptop | escritorio | cualquiera
        });
    }

    public function down(): void
    {
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_id');
            $table->dropColumn(['portabilidad']);
        });
    }
};
