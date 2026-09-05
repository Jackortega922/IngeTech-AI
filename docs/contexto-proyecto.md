# IngeTech AI — Contexto del proyecto

> Documento de contexto conceptual. Universidad Nacional "Hermilio Valdizán" (UNHEVAL) — Grupo 12.
> Proyecto compartido entre los cursos **Proyecto Inter y Transdisciplinario** e **Inteligencia Artificial** (ciclo VIII, 2026-II).
>
> Este documento cubre el **qué** y el **porqué** (problema, objetivo, disciplinas, flujo, contexto
> académico). Para el **cómo técnico** — stack real, límites por módulo, estilo — la fuente de
> verdad es [AGENTS.md](../AGENTS.md), [docs/arquitectura/](arquitectura/) y las decisiones en
> [docs/adr/](adr/).

## 1. Identidad del proyecto

**Nombre:** IngeTech AI
**Qué es:** Sistema inteligente de recomendación y personalización de equipos tecnológicos (laptops y kits).

**Qué propone:** Una plataforma que ayuda al usuario a seleccionar, comparar y personalizar laptops y kits tecnológicos según sus necesidades académicas o profesionales.

**Idea central:**
> No se trata únicamente de vender laptops, sino de ayudar al usuario a elegir la configuración tecnológica que realmente necesita.

**A quién está dirigido:**
- Estudiantes de Ingeniería de Sistemas
- Estudiantes de carreras tecnológicas
- Desarrolladores y profesionales de TI
- Usuarios que necesitan adquirir un equipo según un presupuesto determinado

## 2. Problema

Existe una gran variedad de laptops con distintos procesadores, RAM, SSD, GPU, pantallas y precios, lo que dificulta elegir el equipo adecuado. El usuario típico sigue este flujo: busca laptops → compara especificaciones → revisa precios → toma una decisión — pero muchas veces no sabe interpretar correctamente las especificaciones ni determinar qué componentes necesita.

**Consecuencias de una mala elección:**
- **Equipo insuficiente** — no tiene los recursos necesarios para sus actividades.
- **Equipo sobredimensionado** — paga por características que probablemente no utilizará.
- **Equipo poco compatible** — no responde adecuadamente a sus necesidades de software o rendimiento.

**Ejemplo del problema:** "Necesito una laptop para Ingeniería de Sistemas" no indica qué configuración necesita — depende de la actividad:
| Actividad | Requerimiento dominante |
|---|---|
| Programación | Buen procesador + RAM |
| Máquinas virtuales | Mayor RAM + CPU |
| Inteligencia Artificial | GPU + RAM |
| Desarrollo web | CPU + RAM + SSD |
| Diseño / 3D | GPU dedicada + CPU potente |

**Problema central:** existe una dificultad para relacionar las necesidades específicas del usuario con las características técnicas y el presupuesto de una laptop.

## 3. Objetivo y solución

**Objetivo general:** desarrollar un sistema inteligente que analice el perfil, las necesidades tecnológicas y el presupuesto del usuario para recomendar y personalizar laptops y kits tecnológicos adecuados para sus actividades académicas o profesionales.

**Flujo funcional (alto nivel):**
1. **Perfil del usuario** — el sistema recopila: carrera/área, nivel de experiencia, tipo de actividades, software que utiliza, presupuesto disponible.
2. **Análisis de necesidades** — el sistema identifica los requerimientos tecnológicos (ej. Programación + Docker + máquinas virtuales → mayor necesidad de RAM y procesador).
3. **Inteligencia Artificial** — analiza la información y determina qué equipos presentan mayor compatibilidad con el perfil del usuario.
4. **Recomendación** — entrega resultado con porcentaje de compatibilidad (ej. "Ryzen 7 · 16 GB RAM · SSD 1 TB — 94% compatibilidad").
5. **Personalización** — el usuario complementa/modifica su configuración y puede elegir kits tecnológicos (laptop + RAM + SSD + mouse + mochila + accesorios).

## 4. Contexto académico

Fuente: sílabos oficiales UNHEVAL 2026-II de ambos cursos (17 semanas, mismo docente:
Abimael Adam Francisco Paredes, quien autorizó presentar un solo proyecto para los dos).
El calendario de sprints que cruza ambos cursos vive en
[docs/gestion/sprints.md](gestion/sprints.md#calendario-académico-compartido-sílabo-sprints).

### 4.1. Proyecto Inter y Transdisciplinario (código 5201, 102h: 34T+68P)
Continuación de Proyecto I. Producto académico: implementación real del proyecto
interdisciplinario con resultados finales, análisis de impacto y lecciones aprendidas.
4 unidades (25% c/u):

1. **Implementación de proyectos — estrategias y buenas prácticas** (sesiones 1–8):
   pipeline CI/CD, arquitecturas modernas (microservicios/serverless), MVP (Sprint 1),
   QA (SonarQube, ISO 25010), testing automatizado, despliegue en staging (Docker/Terraform).
   *Evidencia:* informe de arquitectura + repositorio desplegado en staging con pruebas
   automatizadas.
2. **Gestión de equipos multidisciplinarios — liderazgo y coordinación** (sesiones 9–17):
   backlog MoSCoW y Kanban/Scrum a escala (Jira/Trello), liderazgo adaptativo y resolución
   de conflictos, ética/GDPR/protección de datos, UAT con usuarios finales.
   **Examen Parcial en la sesión 17** (semana 8): sustentación del prototipo funcional y
   avance de gestión. *Evidencia:* panel de gestión (Jira/Trello), acta de gobernanza del
   equipo y reporte de avance del MVP evaluado en el parcial.
3. **Evaluación de resultados e impacto** (sesiones 18–25): diseño de KPIs/OKRs,
   metodologías de evaluación de impacto (SROI, Teoría del Cambio), analítica y monitoreo,
   análisis costo-beneficio, huella de carbono/Green IT, encuestas de usabilidad (SUS).
   *Evidencia:* informe analítico de impacto social, económico y técnico con dashboards
   (Power BI/Grafana).
4. **Presentación de proyectos** (sesiones 26–34): memoria técnica y artículo científico
   (formato IEEE), póster, elevator pitch, ensayo de live demo, análisis de licencias
   (Open Source vs. propietario), publicación final del repositorio.
   **Examen Final en la sesión 33** (semana 16): sustentación pública del proyecto + Live
   Demo; sesión 34 (semana 17) cierra el curso y consolida actas. *Evidencia:* proyecto
   interdisciplinario implementado (Software + Memoria Técnica + Artículo/Póster +
   Sustentación Pública).

Rúbrica final (5 criterios): Implementación Técnica y Funcionalidad · Evaluación e Impacto
Socio-Tecnológico · Gestión de Proyecto y Trabajo en Equipo · Comunicación y Sustentación
Oral · Calidad de la Documentación Científico-Técnica.

### 4.2. Inteligencia Artificial (código 4206, 68h: 34T+34P)
Producto académico: propuesta de aplicación basada en IA con estrategias de
personalización, análisis de datos y automatización. 4 unidades (25% c/u):

1. **Fundamentos de IA** (sesiones 1–8): agentes inteligentes, búsqueda no informada
   (BFS/DFS) e informada (A*, Greedy Best-First), búsqueda adversaria (Minimax/Poda
   Alfa-Beta), representación del conocimiento (redes semánticas, ontologías).
   *Evidencia:* informe técnico + código de un **agente de búsqueda heurística** en Python
   con análisis de eficiencia — es un entregable independiente del curso, no forma parte
   del código de IngeTech AI.
2. **Introducción al Aprendizaje Automático** (sesiones 9–17): preprocesamiento y EDA,
   regresión lineal/logística, métricas de clasificación (matriz de confusión, precisión,
   recall, F1, ROC-AUC), árboles de decisión, ensembles (Random Forest, XGBoost),
   K-Means/DBSCAN. **Examen Parcial en la sesión 16** (semana 8). *Evidencia:* examen
   parcial + script/pipeline documentado de preprocesamiento y entrenamiento de un modelo
   supervisado.
3. **Técnicas de ML para Análisis Predictivo** (sesiones 18–25): reducción de
   dimensionalidad (PCA/t-SNE), series temporales (ARIMA, Prophet), ajuste de
   hiperparámetros (Grid/Random Search, Optuna), redes neuronales (MLP/backpropagation),
   MLOps (validación cruzada, data drift), empaquetado de modelos con FastAPI.
   *Evidencia:* **API REST que expone un modelo predictivo entrenado, optimizado y
   serializado** — mapea directo a `ml-engine/`.
4. **Sistemas Inteligentes** (sesiones 26–34): arquitectura end-to-end (frontend + API +
   motor de IA), **filtros colaborativos y basados en contenido**, NLP (tokenización,
   embeddings, LLMs), RAG con LangChain/LlamaIndex, interfaces con Streamlit/Gradio, ética
   en IA (XAI con SHAP/LIME, privacidad GDPR/LPDP), gobernanza (EU AI Act).
   **Examen Final en la sesión 33** (semana 16): sustentación + demo en vivo. *Evidencia:*
   documento técnico final + repositorio con la aplicación web (personalización, análisis
   predictivo, automatización) + defensa oral.

Rúbrica final (4 criterios): Arquitectura de Software y Código · Técnicas de IA y Análisis
Predictivo · Estrategias de Personalización, Automatización y Ética/Gobernanza ·
Sustentación y Documentación Técnica.

### 4.3. Cómo convergen los dos cursos en un solo proyecto
| Proyecto Inter y Transdisciplinario | Inteligencia Artificial |
|---|---|
| Problema real | Datos |
| Desarrollo de software | Preprocesamiento |
| Trabajo en equipo | Machine Learning |
| Metodología ágil | Modelo de recomendación |
| Pruebas y calidad | Predicción / clasificación |
| Despliegue | API |
| Evaluación mediante indicadores | Aplicación inteligente |
| Impacto | LLM + RAG + asistente inteligente (si el curso lo requiere) |

Ambos cursos comparten las 17 semanas y, casi, las mismas sesiones de examen: el parcial de
PIT (sesión 17) cae una sesión después del de IA (sesión 16), y el final de ambos coincide
en la sesión 33 — el mismo MVP y la misma sustentación sirven para los dos cursos.

## 5. Las 6 disciplinas del proyecto

| Disciplina | Módulo asignado | Qué aporta | Herramientas |
|---|---|---|---|
| Ingeniería de Sistemas | Núcleo técnico | Arquitectura (frontend + API + BD), CI/CD, expone el motor de IA, logs de uso | Laravel 12, Inertia/React/TS, FastAPI (motor), PostgreSQL, Docker, GitHub Actions, Render |
| IA / Ciencia de Datos | Motor de recomendación | Modelo que traduce perfil → equipo compatible, % de compatibilidad, entrenamiento con datos del catálogo | Python, scikit-learn, pandas, Jupyter |
| Ingeniería Industrial | Analítica, KPIs y calidad | KPIs de compatibilidad/tiempo de decisión, costo-beneficio, QA (ISO 25010), dashboard de impacto | Power BI / Grafana, AWS Pricing Calculator, SonarQube |
| Administración / Gestión | Gestión del equipo | Backlog MoSCoW, sprints, Kanban, resolución de conflictos, UAT | Jira, Trello, Google Forms |
| Diseño UX/UI | Experiencia de usuario | Interfaz de perfil/catálogo/recomendación, prototipos, pruebas SUS, consentimiento visible | Figma, pruebas de usabilidad |
| Ética y Protección de Datos | Gobernanza de datos | Política de privacidad, revisión de sesgos del modelo, cumplimiento normativo | Ley de Protección de Datos Personales (Perú), GDPR como referencia |

Conexiones clave entre disciplinas: Sistemas expone el modelo de IA como servicio; IA entrega insumos a Industrial para medir KPIs; Ética rige cómo Sistemas almacena datos y cómo IA entrena/opera el modelo; UX/UI muestra el consentimiento que define Ética.

## 6. Arquitectura general del sistema

Aplicación web de 3 capas + base de datos, gobernada por reglas de ética. El sílabo sugería
Next.js + FastAPI; el equipo eligió **Laravel como app y API** por experiencia previa y para
reducir el riesgo de "software 100% funcional y desplegado" — ver
[ADR 0002](adr/0002-stack-laravel-inertia-python.md). FastAPI se conserva como el motor de
recomendación.

```
Usuario
  │
  ▼
Frontend (UX) ── Inertia 2 + React 19 + TypeScript (servido por Laravel, no es una app aparte)
  │  captura el perfil y muestra los resultados
  ▼
App + API ── Laravel 12 (PHP 8.3+)
  │  orquesta peticiones, valida datos, auth/roles, aplica reglas de privacidad, registra eventos
  ▼
Motor de recomendación ── Python (ml-engine/)
  │  calcula compatibilidad y genera la recomendación con su explicación
  ▼
(respuesta: Motor → Laravel → Frontend → Usuario)

Laravel ── conecta con ──▶ Base de datos (PostgreSQL 16): catálogo, perfiles, recomendaciones, eventos
Todo el flujo ── gobernado por ──▶ Ética y datos: gobernanza, consentimiento, revisión de sesgos
```

**Punto de entrada principal:** `POST /api/recomendaciones` — recibe el perfil como JSON y responde
con la lista de laptops rankeadas y el porcentaje de compatibilidad de cada una. El formato exacto
está en [docs/arquitectura/contrato-motor.md](arquitectura/contrato-motor.md) y es un contrato
cerrado entre módulos. Endpoints adicionales previstos: catálogo, personalización, KPIs.

**Cómo hablan Laravel y el motor:** el mismo código Python sirve en dos modos — en local corre como
servicio `uvicorn` (Laravel hace HTTP POST); en producción Laravel lo invoca como **subproceso
CLI** (`python ml-engine/cli_entry.py`, perfil por stdin, JSON por stdout). `app/Services/Recommender/`
aísla esa decisión del resto de la app. Ver [ADR 0003](adr/0003-motor-python-subproceso.md).

## 7. Arquitectura interna del motor de recomendación

El motor (`ml-engine/`) es un servicio Python **independiente del backend Laravel**. Internamente se
organiza como una cadena de módulos:

1. **Módulo de perfilado** — clasifica al usuario en una categoría técnica (ej. desarrollador, diseñador, uso general) mediante un modelo de **clasificación supervisada**.
2. **Módulo de traducción de requerimientos** — convierte la categoría + actividades declaradas en un vector de especificaciones ideales (RAM mínima, tipo de CPU, necesidad de GPU, almacenamiento).
3. **Módulo de recomendación** — compara ese vector contra el catálogo de equipos mediante **filtrado basado en contenido** (similitud coseno), calculando el % de compatibilidad.
4. **Módulo de filtro de presupuesto** — descarta o penaliza candidatos fuera del presupuesto disponible del usuario.
5. **Módulo de ranking y salida** — ordena los candidatos por score de compatibilidad y entrega el top-N con su **explicación de factores** (requisito de transparencia de la disciplina de Ética).

La lógica de scoring y compatibilidad vive en `ml-engine/recommender/` como **funciones puras** (sin
I/O, sin framework) para poder probarlas fácil. `app.py` (FastAPI) y `cli_entry.py` solo parsean la
entrada, llaman a `recommender` y serializan la salida.

**Punto de partida:** el prototipo previo `PC_EXPERT/` (desktop, Tkinter) tiene lógica reutilizable
de scoring y compatibilidad (`PC_EXPERT/src/recomendador_pro.py`, `PC_EXPERT/src/compatibilidad.py`).
Hay que adaptarla: PC_EXPERT arma PCs de piezas y recomienda **solo por presupuesto**; IngeTech AI
recomienda laptops completas y **por perfil**.

**Enfoque de ML recomendado (a confirmar por el equipo):** clasificación supervisada (Regresión
Logística o Random Forest de `scikit-learn`) para perfilar al usuario, combinada con filtrado basado
en contenido (`cosine_similarity` de `sklearn.metrics.pairwise`) para el ranking final. Este enfoque
se alinea con las Unidades 2 y 4 del sílabo de Inteligencia Artificial.

**Ejemplo de cálculo:**
```
Entrada: presupuesto S/3,500 · programación · docker · máquinas virtuales · python

→ Perfilado: "Desarrollador de software"
→ Requerimientos ideales: 16 GB RAM, SSD 1 TB, GPU no indispensable
→ Similitud vs. catálogo: Equipo X = 0.92

✓ Recomendación: Equipo X — 92% compatibilidad
```

## 8. Pipeline de construcción y entrenamiento del modelo

Proceso realizado en Jupyter/Colab antes del despliegue en producción:

1. **Recolección de datos** — catálogo de equipos y dataset histórico de perfiles/requerimientos.
2. **Preparación de datos** — limpieza, codificación de variables categóricas (encoding), escalado de variables numéricas.
3. **Entrenamiento del modelo** — ajuste del clasificador de perfil y definición de la función de similitud.
4. **Evaluación y ajuste** — métricas (accuracy, F1-score para el clasificador) y ajuste de hiperparámetros (Grid Search / Random Search / Optuna).
5. **Uso en el motor** — serialización del modelo (`joblib`/`pickle`) y carga desde `recommender/`.
   En modo servidor local el modelo se carga una vez al arrancar `uvicorn`; en producción, como el
   motor se ejecuta como **subproceso corto por cada solicitud**, se carga al inicio de esa
   ejecución (latencia aceptable para el volumen del proyecto; ver
   [ADR 0003](adr/0003-motor-python-subproceso.md)).

**Ejemplo de resultado de entrenamiento:**
```
$ Entrenando clasificador de perfil...
Accuracy: 0.89 | F1-score: 0.87

$ Serializando modelo...
modelo_ingetech.pkl guardado (2.3 MB)

✓ Modelo listo para consumirse desde el motor
```

**Cuándo reentrenar:** al agregar equipos nuevos al catálogo, si las métricas bajan en producción, o periódicamente con nuevos datos de usuarios reales.

## 9. Flujo de interacción en tiempo real (inferencia)

Lo que ocurre cada vez que un usuario real usa la aplicación (no es entrenamiento, es inferencia sobre el modelo ya entrenado):

1. El usuario completa su perfil (carrera, nivel de experiencia, actividades, software, presupuesto) en el frontend.
2. El frontend (Inertia) envía la solicitud a Laravel (`POST /api/recomendaciones`).
3. Laravel valida los datos y aplica las reglas de privacidad.
4. `app/Services/Recommender/` invoca al motor — HTTP en local, subproceso CLI en producción.
5. El motor clasifica, compara y rankea, y responde con las laptops + % + explicación.
6. Laravel registra el evento (analítica) y devuelve la respuesta al frontend.
7. El usuario ve el resultado y puede personalizarlo o reconsultar (ajustando, por ejemplo, el presupuesto).

**Formato de comunicación** (resumen — el contrato completo, con tipos y errores, está en
[contrato-motor.md](arquitectura/contrato-motor.md)):

```json
// Solicitud
POST /api/recomendaciones
{
  "perfil": {
    "carrera": "Ingeniería de Sistemas",
    "nivel_experiencia": "intermedio",
    "actividades": ["programacion_web", "maquinas_virtuales"],
    "software": ["vscode", "docker"],
    "presupuesto_soles": 4000
  },
  "opciones": { "top_n": 3 }
}

// Respuesta
{
  "version": "v0",
  "recomendaciones": [
    {
      "laptop_id": 42,
      "compatibilidad_pct": 87,
      "precio_soles": 3899,
      "sobrante_soles": 101,
      "explicacion": {
        "factores": [{ "criterio": "RAM suficiente para máquinas virtuales", "aporte": 25 }],
        "advertencias": ["El almacenamiento puede quedar corto para varios proyectos grandes"]
      }
    }
  ]
}
```

## 10. Stack tecnológico (resumen)

| Capa | Tecnología |
|---|---|
| App + API | Laravel 12, PHP 8.3+ (base: React Starter Kit oficial de Laravel) |
| Frontend | Inertia 2 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Motor de recomendación | Python 3.12 · FastAPI · pandas · NumPy · scikit-learn |
| Modo de ejecución del motor | `uvicorn` (local) / subproceso CLI (producción) |
| Serialización de modelo | joblib / pickle |
| Ajuste de hiperparámetros | GridSearchCV / Optuna |
| Base de datos | PostgreSQL 16 (migraciones con Eloquent) |
| Pruebas | Pest (PHP) · pytest (motor) |
| Estilo / lint | Laravel Pint · ESLint + Prettier · ruff + black |
| Contenedores / CI / despliegue | Docker Compose · GitHub Actions · Render |
| Gestión de proyecto | Jira / Trello |
| Calidad de código | SonarQube |
| Analítica / KPIs | eventos en BD + dashboard (Grafana / Power BI) |
| Diseño UX/UI | Figma |

## 11. Estructura de carpetas (real)

Monorepo Laravel — ver [ADR 0001](adr/0001-monorepo.md). Un solo repo, carpetas por módulo, límites
en [.github/CODEOWNERS](../.github/CODEOWNERS) y las fichas de [docs/modulos/](modulos/).

```
IngeTech-AI/
├── app/                         # Laravel: controladores, modelos, servicios, jobs (Módulo A)
│   ├── Http/Controllers/
│   ├── Models/
│   └── Services/
│       ├── Recommender/         # cliente del motor (HTTP local / subproceso prod)
│       └── Analitica/           # registro de eventos y KPIs
├── routes/                      # api.php, web.php
├── database/
│   ├── migrations/              # esquema base: perfiles, recomendaciones, eventos (Módulo A)
│   └── seeders/                 # catálogo real (Módulo C)
├── resources/js/                # frontend Inertia + React + TypeScript
│   ├── pages/                   # páginas (kebab-case): perfil/, resultado/, personalizar/ (Módulo B)
│   │   └── admin/catalogo/      # administración del catálogo (Módulo C)
│   └── components/ui/           # shadcn/ui
├── ml-engine/                   # motor de recomendación (Módulo A)
│   ├── app.py                   # FastAPI — modo servidor (local)
│   ├── cli_entry.py             # modo subproceso (producción)
│   ├── recommender/             # scoring + compatibilidad (funciones puras)
│   ├── data/                    # catálogos JSON — los llena el Módulo C
│   ├── notebooks/               # exploración de datos (curso de IA)
│   └── tests/
├── PC_EXPERT/                   # prototipo previo (Tkinter) — fuente de lógica reutilizable
├── analitica/                   # dashboard de impacto
├── docs/                        # arquitectura, ADRs, módulos, gestión, manuales
├── .github/workflows/           # CI (jobs: laravel, frontend, ml-engine)
├── docker-compose.yml           # db + ml-engine (el servicio app llega en la tarea A2)
└── Dockerfile                   # imagen de producción PHP + Python
```

## 12. Estado actual del proyecto

**Conceptual**
- [x] Identidad, problema, objetivo y flujo funcional definidos.
- [x] Las 6 disciplinas y sus responsabilidades asignadas.
- [x] Arquitectura general y arquitectura interna del motor diseñadas.
- [x] Pipeline de entrenamiento y flujo de inferencia definidos.

**Técnico**
- [x] Decisiones de arquitectura registradas (ADR 0001–0004).
- [x] Monorepo con docs de equipo, CI (jobs: laravel, frontend, ml-engine) y estructura inicial.
- [x] Scaffold: Laravel 12 + Inertia/React/TS (React Starter Kit) + esqueleto del `ml-engine` — CI en verde (PR en revisión).
- [ ] Contenedor `app` (Dockerfile PHP + Python) y `docker-compose` completo — tarea A2.
- [ ] Migraciones y modelos base (Laptop, Accesorio, Kit, PerfilUsuario, Recomendacion, EventoAnalitica).
- [ ] `GET /api/health` y `POST /api/recomendaciones` con motor MOCK (desbloquea al Módulo B).
- [ ] Seeders con columnas mínimas del catálogo (desbloquea al Módulo C).
- [ ] Catálogo de laptops (dataset real) — Módulo C.
- [ ] Dataset de perfiles de entrenamiento.
- [ ] Portar `recomendador_pro.py` / `compatibilidad.py` de PC_EXPERT y el scorer por perfil.
- [ ] Reemplazar el mock por la llamada real al motor.
- [ ] Registro de eventos + endpoint de KPIs + dashboard.
- [ ] Despliegue en Render + staging.
- [ ] Confirmar con el equipo el enfoque de ML final (sección 7).

## 13. Notas para el desarrollo

- **Lee primero** [AGENTS.md](../AGENTS.md) y la ficha de tu módulo en [docs/modulos/](modulos/). No toques archivos fuera de tu módulo sin coordinarlo.
- El motor de IA nunca se comunica directo con el usuario — siempre pasa por Laravel.
- El **contrato del motor** ([contrato-motor.md](arquitectura/contrato-motor.md)) es sagrado: si cambia, se actualiza el documento y se avisa al equipo en el mismo PR. El Módulo A es el dueño.
- La `explicacion` de cada recomendación (factores + advertencias) no es opcional: es el requisito de transparencia de la disciplina de Ética.
- Guardar el perfil en sesión evita que el usuario repita todos los datos en consultas refinadas.
- Toda variable de perfil o modelo que involucre datos personales debe pasar por las reglas de la disciplina "Ética y Protección de Datos" (política de privacidad, consentimiento visible en UX/UI, revisión de sesgos del modelo).
- El proyecto se presenta en dos cursos con rúbricas distintas: para Proyecto Inter y Transdisciplinario importa más CI/CD, gestión ágil y despliegue; para Inteligencia Artificial importa más el rigor del pipeline de ML, las métricas de evaluación y la ética/explicabilidad del modelo.
- Nunca commitear a `main` directo: rama por tarea, PR pequeño, CI verde, review de Jack ([CONTRIBUTING.md](../CONTRIBUTING.md)).
