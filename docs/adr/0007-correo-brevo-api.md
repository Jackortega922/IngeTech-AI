# ADR 0007 — En producción el correo sale por la API de Brevo, no por SMTP

- **Fecha:** 2026-10-08
- **Estado:** Aceptada

## Contexto

La tienda envía correos de verdad: confirmación de compra, cambios de estado del pedido,
Libro de Reclamaciones y "¿Olvidaste tu contraseña?". Esto último es además la **única forma** de
que el administrador ponga su contraseña, porque el seeder la genera al azar y no la guarda.

En local se usa Gmail por SMTP con una contraseña de aplicación. Pero desde septiembre de 2025 el
**plan gratuito de Render bloquea la salida a los puertos SMTP (25, 465 y 587)**, así que en
producción ese envío falla.

## Decisión

En producción se usa **Brevo por su API HTTPS** (`MAIL_MAILER=brevo`), con el conector oficial de
Symfony Mailer (`symfony/brevo-mailer` y `symfony/http-client`). El transporte se registra en
`AppServiceProvider` con `Mail::extend('brevo', …)` y la clave `BREVO_API_KEY`.

En local nada cambia: sigue `log` o Gmail SMTP según el `.env`.

## Por qué

- **Funciona en el plan gratuito:** la API va por HTTPS (puerto 443), que Render no bloquea.
- **Gratis y suficiente:** 300 correos al día, de sobra para una tienda de demostración.
- **Sin dominio propio:** Brevo deja verificar un solo correo (p. ej. el Gmail del equipo) como
  remitente. Otras opciones por API (Resend, Postmark) exigen un dominio verificado para escribir
  a cualquier destinatario.
- **Sin tocar las notificaciones:** Laravel cambia de transporte por configuración; las clases
  de `app/Notifications/` siguen igual.

## Alternativas descartadas

- **Pagar Render (≈7 USD/mes):** desbloquea SMTP y Gmail funcionaría tal cual, pero es un costo
  mensual para un proyecto académico.
- **Desplegar sin correo:** el admin no podría poner su contraseña y los clientes no recibirían
  confirmaciones.

## Consecuencias

- Hay que crear una cuenta en Brevo, verificar el remitente y cargar `BREVO_API_KEY` y
  `MAIL_FROM_ADDRESS` en Render (`render.yaml`, variables `sync: false`).
- Los correos de un remitente Gmail enviados por un tercero pueden caer en spam; para la
  demostración basta con revisar esa carpeta.
