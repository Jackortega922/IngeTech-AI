<?php

namespace App\Services\Marketing;

use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\User;
use App\Support\Roles;

/**
 * Arma, por cada cliente con actividad, los números que el motor usa para segmentar (Marketing).
 * Solo números y el id: nombre, correo y lo que respondió en su perfil no salen de Laravel
 * (Ley 29733: se envía solo lo necesario para el fin).
 */
class DatosSegmentacion
{
    /** @return list<array{id: int, presupuesto_soles: float, recomendaciones: int, pedidos: int, gasto_soles: float, dias_inactivo: int}> */
    public function clientes(): array
    {
        // Cada perfil enviado es una recomendación que el cliente pidió.
        $perfiles = PerfilUsuario::whereNotNull('user_id')
            ->groupBy('user_id')
            ->selectRaw('user_id, COUNT(*) as cantidad, AVG(presupuesto_soles) as presupuesto, MAX(created_at) as ultimo')
            ->get()->keyBy('user_id');

        // Compras que cuentan: las no canceladas.
        $pedidos = Pedido::whereNotNull('user_id')
            ->where('estado', '!=', 'cancelado')
            ->groupBy('user_id')
            ->selectRaw('user_id, COUNT(*) as cantidad, SUM(total) as gasto, MAX(created_at) as ultimo')
            ->get()->keyBy('user_id');

        return User::where('rol', Roles::CLIENTE)
            ->whereIn('id', $perfiles->keys()->merge($pedidos->keys())->unique())
            ->get(['id', 'created_at'])
            ->map(function (User $u) use ($perfiles, $pedidos) {
                $perfil = $perfiles->get($u->id);
                $pedido = $pedidos->get($u->id);
                $ultimo = collect([$perfil?->ultimo, $pedido?->ultimo, $u->created_at])->filter()->map(fn ($f) => now()->parse($f))->max();
                $compras = (int) ($pedido?->cantidad ?? 0);
                $gasto = (float) ($pedido?->gasto ?? 0);

                return [
                    'id' => $u->id,
                    // Sin perfil, lo que pagó en promedio es la mejor pista de su presupuesto.
                    'presupuesto_soles' => round((float) ($perfil?->presupuesto ?? ($compras ? $gasto / $compras : 0)), 2),
                    'recomendaciones' => (int) ($perfil?->cantidad ?? 0),
                    'pedidos' => $compras,
                    'gasto_soles' => round($gasto, 2),
                    'dias_inactivo' => (int) $ultimo->diffInDays(now()),
                ];
            })
            ->values()
            ->all();
    }
}
