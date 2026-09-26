#!/bin/sh
# Arranque del contenedor en cualquier entorno (docker-compose local o Render).
#
# - Migra la base de datos en cada arranque: php artisan migrate ya es idempotente (las
#   migraciones que ya corrieron se saltan), así que es seguro correrlo siempre en vez de
#   depender de un paso manual aparte.
# - Escucha en $PORT si el proveedor lo define (Render lo fija dinámicamente, típicamente
#   10000); si no está definido (docker-compose local), usa 8000 como hoy.
set -e

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
