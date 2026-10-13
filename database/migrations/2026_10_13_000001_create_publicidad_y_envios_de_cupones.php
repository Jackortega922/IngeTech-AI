<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marketing por correo con consentimiento (Ley 29733): el cliente acepta recibir ofertas al
 * registrarse o desde su perfil, y se guarda cuándo (prueba del consentimiento; null = no acepta).
 * Cada cupón enviado por correo queda registrado para no mandárselo dos veces a la misma persona.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('acepta_publicidad_at')->nullable()->after('email_verified_at');
        });

        Schema::create('cupon_envios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cupon_id')->constrained('cupones')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->unique(['cupon_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupon_envios');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('acepta_publicidad_at');
        });
    }
};
