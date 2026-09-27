# Backlog

Priorización **MoSCoW**: **M** must (sin esto no hay MVP) · **S** should · **C** could · **W** won't (por ahora).

El tablero Kanban vive en Trello/Jira; este archivo es el respaldo versionado y la fuente de la
priorización. Actualízalo cuando cambie el alcance.

## Épica 1 — Núcleo técnico (Módulo A) — *Bloque I*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| A1 | Scaffold — React Starter Kit (Laravel 12 + Inertia/React/TS) + PostgreSQL | M | Jack | ✅ |
| A6 | CI (jobs laravel + ml-engine + frontend) | M | Jack | ✅ |
| A2 | docker-compose (contenedor `app`) + Dockerfile (PHP + Python) | M | Jack | ✅ |
| A3 | Migraciones y modelos base | M | Jack | ✅ |
| A4 | `GET /api/health` | M | Jack | ✅ |
| A5 | `POST /api/recomendaciones` con motor MOCK | M | Jack | ✅ |
| A7 | ~~Motor: portar lógica de PC_EXPERT~~ — se fusionó con A8 (PC_EXPERT no era portable: reglas de piezas sueltas sin ML, dominio distinto) | M | Jack | ✅ |
| A8 | Motor: scoring real (clasificación supervisada + similitud coseno) + explicación de factores | M | Jack | ✅ |
| A9 | Conectar API real al motor (quitar mock) — resuelto gratis: `app.py`/`cli_entry.py` ya delegaban en `recomendar()`, solo cambió su interior | M | Jack | ✅ |
| A14 | Sincronizar el catálogo del motor (`ml-engine/data/laptops.json`) con la BD de Laravel — eran dos catálogos distintos con los mismos IDs, así que `Laptop::find($laptop_id)` podía mostrar specs/foto de un equipo que no era el que el motor calificó. Resuelto: `ml-engine/data/laptops.json` ahora se genera desde las 14 laptops reales de `LaptopSeeder` (mismos IDs 1-14). Pendiente: automatizar esta exportación en vez de regenerarla a mano cada vez que cambie el seeder. | M | Jack | ✅ |
| A10 | Despliegue a Render + staging | M | Jack | ☐ |
| A11 | Registro de eventos + endpoint de KPIs | S | Jack | ✅ |
| A12 | Swagger/OpenAPI publicado | S | Jack | ☐ |
| A13 | Asistente conversacional complementario (LLM vía API, ej. DeepSeek) — **no reemplaza el motor de scoring**, es una función aparte (ver [ADR 0005](../adr/0005-llm-complementario-no-motor.md)) | C | Jack | ☐ |

## Épica 2 — Flujo de usuario (Módulo B) — *Bloque I / UX*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| B1 | Pantalla Perfil — formulario por pasos | M | Marco | ✅ |
| B2 | Envío del perfil a `/api/recomendaciones` | M | Marco | ✅ |
| B3 | Pantalla Resultado — laptop + % compatibilidad | M | Marco | ✅ |
| B4 | Resultado — explicación (factores y advertencias) | M | Marco | ✅ |
| B5 | Pantalla Personalización — RAM/SSD + recálculo de precio | S | Marco | ✅ |
| B6 | Personalización — kits y accesorios | S | Marco | ✅ |
| B7 | Estados de carga / error / sin resultados | M | Marco | ✅ |
| B8 | Responsive + revisión de usabilidad | S | Marco | ☐ |

## Épica 3 — Catálogo, datos y documentación (Módulo C) — *Bloques I, III, IV*

Dueño: Marco (además del Módulo B). Diego colabora de forma ocasional — cuando tome una
historia puntual de aquí, se reasigna esa fila y se avisa en el grupo.

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| C1 | Plantilla de ficha de laptop | M | Marco | ✅ |
| C2 | 15+ laptops reales verificadas (`laptops.json`) | M | Marco | ⚠️ — hay 14 en `LaptopSeeder`, ya sincronizadas 1 a 1 con `ml-engine/data/laptops.json` (ver A14). Falta 1 para llegar a 15+ y falta el paso de "verificadas" (specs/precio confirmados en tienda real, hoy son referenciales). |
| C3 | `actividades.json` y `software.json` (deben calzar con el formulario de Perfil) | M | Marco | ✅ |
| C4 | `CatalogoSeeder` — carga JSON → BD | M | Marco | ✅ — vía seeders (`LaptopSeeder`, `SoftwareSeeder`, `ActividadSeeder`, `CarreraSeeder`) |
| C5 | Pantalla admin — listado de laptops | S | Marco | ✅ |
| C6 | Admin — crear/editar laptop | S | Marco | ✅ |
| C7 | Admin — accesorios y kits | C | Marco | ☐ |
| C8 | Manual de usuario | S | Marco | ☐ |
| C9 | Guion de UAT + formulario de feedback | S | Marco | ☐ |

## Épica 4 — Impacto y presentación — *Bloques III y IV*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| D1 | Definir KPIs/OKRs (compatibilidad promedio, tiempo de decisión…) | M | equipo | ☐ |
| D2 | Dashboard de impacto (Grafana/Power BI) | S | Jack | ☐ |
| D3 | Informe de evaluación de impacto socio-tecnológico | M | equipo | ☐ |
| D4 | Memoria Técnica | M | equipo | ☐ |
| D5 | Póster / artículo | S | equipo | ☐ |
| D6 | Ensayo de la sustentación (live demo) | M | equipo | ☐ |
| D7 | ~~Panel Jira/Trello~~ + acta de gobernanza del equipo — el acta ya se presentó; el tablero se descartó porque el docente no lo evalúa | M | equipo | ✅ |
| D8 | Encuesta de usabilidad (SUS) sobre el flujo de usuario | S | equipo | ☐ |
| D9 | Artículo científico en formato IEEE | S | equipo | ☐ |
| D10 | Análisis de licencias (Open Source vs. propietario) del stack usado | C | Jack | ☐ |

## Épica 5 — Disciplinas integradas a la recomendación

Aprobada el 2026-09-27. La primera versión de las disciplinas (ver
[contexto-proyecto.md §5.1](../contexto-proyecto.md)) quedó *al lado* de la recomendación:
páginas y métricas que la observan pero no la tocan. El docente evalúa el sistema como cliente
y quiere ver cada disciplina al servicio del objetivo principal — recomendar laptops con IA —,
así que cada una se engancha en un paso del flujo (Perfil → Motor → Resultado → Personalizar).

Todo se construye en la capa de Laravel: el motor de IA y su contrato v0 no se tocan. Los
datos nuevos que haga falta (garantía, etc.) deben ser reales o quedar marcados como
referenciales.

| # | Disciplina | Historia | Paso del flujo | Prio | Dueño | Estado |
|---|---|---|---|---|---|---|
| E1 | Derecho | Consentimiento del uso de datos antes de enviar el perfil (Ley 29733); garantía por equipo en el resultado | Perfil / Resultado | M | Jack | ☐ |
| E2 | Ing. Industrial | Medir la calidad de la recomendación: tasa de elección de la opción recomendada, compatibilidad promedio, tiempo de decisión (resuelve D1) | Todo el recorrido | M | Jack | ☐ |
| E3 | Psicología | Pregunta de prioridad en el perfil (precio / rendimiento / durabilidad) que reordena las opciones; mantener 3 opciones para no saturar la decisión | Perfil → Resultado | S | Jack | ☐ |
| E4 | Ing. Ambiental | Indicador de durabilidad por equipo (ampliabilidad de RAM → vida útil → menos residuo electrónico) | Resultado | S | Jack | ☐ |
| E5 | Contabilidad | Precio al contado vs. en cuotas y costo por año de uso (usa la vida útil de E4) | Resultado | S | Jack | ☐ |
| E6 | Marketing | Kit sugerido según el perfil (venta cruzada), con el ahorro frente a comprarlo suelto | Personalizar | S | Jack | ☐ |
| E7 | Administración | Panel de salud del catálogo que alimenta a la IA: carreras sin software asignado, equipos sin precio verificado | Admin | C | Jack | ☐ |

## Won't (por ahora)

- Cuentas de usuario finales / login público (el perfil es anónimo en el MVP).
- App móvil nativa.
- Modelo de ML avanzado (redes neuronales). Se empieza con scoring ponderado + similitud.
- Pasarela de pago / compra real.
