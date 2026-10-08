# Despliegue a Render (A10)

Guía paso a paso para publicar IngeTech AI en una URL real, gratis. Como crear cuentas y
pegar credenciales requiere acceso humano, estos pasos los hace una persona del equipo — el
repo ya trae listo todo lo demás (`Dockerfile`, `docker/entrypoint.sh`, `render.yaml`).

## Por qué dos proveedores distintos (no todo en Render)

El Postgres gratuito de Render **expira a los 30 días** y se borra tras 14 días de gracia si
no se paga — mal para un proyecto de semestre. Por eso la base de datos vive en un proveedor
sin vencimiento (Neon o Supabase) y solo la app (Laravel + el motor, como subproceso) va en
Render. Todo esto queda en el plan gratuito de ambos.

## 1. Crear la base de datos (Neon o Supabase — cualquiera sirve)

**Opción Neon** (https://neon.tech):
1. Crea una cuenta gratuita (puede ser con GitHub).
2. "Create a project" → elige una región cercana (o "US East" si no hay una de Sudamérica).
   De los servicios que ofrece, solo hace falta **Postgres database**; el resto (Object
   storage, Functions, AI gateway, Neon Auth) se deja apagado — Laravel ya trae lo suyo.
3. Botón **Connect** → **apaga "Connection pooling"** y copia el **connection string**
   completo (con "Show password"). Queda así:
   `postgresql://usuario:password@host/basededatos?sslmode=require`

> **Por qué sin pooling:** el pooler de Neon es PgBouncer en modo transacción, que tiene
> incompatibilidades conocidas con los *prepared statements* de PHP/PDO (errores intermitentes
> tipo "prepared statement already exists"). La app corre en un solo proceso, así que el
> pooling no aporta nada a cambio de ese riesgo.

**Opción Supabase** (https://supabase.com): igual de válida — "New project", y la cadena de
conexión está en `Project Settings → Database`.

Guarda esa cadena completa — es lo único que se necesita de la base de datos (paso 3).

## 2. Crear la cuenta en Render y conectar el repo

1. Crea una cuenta en https://render.com (con GitHub, así conecta el repo directo).
2. "New" → "Blueprint" → selecciona el repositorio `IngeTech-AI`. Render detecta
   automáticamente el archivo `render.yaml` de la raíz y propone crear el servicio `ingetech-ai`
   ya configurado (Docker, healthcheck en `/up`, variables de entorno declaradas).

## 3. Correo con Brevo (el plan gratuito bloquea SMTP)

Desde septiembre de 2025 el plan gratuito de Render **bloquea los puertos SMTP** (25, 465, 587):
Gmail por SMTP no funciona ahí. Por eso en producción el correo sale por la API HTTPS de Brevo
([ADR 0007](adr/0007-correo-brevo-api.md)). Sin correo, el administrador no puede poner su
contraseña (se pone con «¿Olvidaste tu contraseña?»).

1. Crea una cuenta gratuita en https://www.brevo.com (300 correos al día).
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: agrega el correo que firmará
   los mensajes (p. ej. tu Gmail) y confírmalo con el enlace que te llega.
3. **SMTP & API → API Keys → Generate a new API key**: cópiala (empieza con `xkeysib-`). Solo
   se muestra una vez.

Para probarlo antes en local: en tu `.env` pon `MAIL_MAILER=brevo`, `BREVO_API_KEY=...` y
`MAIL_FROM_ADDRESS=` el remitente verificado, y haz una compra de prueba.

## 4. Completar las variables de entorno secretas

`render.yaml` deja varias variables como "sync: false" (secretas) a propósito, para no
commitear credenciales. Render las pide al crear el Blueprint; si el servicio **ya existe**, las
nuevas se agregan a mano en **Environment → Add Environment Variable**:

| Variable | De dónde sale |
|---|---|
| `APP_KEY` | Correr localmente `php artisan key:generate --show` y pegar el valor (empieza con `base64:`) |
| `APP_URL` | La URL que Render asigna al servicio (ej. `https://ingetech-ai.onrender.com`). Los enlaces de los correos se arman con ella |
| `DB_URL` | La cadena de conexión completa del paso 1, tal cual (`postgresql://...?sslmode=require`) |
| `BREVO_API_KEY` | La clave del paso 3 |
| `MAIL_FROM_ADDRESS` | El remitente verificado en Brevo |
| `GEMINI_API_KEY` | Google AI Studio (opcional: sin ella el chat responde por palabras clave) |
| `ADMIN_NAME` / `ADMIN_EMAIL` | Tu nombre y el correo del administrador |

Las claves se pegan solo en el panel de Render y en tu `.env`, nunca en el código ni en chats.

## 5. Primer deploy y datos iniciales

Render construye la imagen (`Dockerfile`) y arranca el contenedor. `docker/entrypoint.sh`:
- corre `php artisan migrate --force` en cada arranque (las tablas se crean solas), y
- deja procesando la cola de correos en segundo plano en el mismo contenedor (el plan gratuito
  no tiene "worker" aparte).

**Sembrar los datos (una sola vez, desde tu PC):** el plan gratuito no tiene la pestaña
`Shell`, así que los seeders (carreras, software, laptops, kits y el administrador) se corren
desde tu computadora apuntando a la base de Neon. En PowerShell, en la carpeta del proyecto
(la cadena se pega solo en tu terminal):

```powershell
$env:DB_CONNECTION = "pgsql"
$env:DB_URL = "postgresql://...?sslmode=require"   # la de Neon
$env:ADMIN_NAME = "Tu nombre"
$env:ADMIN_EMAIL = "tu-correo@gmail.com"
php artisan migrate:fresh --seed --force             # BORRA todo en Neon y lo vuelve a crear
Remove-Item Env:DB_URL, Env:DB_CONNECTION, Env:ADMIN_NAME, Env:ADMIN_EMAIL
```

`migrate:fresh` **borra todas las tablas** de esa base: úsalo solo para empezar de cero. Al cerrar
la terminal (o con la última línea) tu PC vuelve a usar la base local del `.env`.

Luego, en la URL de Render: **/login → ¿Olvidaste tu contraseña?** con `ADMIN_EMAIL` para poner
tu contraseña. El resto del equipo se registra en el sitio y el admin le asigna su rol en
**Panel → Usuarios**.

## 6. Si algo falla: dónde mirar

Los logs de Render (pestaña **Logs**) muestran las peticiones que atiende el servidor y las
excepciones de la app — esto último funciona porque `render.yaml` fija `LOG_CHANNEL=stderr`.
Sin eso, Laravel escribiría los errores en `storage/logs/laravel.log` *dentro* del contenedor
y en Render solo se verían las peticiones, sin la causa.

Si aun así hace falta hurgar dentro del contenedor, la pestaña **Shell** da una terminal (solo
en planes de pago):

```bash
tail -n 40 storage/logs/laravel.log   # errores viejos, previos a LOG_CHANNEL=stderr
php artisan about                     # resumen de configuración efectiva
php artisan migrate:status            # ¿conectó a la BD? ¿qué migraciones corrieron?
```

## 7. Verificar

Abrir la URL que Render asignó. Debería verse la landing de IngeTech AI con estilos
(si se ve sin estilos, revisar que `npm run build` haya corrido bien en los logs del build —
ver la nota sobre `public/build` en `docs/arquitectura/`).

Probar login con el administrador del seeder (`ADMIN_EMAIL`; su contraseña se pone con «¿Olvidaste
tu contraseña?», que necesita Brevo configurado, paso 3) y correr el flujo completo (Perfil → Resultado) para confirmar que el
motor de recomendación (modo `cli`, subproceso) responde bien contra la base de datos real.

## 8. El día de la sustentación

El plan gratuito de Render duerme el servicio tras 15 minutos sin tráfico y tarda ~1 minuto en
despertar con la primera visita. **Entra a la URL 2-3 minutos antes de presentar** para que ya
esté despierta cuando el jurado la abra.
