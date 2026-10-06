<?php

namespace App\Listeners;

use App\Models\Pedido;
use App\Models\Personalizacion;
use App\Models\Reclamo;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\DB;

/**
 * Cuando alguien confirma su correo, las compras (y hojas de reclamación) que hizo como invitado
 * con ese mismo correo pasan a su cuenta y aparecen en "Mis pedidos".
 *
 * Se espera a la verificación a propósito: si se uniera al registrarse, cualquiera podría crear
 * una cuenta con el correo de otra persona y ver sus pedidos, con su dirección y teléfono.
 */
class UnirComprasDeInvitado
{
    public function handle(Verified $event): void
    {
        $user = $event->user;
        if (! $user instanceof User) {
            return;
        }

        $email = mb_strtolower(trim($user->email));

        DB::transaction(function () use ($user, $email) {
            $pedidos = Pedido::whereNull('user_id')->whereRaw('LOWER(email) = ?', [$email]);
            Personalizacion::whereNull('user_id')
                ->whereIn('id', (clone $pedidos)->select('personalizacion_id'))
                ->update(['user_id' => $user->id]);
            $pedidos->update(['user_id' => $user->id]);

            Reclamo::whereNull('user_id')->whereRaw('LOWER(email) = ?', [$email])->update(['user_id' => $user->id]);
        });
    }
}
