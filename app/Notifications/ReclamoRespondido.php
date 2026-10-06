<?php

namespace App\Notifications;

use App\Models\Reclamo;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Respuesta de la tienda a una hoja del Libro de Reclamaciones. */
class ReclamoRespondido extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Reclamo $reclamo)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $r = $this->reclamo;

        return (new MailMessage)
            ->subject("Respuesta a tu hoja de reclamación {$r->numero}")
            ->greeting("Hola, {$r->nombre}")
            ->line("La tienda respondió tu hoja **{$r->numero}**:")
            ->line($r->respuesta)
            ->action('Consultar mi hoja', url('/libro-reclamaciones/consultar'))
            ->line('Si no estás conforme con la respuesta, puedes acudir al INDECOPI.')
            ->salutation('Equipo IngeTech AI');
    }
}
