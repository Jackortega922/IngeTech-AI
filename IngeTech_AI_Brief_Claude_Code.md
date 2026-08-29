# IngeTech AI — Contexto completo del proyecto

Voy a construir este proyecto desde cero. Te paso todo el contexto para que me ayudes a
levantar el repositorio y a decidir la estructura técnica. Léelo completo antes de proponer nada.

## 1. Qué es el proyecto

**IngeTech AI** es un sistema inteligente de recomendación y personalización de equipos
tecnológicos (laptops y kits). El usuario ingresa su perfil (carrera/área, nivel de experiencia,
tipo de actividades, software que usa, presupuesto) y el sistema le recomienda la laptop más
compatible, con un porcentaje de compatibilidad, y le permite personalizar la configuración
(RAM, SSD, mochila, accesorios, kits).

La idea central del proyecto: **no se trata de decirle al usuario qué laptop comprar, sino de
ayudarlo a elegir la configuración que realmente necesita** según lo que va a hacer con el
equipo (programación, máquinas virtuales, IA, desarrollo web, diseño/3D, etc.).

## 2. Contexto académico

- Universidad Nacional Hermilio Valdizán (UNHEVAL), Huánuco, Perú.
- Facultad de Ingeniería Industrial, de Sistemas y Mecatrónica.
- Grupo 12. Proyecto grupal para **dos cursos en simultáneo**:
  - **Proyecto Inter y Transdisciplinario** (código 5201, VIII ciclo, 3 créditos, 2026-II,
    17 semanas, docente Abimael Adam Francisco Paredes).
  - **Inteligencia Artificial** (código 4206, VIII ciclo, 3 créditos, 2026-II).
- Metodología del curso: Aprendizaje Basado en Proyectos + Aula Invertida + enfoque DevOps/Agilidad.
- **No es un curso de programación**: es un curso de proyecto tecnológico integral. Exige
  software funcionando y desplegado, gestión ágil demostrable, medición de impacto con datos
  reales, y una sustentación con demo en vivo ante jurado.

## 3. Las 4 unidades del curso (25% cada una) — lo que hay que entregar en cada una

| Unidad | Pregunta central | Evidencia que pide el sílabo |
|---|---|---|
| **I — Implementación** | ¿Cómo construyo y despliego el sistema? | Repositorio con pipeline CI/CD funcional + documento de arquitectura, desplegado en staging, con pruebas automatizadas |
| **II — Gestión del equipo** | ¿Cómo organizo y dirijo el proyecto? | Panel de gestión (Jira/Trello), acta de gobernanza, MVP funcional evaluado en Examen Parcial |
| **III — Evaluación e impacto** | ¿Cómo demuestro que genera valor? | Informe de evaluación de impacto socio-tecnológico + dashboard interactivo (Power BI/Grafana) |
| **IV — Presentación** | ¿Cómo comunico y defiendo el proyecto? | Software en producción + Memoria Técnica + Artículo/Póster + sustentación con Live Demo |

La rúbrica de "excelente" en Implementación técnica pide: **software 100% funcional, desplegado
en producción, sin errores críticos, con arquitectura escalable e integrada**.

## 4. Las 6 disciplinas que convergen en el proyecto (transdisciplinario)

| Disciplina | Módulo que le corresponde | Qué aporta |
|---|---|---|
| **Ingeniería de Sistemas** | Núcleo técnico | Arquitectura, desarrollo full-stack, CI/CD, despliegue |
| **IA / Ciencia de Datos** | Motor de recomendación | El modelo que cruza perfil + presupuesto + catálogo |
| **Ingeniería Industrial** | Analítica, KPIs y calidad | Indicadores, costo-beneficio, estándares de calidad (QA/ISO 25010) |
| **Administración / Gestión** | Gestión del equipo | Backlog, sprints, Kanban, resolución de conflictos |
| **Diseño UX/UI** | Experiencia de usuario | Interfaz de perfil/catálogo/resultado, usabilidad |
| **Ética y Protección de Datos** | Gobernanza de datos | Privacidad del perfil, consentimiento, sesgos del modelo |

## 5. Arquitectura técnica objetivo (4 bloques, uno por unidad del curso)

**Bloque I — Núcleo técnico**
- Frontend web (perfil del usuario + catálogo + resultado de recomendación)
- API REST (FastAPI)
- Base de datos (PostgreSQL)
- Motor de recomendación (módulo de IA/ML, servido detrás de la API)
- CI/CD (GitHub Actions) + contenedores Docker

**Bloque II — Gestión del proyecto** (proceso del equipo, no código)
- Tablero Kanban (Jira/Trello), backlog priorizado con MoSCoW
- Formulario UAT para pruebas con usuarios reales

**Bloque III — Analítica e impacto**
- Registro de eventos de uso
- Cálculo de KPIs/OKRs (ej. % de compatibilidad promedio, tiempo de decisión vs. búsqueda manual)
- Dashboard de impacto (Power BI o Grafana)
- Módulo de costos (referencia: AWS Pricing Calculator)

**Bloque IV — Presentación y entrega**
- Documentación de la API (Swagger/OpenAPI)
- README + manual técnico + manual de usuario
- Entorno de demo estable (staging)

## 6. Flujo del sistema esperado (de punta a punta)

1. El usuario completa su perfil (carrera, actividades, presupuesto).
2. El frontend envía esos datos a la API.
3. La API consulta al motor de recomendación (IA).
4. El motor cruza perfil + presupuesto con el catálogo (base de datos).
5. El sistema devuelve la laptop recomendada y su % de compatibilidad.
6. El usuario personaliza su configuración (kits, accesorios).
7. El evento queda registrado en analítica.
8. El dashboard actualiza los KPIs de impacto.

## 7. Stack tecnológico sugerido (alineado con lo que pide el sílabo)

- **Frontend:** React / Next.js
- **Backend:** FastAPI (Python)
- **Base de datos:** PostgreSQL
- **Motor de recomendación:** Python, Scikit-learn, Pandas, Jupyter para exploración
- **CI/CD:** GitHub Actions + Docker / Docker Compose
- **Calidad:** SonarQube, pruebas con Jest/JUnit/Postman
- **Analítica/Dashboard:** Power BI o Grafana
- **Gestión:** Jira o Trello
- **Diseño:** Figma
- **Documentación de API:** Swagger/OpenAPI

## 8. Lo que necesito que me ayudes a hacer ahora

Quiero levantar el repositorio desde cero, listo para empezar a construir el Bloque I
(Núcleo técnico) primero, porque es la base sobre la que dependen las demás disciplinas.
Concretamente:

1. Proponme una estructura de carpetas para un monorepo (frontend + backend + módulo de
   recomendación) o si conviene separarlos — dime el porqué.
2. Arma el scaffold inicial: backend FastAPI con un endpoint de salud y uno de ejemplo para
   recomendación (mock, sin modelo real todavía), frontend React/Next.js básico con un formulario
   de perfil, y un `docker-compose.yml` que levante frontend + backend + PostgreSQL.
3. Configura un pipeline básico de GitHub Actions (build + lint + test) para que ya exista
   desde el primer commit.
4. Genera un README inicial con instrucciones de cómo correr el proyecto localmente.

No hace falta que me expliques el sílabo ni el curso — ya te di ese contexto arriba. Enfócate
en el código y la estructura del repo.
