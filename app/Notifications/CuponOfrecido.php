<?php

namespace App\Notifications;

use App\Models\Cupon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

/**
 * Cupón de Marketing por correo. Solo llega a quien aceptó recibir ofertas, y cada correo trae su
 * enlace para darse de baja (Ley 29733). Sin urgencia falsa: el vencimiento solo se menciona si
 * el cupón lo tiene.
 */
class CuponOfrecido extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Cupon $cupon) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $c = $this->cupon;
        $descuento = $c->tipo === 'porcentaje'
            ? rtrim(rtrim(number_format((float) $c->valor, 2), '0'), '.').'% de descuento'
            : 'S/ '.number_format((float) $c->valor, 2).' de descuento';

        return (new MailMessage)
            ->subject("Un cupón para ti: {$c->codigo}")
            ->greeting('¡Hola, '.($notifiable->nombres ?: $notifiable->name).'!')
            ->line($c->descripcion.'.')
            ->line("Tu código **{$c->codigo}** te da **{$descuento}** en tu compra.")
            ->lineIf($c->minimo_compra !== null, 'Válido para compras desde S/ '.number_format((float) $c->minimo_compra, 2).'.')
            ->lineIf($c->vence_el !== null, 'Puedes usarlo hasta el '.$c->vence_el?->format('d/m/Y').'.')
            ->action('Ver laptops', url('/hardware'))
            ->line('Escribe el código al pagar, en el resumen de tu compra.')
            ->salutation('Equipo IngeTech AI')
            ->line('Recibes este correo porque aceptaste recibir ofertas de IngeTech AI. [Dejar de recibirlas]('
                .URL::signedRoute('publicidad.baja', ['user' => $notifiable->id]).').');
    }
}
