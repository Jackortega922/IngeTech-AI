# Backlog

Priorización **MoSCoW**: **M** must (sin esto no hay MVP) · **S** should · **C** could · **W** won't (por ahora).

Este archivo es la fuente de la priorización (el tablero Trello/Jira se descartó, ver D7).
Actualízalo cuando cambie el alcance. Última revisión: 2026-10-08.

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
| A14 | Sincronizar el catálogo del motor (`ml-engine/data/laptops.json`) con la BD de Laravel — eran dos catálogos distintos con los mismos IDs, así que `Laptop::find($laptop_id)` podía mostrar specs/foto de un equipo que no era el que el motor calificó. Resuelto: `ml-engine/data/laptops.json` ahora se genera desde las 14 laptops reales de `LaptopSeeder` (mismos IDs 1-14). Automatizado: `php artisan motor:exportar-catalogo` (B11). | M | Jack | ✅ |
| A10 | Despliegue a Render + staging — desplegado en https://ingetech-ai.onrender.com (Render + Postgres en Neon, guía en [docs/despliegue.md](../despliegue.md)). En pausa por decisión del equipo: se desarrolla en local y se vuelve a desplegar al cerrar el proyecto | M | Jack | ✅ |
| A11 | Registro de eventos + endpoint de KPIs | S | Jack | ✅ |
| A12 | Swagger/OpenAPI publicado | S | Jack | ☐ |
| A15 | Motor: segunda operación `segmentar` (K-Means) para Marketing, en los dos modos (HTTP y CLI) — [ADR 0006](../adr/0006-segmentacion-clientes-kmeans.md) | S | Jack | ✅ |
| A16 | Motor: no recomendar laptops agotadas (`opciones.excluir_ids`, contrato actualizado) | M | Jack | ✅ |
| A13 | Asistente conversacional complementario (LLM vía API) — **no reemplaza el motor de scoring**, es una función aparte (ver [ADR 0005](../adr/0005-llm-complementario-no-motor.md)) | C | Jack | ✅ — `app/Services/Asistente/GeminiAsistente.php` (Gemini, plan gratuito de Google AI Studio; antes DeepSeek, de pago), anclado al catálogo real; sin `GEMINI_API_KEY` o si falla, responde el asistente por palabras clave. |

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
| B9 | Compra con o sin cuenta: personalizar → checkout (datos, envío, pago simulado) → confirmación con código; "Mis pedidos" en el panel del cliente y pestaña Pedidos en el admin para avanzar el estado del envío. | M | Jack | ✅ |
| B10 | Cuestionario de bienvenida (Psicología): 10 preguntas al crear la cuenta; adapta cómo se presenta la recomendación (estilo de decisión, nivel técnico, para quién es). Editable y borrable. | M | Jack | ✅ |
| B11 | Que las respuestas del cuestionario (movilidad, batería, molestias, años de uso, prioridades, marcas, periféricos) cambien el ranking del motor — requiere ampliar el contrato del motor. | M | Jack | ✅ — `ml-engine/recommender/preferencias.py`: 70% técnica + 30% afinidad, con factores y advertencias por preferencia. El resultado muestra el % desglosado y el "¿por qué?" de la IA. |
| B13 | Integrar el frontend de Marco (PR #41) sin perder la lógica de main — en 4 tandas: acceso, menús y chat (#49); panel, catálogo, software, comparador y guía (#50); promociones y sostenibilidad (#59); panel admin con formularios en ventanas (#60). #41 se cerró. | S | Jack | ✅ |
| B12 | Avisos por correo y unir compras de invitado: confirmación de compra y cambio de estado del pedido, constancia y respuesta del Libro de Reclamaciones, correos de Laravel en español. Al **confirmar el correo**, las compras y reclamos hechos como invitado con ese correo pasan a la cuenta (no al registrarse: alguien podría usar un correo ajeno). Envío en cola; con Gmail SMTP (ver `.env.example`). Falta: campañas de Marketing por correo, que necesitan consentimiento de publicidad. | C | Jack | ⚠️ |

## Épica 3 — Catálogo, datos y documentación (Módulo C) — *Bloques I, III, IV*

Dueño: Marco (además del Módulo B). Diego colabora de forma ocasional — cuando tome una
historia puntual de aquí, se reasigna esa fila y se avisa en el grupo.

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| C1 | Plantilla de ficha de laptop | M | Marco | ✅ |
| C2 | 15+ laptops reales verificadas (`laptops.json`) | M | Marco | ⚠️ — 15 en `LaptopSeeder` (Lenovo/HP/Apple/Asus/Acer, 3 c/u), sincronizadas 1 a 1 con `ml-engine/data/laptops.json` (ver A14). Se quitaron las 4 PCs de escritorio: por ahora el alcance es solo laptops (la opción "PC de escritorio" también se ocultó en `/perfil`). El conteo ya llega a 15+; falta el paso de "verificadas" (specs/precio/imagen confirmados en tienda real, hoy son referenciales) — `laptops.imagen_url` ya existe en el esquema, listo para cargar enlaces reales. Pantalla, peso y puertos (guía de compra del comparador) también son de ficha técnica de referencia: confirmar con el SKU exacto. |
| C3 | `actividades.json` y `software.json` (deben calzar con el formulario de Perfil) | M | Marco | ✅ |
| C4 | `CatalogoSeeder` — carga JSON → BD | M | Marco | ✅ — vía seeders (`LaptopSeeder`, `SoftwareSeeder`, `ActividadSeeder`, `CarreraSeeder`) |
| C5 | Pantalla admin — listado de laptops | S | Marco | ✅ |
| C6 | Admin — crear/editar laptop | S | Marco | ✅ |
| C7 | Admin — accesorios y kits | C | Marco | ☐ |
| C8 | Manual de usuario | S | Marco | ☐ |
| C9 | Guion de UAT + formulario de feedback | S | Marco | ☐ |
| C10 | Clientes de demostración (`ClientesDemoSeeder`, correos `@demo.ingetech.test`): 26 clientes con 5 comportamientos para ver la segmentación con K-Means y los KPIs; recomendaciones calculadas por el motor real y compras por el inventario. | S | Jack | ✅ |

## Épica 4 — Impacto y presentación — *Bloques III y IV*

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| D1 | Definir KPIs/OKRs (compatibilidad promedio, tiempo de decisión…) | M | equipo | ✅ — [docs/gestion/kpis.md](kpis.md): calidad de la recomendación + un indicador por disciplina, con metas propuestas (falta validarlas en equipo) |
| D2 | Dashboard de impacto | S | Jack | ✅ — dentro del sistema (pestaña Dashboard de `/admin`) en vez de Grafana/Power BI: no necesita otra herramienta ni exportar datos |
| D3 | Informe de evaluación de impacto socio-tecnológico | M | equipo | ☐ |
| D4 | Memoria Técnica | M | equipo | ☐ |
| D5 | Póster / artículo | S | equipo | ☐ |
| D6 | Ensayo de la sustentación (live demo) | M | equipo | ☐ |
| D7 | ~~Panel Jira/Trello~~ + acta de gobernanza del equipo — el acta ya se presentó; el tablero se descartó porque el docente no lo evalúa | M | equipo | ✅ |
| D8 | Encuesta de usabilidad (SUS) sobre el flujo de usuario | S | equipo | ☐ |
| D9 | Artículo científico en formato IEEE | S | equipo | ☐ |
| D10 | Análisis de licencias (Open Source vs. propietario) del stack usado | C | Jack | ☐ |
| D11 | Diagramas entidad-relación de la BD antes y después de la IA (lo pidió el docente) | M | Jack | ✅ — [docs/arquitectura/modelo-datos.md](../arquitectura/modelo-datos.md) |

## Épica 5 — Disciplinas integradas al sistema (y a la IA)

Cada disciplina interviene en el sistema construido, incluida la IA. Detalle por disciplina en
[docs/contexto-proyecto.md §5.1](../contexto-proyecto.md).

| # | Historia | Prio | Dueño | Estado |
|---|---|---|---|---|
| E1 | Psicología — cuestionario de bienvenida que adapta la presentación y mueve el 30% de afinidad del motor (B10, B11) | M | Jack | ✅ |
| E2 | Ingeniería Industrial — KPIs de la recomendación + indicadores del sistema, uno por disciplina, con meta (D1, D2) | M | Jack | ✅ |
| E3 | Contabilidad — ventas reales con IGV, boleta simulada, registro de ventas CSV, costo por año de uso en el resultado | M | Jack | ✅ |
| E4 | Derecho — Libro de Reclamaciones virtual (plazo de 15 días hábiles), "Cómo decide la IA", datos personales y ARCO | M | Jack | ✅ |
| E5 | Administración — inventario con kardex y punto de reorden (las agotadas no se recomiendan) + roles del personal | M | Jack | ✅ |
| E6 | Marketing — segmentación de clientes con K-Means y cupones por segmento | M | Jack | ✅ |
| E7 | Ingeniería Ambiental — recojo RAEE en la compra, aviso de la IA por GPU innecesaria, cifras reales | M | Jack | ✅ |
| E8 | Validar en equipo los supuestos: stock inicial de demostración, plazos del punto de reorden, metas de los KPIs, textos legales y referencia al reglamento RAEE | S | equipo | ☐ |

## Won't (por ahora)

- App móvil nativa.
- Modelo de ML avanzado (redes neuronales). Se empieza con scoring ponderado + similitud.
- Pasarela de pago real. Hoy el pago es **simulado** (tarjetas de prueba, no cobra nada): el checkout ya guarda solo marca y últimos 4 dígitos, así que conectar una pasarela real (ej. Culqi, Niubiz) sería reemplazar la validación del navegador por el token de la pasarela.
