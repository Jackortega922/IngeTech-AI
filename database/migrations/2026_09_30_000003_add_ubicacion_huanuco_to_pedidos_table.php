<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Huánuco tiene provincia y distrito de una lista oficial, con su UBIGEO (INEI) — ver
 * resources/data/ubigeo-huanuco.json. Los demás departamentos, por ahora, siguen escribiendo la
 * ciudad a mano, así que `ciudad` pasa a ser opcional.
 *
 * Es una migración aparte (y no un cambio a create_pedidos) porque aquella ya está en main: quien
 * ya la corrió no recibiría las columnas nuevas si solo se editara.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->string('provincia', 60)->nullable()->after('departamento');
            $table->string('distrito', 60)->nullable()->after('provincia');
            $table->char('ubigeo', 6)->nullable()->after('distrito');
            $table->string('ciudad', 80)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn(['provincia', 'distrito', 'ubigeo']);
            $table->string('ciudad', 80)->nullable(false)->change();
        });
    }
};
