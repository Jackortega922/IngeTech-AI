# Backlog

Priorización **MoSCoW**: **M** must (sin esto no hay MVP) · **S** should · **C** could · **W** won't (por ahora).

El tablero Kanban vive en Trello/Jira; este archivo es el respaldo versionado y la fuente de la
priorización. Actualízalo cuando cambie el alcance.

## Épica 1 — Núcleo técnico (Módulo A) — *Bloque I*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| A1 | Scaffold Laravel + Breeze (Inertia/React) + PostgreSQL | M | Jack | ☐ |
| A2 | docker-compose + Dockerfile (PHP + Python) | M | Jack | ☐ |
| A3 | Migraciones y modelos base | M | Jack | ☐ |
| A4 | `GET /api/health` | M | Jack | ☐ |
| A5 | `POST /api/recomendaciones` con motor MOCK | M | Jack | ☐ |
| A6 | CI (jobs laravel + ml-engine + frontend) | M | Jack | ☐ |
| A7 | Motor: portar lógica de PC_EXPERT a `ml-engine/recommender/` | M | Jack | ☐ |
| A8 | Motor: scoring por perfil + explicación de factores | M | Jack | ☐ |
| A9 | Conectar API real al motor (quitar mock) | M | Jack | ☐ |
| A10 | Despliegue a Render + staging | M | Jack | ☐ |
| A11 | Registro de eventos + endpoint de KPIs | S | Jack | ☐ |
| A12 | Swagger/OpenAPI publicado | S | Jack | ☐ |

## Épica 2 — Flujo de usuario (Módulo B) — *Bloque I / UX*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| B1 | Pantalla Perfil — formulario por pasos | M | Marco | ☐ |
| B2 | Envío del perfil a `/api/recomendaciones` | M | Marco | ☐ |
| B3 | Pantalla Resultado — laptop + % compatibilidad | M | Marco | ☐ |
| B4 | Resultado — explicación (factores y advertencias) | M | Marco | ☐ |
| B5 | Pantalla Personalización — RAM/SSD + recálculo de precio | S | Marco | ☐ |
| B6 | Personalización — kits y accesorios | S | Marco | ☐ |
| B7 | Estados de carga / error / sin resultados | M | Marco | ☐ |
| B8 | Responsive + revisión de usabilidad | S | Marco | ☐ |

## Épica 3 — Catálogo, datos y documentación (Módulo C) — *Bloques I, III, IV*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| C1 | Plantilla de ficha de laptop | M | Diego | ☐ |
| C2 | 15+ laptops reales verificadas (`laptops.json`) | M | Diego | ☐ |
| C3 | `actividades.json` y `software.json` (acordado con Marco) | M | Diego | ☐ |
| C4 | `CatalogoSeeder` — carga JSON → BD | M | Diego | ☐ |
| C5 | Pantalla admin — listado de laptops | S | Diego | ☐ |
| C6 | Admin — crear/editar laptop | S | Diego | ☐ |
| C7 | Admin — accesorios y kits | C | Diego | ☐ |
| C8 | Manual de usuario | S | Diego | ☐ |
| C9 | Guion de UAT + formulario de feedback | S | Diego | ☐ |

## Épica 4 — Impacto y presentación — *Bloques III y IV*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| D1 | Definir KPIs/OKRs (compatibilidad promedio, tiempo de decisión…) | M | equipo | ☐ |
| D2 | Dashboard de impacto (Grafana/Power BI) | S | Jack | ☐ |
| D3 | Informe de evaluación de impacto socio-tecnológico | M | equipo | ☐ |
| D4 | Memoria Técnica | M | equipo | ☐ |
| D5 | Póster / artículo | S | equipo | ☐ |
| D6 | Ensayo de la sustentación (live demo) | M | equipo | ☐ |

## Won't (por ahora)

- Cuentas de usuario finales / login público (el perfil es anónimo en el MVP).
- App móvil nativa.
- Modelo de ML avanzado (redes neuronales). Se empieza con scoring ponderado + similitud.
- Pasarela de pago / compra real.
