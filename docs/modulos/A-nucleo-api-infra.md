# Módulo A — Núcleo · API · Motor de recomendación · Infra

**Dueño:** Jack · **IA:** Claude

Es la columna vertebral: todo lo demás depende de este módulo. Incluye también el rol de
**integrador** (revisar y mezclar los PR de B y C).

## Objetivo

1. App Laravel funcionando con auth y roles.
2. API que conecta el frontend con el motor y con la base de datos.
3. Motor de recomendación en Python que devuelve laptop + % de compatibilidad + explicación.
4. Infraestructura: Docker, CI/CD, despliegue en Render, entorno de staging estable.
5. Registro de eventos y KPIs para el dashboard de impacto.

## Carpetas que te pertenecen

```
app/                              # controladores, modelos, servicios, jobs
routes/                           # api.php, web.php
config/  bootstrap/
database/migrations/              # esquema base (usuarios, perfiles, recomendaciones, eventos)
ml-engine/                        # motor Python completo
  ├── app.py                      # FastAPI (modo servidor, local)
  ├── cli_entry.py                # modo subproceso (producción)
  ├── recommender/                # scoring + modelo scikit-learn (funciones puras)
  ├── data/                       # (esquema y catálogos de referencia — el contenido lo llena C)
  ├── notebooks/                  # exploración de datos (curso de IA)
  └── tests/
.github/workflows/                # CI
Dockerfile  docker-compose.yml    # infra
app/Services/Recommender/         # cliente del motor (HTTP local / subproceso prod)
app/Services/Analitica/           # registro de eventos y cálculo de KPIs
```

## Qué NO tocas

- `resources/js/Pages/{Perfil,Resultado,Personalizar}/` → Módulo B.
- `resources/js/Pages/Admin/Catalogo/`, `database/seeders/`, contenido de `ml-engine/data/*.json` → Módulo C.
- Si necesitas un cambio ahí, ábrelo como sub-tarea y pídeselo al dueño.

## Interfaces que provees (y que otros consumen)

| Interfaz | Consumidor | Documento |
|---|---|---|
| `POST /api/recomendaciones` | Módulo B | [../arquitectura/contrato-motor.md](../arquitectura/contrato-motor.md) |
| Esquema base de BD (`laptops`, `accesorios`, `kits` con columnas mínimas) | Módulo C | `database/migrations/` |
| Layout raíz Inertia + componentes base (Button, Input…) | Módulo B y C | `resources/js/Components/` |

Mantén estables esas interfaces. Si cambian, avisa en el grupo y actualiza el documento en el mismo PR.

## Primeras tareas (orden sugerido)

1. `chore: scaffold Laravel 11 + Breeze (Inertia/React) + PostgreSQL`
2. `chore: docker-compose (app + postgres + ml-engine) + Dockerfile PHP+Python`
3. `feat: migraciones base + modelos (Laptop, Accesorio, Kit, PerfilUsuario, Recomendacion, EventoAnalitica)`
4. `feat: GET /api/health`
5. `feat: POST /api/recomendaciones con motor MOCK` (respuesta fija según el contrato) — **desbloquea a B**
6. `feat: seeders con columnas mínimas de catálogo` — **desbloquea a C**
7. `chore: CI real (jobs laravel + ml-engine + frontend)`
8. `feat: ml-engine — portar recomendador_pro.py y compatibilidad.py de PC_EXPERT`
9. `feat: scorer por perfil (ponderado) + explicación de factores`
10. `feat: reemplazar el mock por la llamada real al motor`
11. `feat: registro de eventos + endpoint de KPIs`
12. `chore: deploy a Render + staging`

## Cómo probar

```bash
docker compose exec app php artisan test
docker compose exec app ./vendor/bin/pint --test
docker compose exec ml-engine pytest -q
docker compose exec ml-engine ruff check .
```

## Definición de "hecho"

- Tests verdes en CI.
- Endpoint documentado en Swagger/OpenAPI.
- Sin credenciales en el código.
- El contrato del motor y los diagramas de `docs/arquitectura/` reflejan la realidad.
