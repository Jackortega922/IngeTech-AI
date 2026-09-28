<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hasta ahora nada escribía en `personalizaciones`: "Confirmar personalización" solo cambiaba
 * el mensaje en pantalla. Para guardarla de verdad (como cotización que un asesor atiende):
 *
 * - user_id: de quién es, para mostrarla en su panel y que el admin sepa a quién contactar.
 * - laptop_id: qué equipo se personalizó. Antes solo se sabía a través de la recomendación.
 * - recomendacion_id pasa a ser opcional: desde el catálogo público se puede personalizar
 *   una laptop sin haber pedido una recomendación con IA.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personalizaciones', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('laptop_id')->nullable()->after('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recomendacion_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('personalizaciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropConstrainedForeignId('laptop_id');
            $table->foreignId('recomendacion_id')->nullable(false)->change();
        });
    }
};
