# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Guía para Claude Code en este repositorio.

**Lee [AGENTS.md](AGENTS.md) primero** — contiene las reglas de stack, límites por módulo y estilo
que aplican a cualquier asistente de IA. Este archivo solo añade lo específico de Claude Code.

## Antes de empezar una tarea

1. Identifica en qué módulo cae (`docs/modulos/`) y quién es su dueño (`.github/CODEOWNERS`).
2. No toques archivos fuera de ese módulo. Si hace falta, dilo y espera confirmación.
3. Para cambios de arquitectura o dependencias nuevas: propón un ADR en `docs/adr/` antes de codear.

## Arquitectura (el porqué detrás de varios archivos)

- **Flujo de punta a punta:** `resources/js/pages/` (Inertia/React) → Laravel API (`app/`) →
  motor de recomendación (`ml-engine/`) → catálogo en PostgreSQL. Diagrama completo en
  [docs/arquitectura/vision-general.md](docs/arquitectura/vision-general.md).
- **El motor Python corre en dos modos con el mismo código** (patrón heredado de *web-etabs*,
  ver [ADR 0003](docs/adr/0003-motor-python-subproceso.md)):
  - Local/Docker: servidor `uvicorn` (`ml-engine/app.py`), Laravel le hace POST HTTP.
  - Producción: Laravel ejecuta `ml-engine/cli_entry.py` como subproceso corto, le pasa el
    perfil por stdin y lee el JSON por stdout — sin servidor persistente.
  - Ambas fachadas delegan en `ml-engine/recommender/scoring.py::recomendar()`, que debe
    mantenerse puro (sin I/O, sin FastAPI) para poder testearse sin levantar nada.
  - `app/Services/Recommender/` es, por diseño, el único lugar de Laravel que sabe cuál de los
    dos modos se usa; **todavía no existe en este scaffold** — al crearlo, expón solo
    `recomendar($perfil)` hacia el resto de la app.
- **El contrato JSON entre Laravel y el motor es sagrado:** está fijado en
  [docs/arquitectura/contrato-motor.md](docs/arquitectura/contrato-motor.md) y vale igual para
  el modo HTTP y el modo CLI. Cambiarlo exige actualizar ese documento en el mismo PR.
- **Estado actual del código (scaffold):** `app/` solo trae lo generado por el React Starter Kit
  (auth, dashboard, settings) — aún no hay modelos ni controladores de laptops, recomendaciones
  o personalización. `ml-engine/recommender/scoring.py::recomendar()` es un **mock** que devuelve
  una respuesta con la forma del contrato pero sin lógica real (tareas A7–A9 la reemplazan).
- **Reutilización:** `PC_EXPERT/` (prototipo Tkinter previo) tiene lógica de recomendación y
  compatibilidad (`PC_EXPERT/src/recomendador_pro.py`, `compatibilidad.py`) y un catálogo JSON
  (`PC_EXPERT/data/`) que sirven de punto de partida para `ml-engine/` — pero arma PCs por
  presupuesto, mientras IngeTech AI recomienda laptops completas por perfil; hay que adaptar,
  no copiar literal.

## Comandos

```bash
docker compose up -d db ml-engine                          # base de datos + motor
composer run dev                                           # servidor Laravel + colas + Vite
php artisan migrate                                         # BD

php artisan test                                            # todas las pruebas Laravel (Pest/PHPUnit)
php artisan test --filter=NombreDelTest                     # una sola prueba
./vendor/bin/pint                                            # aplica estilo PHP
./vendor/bin/pint --test                                    # solo comprueba, sin escribir (lo que corre CI)

npm run lint && npx tsc --noEmit                            # lint + tipos frontend
npm run format                                               # Prettier (escribe)
npm run format:check                                        # Prettier (solo comprueba, lo que corre CI)

docker compose exec ml-engine pytest                        # todas las pruebas del motor
docker compose exec ml-engine pytest tests/test_scoring.py -k nombre_test   # una sola prueba
docker compose exec ml-engine ruff check .                  # lint Python
```

> El contenedor `app` (Laravel en Docker) llega en la tarea A2. Hasta entonces, la app corre
> nativa; `ml-engine` sí corre en Docker.

CI (`.github/workflows/ci.yml`) tiene tres jobs independientes — `laravel` (Pint + test con SQLite
en memoria + `migrate` contra Postgres real), `frontend` (Prettier + ESLint + `tsc` + build; instala
solo Ziggy vía Composer, sin resto de PHP) y `ml-engine` (ruff + pytest, se omite si no existe
`requirements.txt`). Un cambio que solo toca un módulo puede seguir rompiendo otro job si toca algo
compartido (p. ej. el contrato JSON o una migración).

## Flujo de trabajo

Rama por tarea, PR pequeño, CI verde, review de Jack. Ver [CONTRIBUTING.md](CONTRIBUTING.md).
Nunca commitear a `main` directo.
