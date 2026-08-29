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
docker compose up --build                              # levanta todo
docker compose exec app php artisan migrate --seed     # BD
docker compose exec app php artisan test               # tests Laravel
docker compose exec app ./vendor/bin/pint              # estilo PHP
docker compose exec ml-engine pytest                   # tests motor
docker compose exec ml-engine ruff check .             # lint Python
npm run dev / npm run build                            # frontend (dentro de app)
```

## Flujo de trabajo

Rama por tarea, PR pequeño, CI verde, review de Jack. Ver [CONTRIBUTING.md](CONTRIBUTING.md).
Nunca commitear a `main` directo.
