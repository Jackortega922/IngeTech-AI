<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // La Ley 29733 (Protección de Datos Personales, Perú) exige que el consentimiento sea
        // demostrable: se guarda cuándo lo dio cada persona, no solo que marcó una casilla.
        // Nullable porque los perfiles creados antes de esta migración no lo registraron.
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->timestamp('consentimiento_at')->nullable()->after('presupuesto_soles');
        });
    }

    public function down(): void
    {
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->dropColumn('consentimiento_at');
        });
    }
};
