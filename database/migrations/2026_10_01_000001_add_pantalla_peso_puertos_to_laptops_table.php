<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Datos que usa la guía de compra del comparador para explicarle al cliente la experiencia de
 * uso, no solo la potencia: tamaño y calidad de pantalla, peso (portabilidad) y puertos.
 *
 * Todos opcionales: los valores del seeder son de ficha técnica de referencia, por verificar en
 * tienda (tarea C2), igual que los precios. Si un dato falta, la guía lo omite en vez de adivinar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->decimal('pantalla_pulgadas', 3, 1)->nullable()->after('bateria_horas');
            // Ancho x alto en píxeles, ej. "1920x1080".
            $table->string('pantalla_resolucion', 20)->nullable()->after('pantalla_pulgadas');
            $table->unsignedSmallInteger('pantalla_hz')->nullable()->after('pantalla_resolucion');
            $table->decimal('peso_kg', 3, 2)->nullable()->after('pantalla_hz');
            // Lista de claves: usb_a, usb_c, usb_c_carga, thunderbolt, hdmi, lector_sd, ethernet.
            $table->json('puertos')->nullable()->after('peso_kg');
        });
    }

    public function down(): void
    {
        Schema::table('laptops', function (Blueprint $table) {
            $table->dropColumn(['pantalla_pulgadas', 'pantalla_resolucion', 'pantalla_hz', 'peso_kg', 'puertos']);
        });
    }
};
