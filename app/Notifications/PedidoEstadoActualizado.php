<?php

namespace App\Notifications;

use App\Models\Pedido;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Aviso por correo cada vez que el personal cambia el estado del pedido. */
class PedidoEstadoActualizado extends Notification implements ShouldQueue
{
    use Queueable;

    private const MENSAJES = [
        'pagado' => 'Tu pago fue confirmado.',
        'preparando' => 'Estamos preparando tu laptop con la configuración que elegiste.',
        'enviado' => 'Tu pedido ya salió y va en camino a tu dirección.',
        'entregado' => 'Tu pedido fue entregado. ¡Que lo disfrutes!',
        'cancelado' => 'Tu pedido fue cancelado. Si no lo pediste tú o tienes dudas, puedes dejar constancia en el Libro de Reclamaciones del sitio.',
    ];

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
        $p = $this->pedido;

        return (new MailMessage)
            ->subject("Tu pedido {$p->codigo}: {$p->estado}")
            ->greeting("Hola, {$p->nombre}")
            ->line(self::MENSAJES[$p->estado] ?? "Tu pedido ahora está: {$p->estado}.")
            ->action('Seguir mi pedido', url('/seguimiento'))
            ->line("Código: {$p->codigo}")
            ->salutation('Equipo IngeTech AI');
    }
}
