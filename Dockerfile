# Imagen única para correr IngeTech AI "ya armada": Laravel + assets del frontend +
# Python (para invocar el motor de recomendación como subproceso — RECOMMENDER_MODE=cli,
# ver ADR 0003). En desarrollo diario se sigue usando `composer run dev` nativo; esta imagen
# sirve para probar en Docker (docker-compose, servicio `app`) y como base para producción
# (Render).

FROM node:20-bookworm AS node_binaries

FROM php:8.3-cli-bookworm

# Node se copia del stage anterior en vez de instalarlo vía NodeSource, para no depender de
# descargar una clave GPG externa en cada build.
COPY --from=node_binaries /usr/local/bin/node /usr/local/bin/node
COPY --from=node_binaries /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Dependencias de sistema: libpq-dev/libzip-dev para compilar extensiones PHP, Python3 para
# el motor. El symlink `python` es porque RECOMMENDER_CLI="python ml-engine/cli_entry.py"
# (en .env) usa ese nombre tal cual en Windows y en este contenedor.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libpq-dev libzip-dev libonig-dev python3 python3-pip \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && docker-php-ext-install pdo pdo_pgsql pgsql mbstring bcmath zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Laravel necesita poder escribir en storage/ y bootstrap/cache/ (vistas compiladas, logs,
# cache de config/rutas) — se asegura aunque el checkout del host no traiga esas carpetas.
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader \
    && npm ci \
    && npm run build \
    && python3 -m pip install --break-system-packages --no-cache-dir -r ml-engine/requirements.txt

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
