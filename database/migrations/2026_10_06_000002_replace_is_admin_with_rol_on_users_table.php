<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Roles del personal (Administración). `is_admin` (sí/no) se reemplaza por `rol`: cliente,
 * admin, ventas, almacen o contabilidad (ver App\Support\Roles). Los administradores actuales
 * pasan a rol "admin".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('rol', 20)->default('cliente')->after('email');
        });

        DB::table('users')->where('is_admin', true)->update(['rol' => 'admin']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('email');
        });

        DB::table('users')->where('rol', 'admin')->update(['is_admin' => true]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('rol');
        });
    }
};
