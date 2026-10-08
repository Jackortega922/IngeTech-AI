#!/bin/sh
# Arranque del contenedor en cualquier entorno (docker-compose local o Render).
#
# - Migra la base de datos en cada arranque: php artisan migrate ya es idempotente (las
#   migraciones que ya corrieron se saltan), así que es seguro correrlo siempre en vez de
#   depender de un paso manual aparte.
# - Procesa la cola (correos de pedidos y reclamos) en segundo plano, en este mismo contenedor:
#   el plan gratuito de Render no da un "worker" aparte. Si un envío falla, queda en failed_jobs
#   y la compra del cliente no se ve afectada. El bucle lo relanza si termina (--max-time).
# - Escucha en $PORT si el proveedor lo define (Render lo fija dinámicamente, típicamente
#   10000); si no está definido (docker-compose local), usa 8000 como hoy.
set -e

php artisan migrate --force

(
    while true; do
        php artisan queue:work --tries=3 --backoff=30 --sleep=3 --max-time=3600 || true
        sleep 2
    done
) &

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
