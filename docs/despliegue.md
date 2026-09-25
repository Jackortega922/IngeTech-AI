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
3. En el dashboard del proyecto, copia el **connection string** — Neon lo da como
   `postgresql://usuario:password@host/basededatos?sslmode=require`. De ahí sacas
   `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` por separado.

**Opción Supabase** (https://supabase.com): igual de válida — "New project", y las
credenciales de Postgres están en `Project Settings → Database`.

Guarda esos 4 datos (host, base de datos, usuario, contraseña) — se necesitan en el paso 3.

> Nota: Neon usa SSL obligatorio (`sslmode=require`). Si el primer deploy falla al conectar,
> revisar si hace falta agregar `?sslmode=require` a la configuración de conexión de Laravel.

## 2. Crear la cuenta en Render y conectar el repo

1. Crea una cuenta en https://render.com (con GitHub, así conecta el repo directo).
2. "New" → "Blueprint" → selecciona el repositorio `IngeTech-AI`. Render detecta
   automáticamente el archivo `render.yaml` de la raíz y propone crear el servicio `ingetech-ai`
   ya configurado (Docker, healthcheck en `/up`, variables de entorno declaradas).

## 3. Completar las variables de entorno secretas

`render.yaml` deja varias variables como "sync: false" (secretas) a propósito, para no
commitear credenciales. Render pedirá completarlas al crear el Blueprint:

| Variable | De dónde sale |
|---|---|
| `APP_KEY` | Correr localmente `php artisan key:generate --show` y pegar el valor (empieza con `base64:`) |
| `APP_URL` | La URL que Render asigna al servicio (ej. `https://ingetech-ai.onrender.com`) — se sabe después del primer deploy, se puede dejar vacío y completar después |
| `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Los 4 datos del paso 1 (Neon/Supabase) |

## 4. Primer deploy

Render construye la imagen (`Dockerfile`) y arranca el contenedor. `docker/entrypoint.sh`
corre `php artisan migrate --force` automáticamente en cada arranque — así que las tablas se
crean solas en el primer deploy, sin pasos manuales.

**Sembrar datos de ejemplo (una sola vez):** las migraciones no cargan carreras, software,
laptops ni las cuentas demo — eso lo hacen los seeders. Desde el dashboard de Render:
`Shell` (en el servicio `ingetech-ai`) → correr:
```bash
php artisan db:seed
```

## 5. Verificar

Abrir la URL que Render asignó. Debería verse la landing de IngeTech AI con estilos
(si se ve sin estilos, revisar que `npm run build` haya corrido bien en los logs del build —
ver la nota sobre `public/build` en `docs/arquitectura/`).

Probar login con las cuentas demo del seeder (`admin@ingetech.test` / `estudiante@ingetech.test`,
contraseña `password`) y correr el flujo completo (Perfil → Resultado) para confirmar que el
motor de recomendación (modo `cli`, subproceso) responde bien contra la base de datos real.

## 6. El día de la sustentación

El plan gratuito de Render duerme el servicio tras 15 minutos sin tráfico y tarda ~1 minuto en
despertar con la primera visita. **Entra a la URL 2-3 minutos antes de presentar** para que ya
esté despierta cuando el jurado la abra.
