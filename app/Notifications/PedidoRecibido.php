<?php

namespace App\Notifications;

use App\Models\Pedido;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Confirmación de compra por correo. Se envía en cola (no hace esperar al cliente) y después
 * de que el pedido quedó guardado (afterCommit). No incluye la dirección ni el teléfono: el
 * correo puede reenviarse; el detalle se ve en el seguimiento con código + correo.
 */
class PedidoRecibido extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Pedido $pedido)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $p = $this->pedido->loadMissing('personalizacion.laptop');
        $laptop = $p->personalizacion?->laptop;

        return (new MailMessage)
            ->subject("Recibimos tu pedido {$p->codigo}")
            ->greeting("¡Gracias por tu compra, {$p->nombre}!")
            ->line("Tu pedido **{$p->codigo}** quedó registrado y pagado.")
            ->lineIf($laptop !== null, 'Laptop: '.($laptop ? "{$laptop->marca} {$laptop->modelo}" : ''))
            ->lineIf((float) $p->descuento > 0, 'Descuento por cupón: S/ '.number_format((float) $p->descuento, 2))
            ->line('Total pagado: S/ '.number_format((float) $p->total, 2).($p->comprobante ? " · Boleta {$p->comprobante}" : ''))
            ->lineIf($p->recojo_raee, 'Al entregarte la laptop recogeremos tu equipo anterior para reciclarlo.')
            ->action('Seguir mi pedido', url('/seguimiento'))
            ->line("Para verlo usa el código {$p->codigo} y este correo. Te avisaremos cuando cambie de estado.")
            ->salutation('Equipo IngeTech AI');
    }
}
