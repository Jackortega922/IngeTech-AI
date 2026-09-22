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
  - Ambas fachadas delegan en `ml-engine/recommender/scoring.py::recomendar()`, que orquesta el
    resto de `recommender/` (funciones puras, sin I/O salvo `catalogo.py`).
  - `app/Services/Recommender/RecommenderClient` (interfaz) + `HttpRecommenderClient` /
    `CliRecommenderClient` es el único lugar de Laravel que sabe cuál de los dos modos se usa
    (bind por `config('recommender.mode')` en `AppServiceProvider`); el resto de la app solo
    inyecta `RecommenderClient` y llama `recomendar($perfil)`.
- **El contrato JSON entre Laravel y el motor es sagrado:** está fijado en
  [docs/arquitectura/contrato-motor.md](docs/arquitectura/contrato-motor.md) y vale igual para
  el modo HTTP y el modo CLI. Cambiarlo exige actualizar ese documento en el mismo PR.
- **El motor de recomendación ya es real (A7-A9), no un mock:** `ml-engine/recommender/`
  clasifica el perfil con un modelo supervisado entrenado (`perfilado.py`, `.joblib` commiteado,
  se reentrena a mano con `entrenamiento/entrenar_perfilado.py`) y calcula compatibilidad con
  similitud coseno contra el catálogo (`similitud.py`), descompuesta en factores explicables
  reales (no texto inventado). `ml-engine/data/*.json` hoy trae un **catálogo semilla** (8
  laptops) — lo reemplaza el Módulo C (Marco) con datos reales verificados (C1-C4), sin que eso
  rompa nada del motor.
- **`PC_EXPERT/` no resultó reutilizable** (evaluado en A7): es lógica 100% Python puro sin ML
  para armar PCs de escritorio por piezas sueltas, un dominio distinto a recomendar laptops
  completas por perfil. El motor se construyó desde cero; no busques código para "portar" de ahí.
- **Docker completo (A2):** además de `db` y `ml-engine`, el servicio `app` (`Dockerfile` en la
  raíz, PHP 8.3 + Node + Python en una sola imagen) ya existe — `docker compose up -d --build`
  corre todo sin instalar nada en el host. Para desarrollo activo sigue siendo más rápido
  `composer run dev` nativo (el contenedor `app` no monta el código en vivo, corre la imagen ya
  compilada — ver comentarios en `docker-compose.yml`).

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

> `docker compose up -d --build` levanta los 3 servicios (`db`, `ml-engine`, `app`) sin instalar
> nada en el host. Para programar día a día sigue siendo más rápido lo de arriba (nativo).

CI (`.github/workflows/ci.yml`) tiene tres jobs independientes — `laravel` (Pint + test con SQLite
en memoria + `migrate` contra Postgres real), `frontend` (Prettier + ESLint + `tsc` + build; instala
solo Ziggy vía Composer, sin resto de PHP) y `ml-engine` (ruff + pytest, se omite si no existe
`requirements.txt`). Un cambio que solo toca un módulo puede seguir rompiendo otro job si toca algo
compartido (p. ej. el contrato JSON o una migración).

## Flujo de trabajo

Rama por tarea, PR pequeño, CI verde, review de Jack. Ver [CONTRIBUTING.md](CONTRIBUTING.md).
Nunca commitear a `main` directo.
