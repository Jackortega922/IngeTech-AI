<?php

namespace App\Notifications;

use App\Models\Reclamo;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Constancia de la hoja de reclamación. El reglamento del Libro de Reclamaciones (D.S.
 * 011-2011-PCM) pide enviar al consumidor una copia de su hoja al correo que indicó.
 */
class ReclamoRegistrado extends Notification implements ShouldQueue
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
        $tipo = $r->tipo === 'reclamo' ? 'reclamo' : 'queja';

        return (new MailMessage)
            ->subject("Constancia de tu hoja de reclamación {$r->numero}")
            ->greeting("Hola, {$r->nombre}")
            ->line("Registramos tu {$tipo} con el número **{$r->numero}** en el Libro de Reclamaciones de IngeTech AI.")
            ->line("Producto o servicio: {$r->descripcion_bien}")
            ->line("Detalle: {$r->detalle}")
            ->line("Lo que pides: {$r->pedido_consumidor}")
            ->line('La tienda debe responderte a más tardar el '.$r->fecha_limite->format('d/m/Y').' ('.config('derecho.plazo_respuesta_dias_habiles').' días hábiles).')
            ->action('Ver mi hoja', url('/libro-reclamaciones'))
            ->line("Para verla desde otro dispositivo, usa el número {$r->numero} y este correo en «¿Ya presentaste una hoja?».")
            ->line('La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.')
            ->salutation('Equipo IngeTech AI');
    }
}
