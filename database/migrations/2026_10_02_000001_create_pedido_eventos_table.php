<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Historial de estados de cada pedido: cuándo pasó a "pagado", "preparando", "enviado"... El
 * cliente ve esas fechas en el seguimiento, y sirve para medir tiempos de entrega (KPI).
 * `pedidos.estado` sigue guardando el estado actual; esta tabla guarda el recorrido.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedido_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained()->cascadeOnDelete();
            $table->string('estado', 20);
            $table->timestamp('created_at')->useCurrent();
        });

        // Pedidos que ya existían: se registra que se pagaron al crearse y, si ya avanzaron, su
        // estado actual con la fecha de su última actualización (no hay más detalle que eso).
        foreach (DB::table('pedidos')->get(['id', 'estado', 'created_at', 'updated_at']) as $p) {
            DB::table('pedido_eventos')->insert(['pedido_id' => $p->id, 'estado' => 'pagado', 'created_at' => $p->created_at]);
            if ($p->estado !== 'pagado') {
                DB::table('pedido_eventos')->insert(['pedido_id' => $p->id, 'estado' => $p->estado, 'created_at' => $p->updated_at]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pedido_eventos');
    }
};
