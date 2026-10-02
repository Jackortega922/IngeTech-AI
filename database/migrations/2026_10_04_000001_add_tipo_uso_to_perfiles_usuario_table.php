<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "¿Qué describe mejor tu uso?" (idea de Marco): estudiante, profesional, gamer, creador,
 * oficina u otro. Opcional. En el formulario precarga actividades típicas de ese uso, y queda
 * guardado como dato del cliente para Marketing (segmentación).
 *
 * La carrera ya era nullable en esta tabla; desde este cambio el formulario también la deja
 * opcional, porque el público general no siempre tiene una.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->string('tipo_uso', 20)->nullable()->after('cargo');
        });
    }

    public function down(): void
    {
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->dropColumn('tipo_uso');
        });
    }
};
