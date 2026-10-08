<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Nombres y apellidos por separado (los pide el registro y el perfil). `name` se queda como el
 * nombre completo que ya usan el panel, los correos y la boleta: el modelo User lo arma solo al
 * guardar nombres y apellidos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nombres', 100)->nullable()->after('name');
            $table->string('apellidos', 100)->nullable()->after('nombres');
        });

        // Las cuentas que ya existen no se pueden partir con certeza ("María del Pilar Quispe"):
        // su nombre completo queda en `nombres` y los apellidos se completan desde el perfil.
        DB::table('users')->update(['nombres' => DB::raw('name')]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nombres', 'apellidos']);
        });
    }
};
