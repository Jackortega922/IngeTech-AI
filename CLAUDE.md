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
  - Ambas fachadas delegan en funciones puras (sin I/O, sin FastAPI), testeables sin levantar
    nada: `recommender/scoring.py::recomendar()` (recomendación) y
    `recommender/segmentacion.py::segmentar()` (segmentación de clientes con K-Means para
    Marketing, [ADR 0006](docs/adr/0006-segmentacion-clientes-kmeans.md); en CLI se elige con
    `"operacion": "segmentar"`).
  - `app/Services/Recommender/` es el único lugar de Laravel que sabe cuál modo se usa
    (`RECOMMENDER_MODE`: `http`, `cli` o `mock`). Expone dos interfaces: `RecommenderClient`
    (`recomendar`) y `SegmentadorClientes` (`segmentar`); el binding está en
    `AppServiceProvider`. Las pruebas reemplazan esas interfaces con clases falsas.
- **El contrato JSON entre Laravel y el motor es sagrado:** está fijado en
  [docs/arquitectura/contrato-motor.md](docs/arquitectura/contrato-motor.md) y vale igual para
  el modo HTTP y el modo CLI. Cambiarlo exige actualizar ese documento en el mismo PR.
- **El motor es real, no un mock:** clasificación supervisada del perfil (regresión logística,
  `modelo_perfilado.joblib`) + similitud coseno contra el catálogo + 30% de afinidad con el
  cuestionario de bienvenida (`preferencias.py`). Lee el catálogo de `ml-engine/data/*.json`,
  que se regenera desde la BD con `php artisan motor:exportar-catalogo`: si cambias laptops o
  software en la BD, hay que exportar. Las laptops agotadas le llegan en `opciones.excluir_ids`.
- **Estado de `app/`:** tienda completa (catálogo público, compra con o sin cuenta, pedidos,
  boleta) + una sección por disciplina: Psicología (cuestionario), Contabilidad (IGV, boletas),
  Derecho (Libro de Reclamaciones, "Cómo decide la IA"), Administración (inventario con kardex,
  roles), Marketing (segmentación, cupones), Ambiental (recojo RAEE) e Industrial (KPIs).
  Detalle por disciplina en [docs/contexto-proyecto.md §5.1](docs/contexto-proyecto.md) y el
  modelo de datos en [docs/arquitectura/modelo-datos.md](docs/arquitectura/modelo-datos.md).
- **Reglas que se rompen fácil:**
  - El stock solo cambia por `App\Services\Tienda\Inventario` (no es asignable en masa): así
    el kardex y el stock no se desincronizan.
  - Los permisos del personal viven en `App\Support\Roles`; cada ruta de `/api/admin` usa el
    middleware `admin:<permiso>` y las pestañas del panel se llaman igual que el permiso.
  - El chat (`App\Services\Asistente\GeminiAsistente`) es un complemento, no el motor
    ([ADR 0005](docs/adr/0005-llm-complementario-no-motor.md)): solo recibe el catálogo y lo que
    escribe la persona, nunca sus datos (al personal le llega además su rol, para explicarle su
    panel con `App\Support\GuiaPanel`: si cambia una pestaña del panel, actualizar su guía). Si
    cambian garantía o devoluciones en `/derecho`, actualizar también su prompt. Las pruebas nunca
    llaman al Gemini real (`phpunit.xml`).
  - Tienda hipotética: razón social, RUC, contacto y redes quedan vacíos a propósito; no
    inventarlos.
- **Histórico:** `PC_EXPERT/` es el prototipo Tkinter previo (arma PCs por piezas). No se portó:
  el motor se construyó desde cero (A7 se fusionó con A8).

## Comandos

```bash
docker compose up -d db ml-engine                          # base de datos + motor
composer run dev                                           # servidor Laravel + colas + Vite
php artisan migrate                                         # BD
php artisan motor:exportar-catalogo                        # regenera ml-engine/data/laptops.json desde la BD
php artisan db:seed --class=ClientesDemoSeeder            # 26 clientes de demostración (segmentación y KPIs); se quitan con migrate:fresh --seed

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

> En el día a día Laravel corre nativo (Laragon) y `db` + `ml-engine` en Docker. Existe un
> contenedor `app` (tarea A2) detrás del perfil `docker-app`: `docker compose --profile docker-app up`.

CI (`.github/workflows/ci.yml`) tiene tres jobs independientes — `laravel` (Pint + test con SQLite
en memoria + `migrate` contra Postgres real), `frontend` (Prettier + ESLint + `tsc` + build; instala
solo Ziggy vía Composer, sin resto de PHP) y `ml-engine` (ruff + pytest, se omite si no existe
`requirements.txt`). Un cambio que solo toca un módulo puede seguir rompiendo otro job si toca algo
compartido (p. ej. el contrato JSON o una migración).

## Flujo de trabajo

Rama por tarea, PR pequeño, CI verde, review de Jack. Ver [CONTRIBUTING.md](CONTRIBUTING.md).
Nunca commitear a `main` directo.
