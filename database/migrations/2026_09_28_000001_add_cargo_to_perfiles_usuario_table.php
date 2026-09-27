<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Dato informativo del cliente (ej. "Contador", "Chef", "Gerente de Ventas"), aparte de
        // carrera_id. No alimenta el motor de recomendación: sirve para el registro del cliente
        // en el panel admin y como insumo de Marketing/Contabilidad (E5, E6). Nullable y libre
        // porque los roles del público general son demasiado variados para un catálogo cerrado.
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->string('cargo')->nullable()->after('carrera_id');
        });
    }

    public function down(): void
    {
        Schema::table('perfiles_usuario', function (Blueprint $table) {
            $table->dropColumn('cargo');
        });
    }
};
