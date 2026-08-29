# CLAUDE.md

Guía para Claude Code en este repositorio.

**Lee [AGENTS.md](AGENTS.md) primero** — contiene las reglas de stack, límites por módulo y estilo
que aplican a cualquier asistente de IA. Este archivo solo añade lo específico de Claude Code.

## Antes de empezar una tarea

1. Identifica en qué módulo cae (`docs/modulos/`) y quién es su dueño (`.github/CODEOWNERS`).
2. No toques archivos fuera de ese módulo. Si hace falta, dilo y espera confirmación.
3. Para cambios de arquitectura o dependencias nuevas: propón un ADR en `docs/adr/` antes de codear.

## Comandos

```bash
docker compose up -d db ml-engine     # base de datos + motor
composer run dev                      # servidor Laravel + colas + Vite
php artisan migrate                   # BD
php artisan test                      # pruebas Laravel (Pest)
./vendor/bin/pint                     # estilo PHP
npm run lint && npx tsc --noEmit      # lint + tipos frontend
npm run format                        # Prettier frontend
docker compose exec ml-engine pytest  # pruebas motor
docker compose exec ml-engine ruff check .   # lint Python
```

> El contenedor `app` (Laravel en Docker) llega en la tarea A2. Hasta entonces, la app corre nativa.

## Flujo de trabajo

Rama por tarea, PR pequeño, CI verde, review de Jack. Ver [CONTRIBUTING.md](CONTRIBUTING.md).
Nunca commitear a `main` directo.
