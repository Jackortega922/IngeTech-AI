# Glosario de herramientas del proyecto

Explicación en lenguaje sencillo de **cada herramienta** que usa IngeTech AI: qué es y para qué
sirve *aquí*. Pensado para quien no conoce el stack.

**Estado:**
- ✅ ya instalada / en uso
- 📦 llega con el scaffold de Laravel (tarea A1)
- ⏳ se suma más adelante (bloque indicado)

## Cómo encajan todas

```
                 NAVEGADOR
                    │
            [React + Inertia + Tailwind]   ← lo que ve el usuario
                    │  (Vite construye esto)
                    ▼
              [Laravel + PHP]              ← recibe la petición, decide, guarda
                 │            │
                 ▼            ▼
        [PostgreSQL]   [Motor Python: FastAPI + scikit-learn]
         la base         calcula el % de compatibilidad
         de datos
                    │
   Todo esto corre dentro de [Docker] en tu PC y en [Render] en internet.
   [Git + GitHub] guardan el código y coordinan al equipo.
   [GitHub Actions] revisa cada cambio automáticamente.
```

---

## 1. Control de versiones y trabajo en equipo

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Git** | Programa que guarda el historial de cambios del código y permite que varias personas trabajen sin pisarse. | Cada cambio queda registrado; se puede volver atrás. Base de todo el trabajo en equipo. | ✅ |
| **GitHub** | Sitio web donde vive el repositorio en internet (una copia central de Git) + herramientas de colaboración. | Aloja el código, los *Pull Requests*, el tablero de tareas y el CI. | ✅ |
| **Repositorio (repo)** | La carpeta del proyecto con todo su historial de Git. | Es `IngeTech-AI`. Un solo repo para todo (monorepo). | ✅ |
| **Rama (branch)** | Una línea de trabajo separada. `main` es la oficial; cada tarea se hace en su propia rama. | Marco trabaja en `feat/perfil-...` sin afectar lo que hace Diego. | ✅ |
| **Commit** | Una "foto" guardada de tus cambios, con un mensaje que explica qué hiciste. | La unidad de trabajo. Muchos commits pequeños > uno gigante. | ✅ |
| **Pull Request (PR)** | Propuesta de mezclar tu rama en `main`. Otros la revisan y comentan antes de aceptarla. | Nadie mete código a `main` sin PR revisado. Es el control de calidad del equipo. | ✅ |
| **CODEOWNERS** | Archivo que dice quién es dueño de cada carpeta. GitHub le pide revisar los PR que la tocan. | Un PR que toca `resources/js/Pages/Perfil/` avisa a Marco automáticamente. | ✅ |
| **Protección de rama** | Reglas de GitHub sobre `main`: exige PR, aprobación y que el CI pase. | Impide que un principiante rompa `main` por accidente. | ✅ |
| **GitHub CLI (`gh`)** | GitHub desde la terminal (crear repos, PRs, ver el CI sin abrir el navegador). | Se usó para crear el repo y configurar la protección. Opcional para el equipo. | ✅ |
| **Conventional Commits** | Convención para escribir mensajes: `feat:`, `fix:`, `docs:`… | Historial legible y ordenado; ayuda a la Memoria Técnica. | ✅ |

---

## 2. Contenedores y entorno de desarrollo

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Docker** | Empaqueta un programa con todo lo que necesita (SO, librerías, versiones) en una "caja" (contenedor) que corre igual en cualquier PC. | Evita el "en mi máquina funciona". Nadie instala PHP/Python/Postgres a mano. | ✅ |
| **Docker Desktop** | La app de Docker para Windows/Mac, con interfaz gráfica. | Lo que instala cada miembro para poder levantar el proyecto. | ✅ (a instalar por cada uno) |
| **Imagen** | La plantilla de un contenedor (ej. `postgres:16`, `python:3.12`). | Se descargan imágenes oficiales y se construye la nuestra encima. | ✅ |
| **Contenedor** | Una imagen en ejecución. | Tendremos 3: la app Laravel, la base de datos y el motor Python. | ✅ |
| **Dockerfile** | Receta de texto para construir una imagen propia. | `ml-engine/Dockerfile` arma el motor con Python 3.12 + sus librerías. | ✅ |
| **Docker Compose** | Orquesta varios contenedores juntos con un solo comando (`docker compose up`). | `docker-compose.yml` levanta app + Postgres + motor conectados entre sí. | ✅ |
| **Dev Container** | Configuración para que VS Code abra el proyecto *dentro* de un contenedor ya listo. | Opción de 1 clic para Diego: no instala nada, VS Code arma el entorno. | ✅ |

---

## 3. Backend: Laravel y PHP

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **PHP** | Lenguaje de programación para servidores web. | El lenguaje del backend (la lógica del servidor). | ✅ (8.3 en el sistema) |
| **Composer** | Gestor de paquetes de PHP: descarga y actualiza librerías. | Instala Laravel y sus extensiones. El `composer.json` lista las dependencias. | ✅ (vía Laragon) |
| **Laravel** | El framework web más usado de PHP: trae rutas, base de datos, autenticación, correos, colas… ya resueltos. | La estructura del backend y la API. Es donde Jack tiene experiencia. | 📦 |
| **Artisan** | La consola de Laravel (`php artisan ...`): crea archivos, corre migraciones, lanza pruebas. | Comando diario: `php artisan migrate`, `php artisan make:model`, etc. | 📦 |
| **Eloquent (ORM)** | Traductor entre la base de datos y objetos de PHP. En vez de escribir SQL, usas `Laptop::where('precio', '<', 4000)->get()`. | Todas las consultas al catálogo y a los perfiles. | 📦 |
| **Migraciones** | Archivos que describen la estructura de la base de datos (tablas, columnas) en código, versionados en Git. | Cada cambio de esquema (nueva tabla `laptops`, columna nueva) es una migración. | 📦 |
| **Laravel Breeze** | Paquete que instala el login/registro y la configuración inicial de React + Inertia. | Nos da autenticación y el "cableado" front-back listo, sin construirlo desde cero. | 📦 |
| **Inertia.js** | Pegamento entre Laravel y React: permite usar componentes React como si fueran páginas de Laravel, sin construir una API aparte para el frontend. | El frontend es "React de verdad" pero servido por Laravel. Menos trabajo que una app separada. | 📦 |
| **spatie/laravel-permission** | Librería para roles y permisos (quién puede hacer qué). | Distingue **administrador del catálogo** (Diego) de **usuario final**. | ⏳ (cuando haya panel admin) |
| **Laravel Pint** | Formateador automático de código PHP (aplica un estilo estándar). | El CI verifica que todo el PHP tenga el mismo formato. Se corre con `pint`. | 📦 |
| **PHPUnit** | Framework para escribir pruebas automáticas del backend. | Cada funcionalidad de la API trae su prueba; el CI las corre. | 📦 |

---

## 4. Frontend: lo que se ve en el navegador

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Node.js** | Entorno para ejecutar JavaScript fuera del navegador (aquí, herramientas de construcción). | Necesario para Vite, npm y compilar el frontend. | ✅ (24 en el sistema) |
| **npm** | Gestor de paquetes de JavaScript (el "Composer" de JS). | Instala React, Tailwind y demás. El `package.json` los lista. | ✅ |
| **Vite** | Herramienta que compila y empaqueta el JavaScript/CSS, con recarga instantánea al guardar. | Convierte el código de `resources/js/` en lo que el navegador entiende. `npm run dev` mientras desarrollas. | 📦 |
| **React** | Librería para construir interfaces con "componentes" reutilizables (un botón, un formulario, una tarjeta). | Las 3 pantallas del flujo: perfil, resultado, personalización. | 📦 |
| **Tailwind CSS** | Forma de dar estilo escribiendo clases cortas directamente en el HTML (`class="p-4 bg-white rounded"`) en vez de archivos CSS separados. | Todo el diseño visual. Rápido y consistente. | 📦 |
| **shadcn/ui** | Colección de componentes React ya diseñados (botones, diálogos, inputs) que copias a tu proyecto y modificas. | Base visual del sistema, para no diseñar cada botón desde cero. | ⏳ |
| **Vitest** | Framework de pruebas para el frontend (equivalente a PHPUnit pero en JS). | Prueba la lógica de los componentes (ej. el cálculo de precio al personalizar). | 📦 |
| **ESLint** | Revisa el código JavaScript buscando errores y malas prácticas. | El CI lo corre; evita bugs comunes antes de que lleguen a `main`. | 📦 |
| **Prettier** | Formateador automático de JavaScript/CSS (como Pint pero para el frontend). | Todo el código JS con el mismo formato. | 📦 |

---

## 5. Base de datos

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **PostgreSQL** | Base de datos relacional (tablas con filas y columnas), robusta y gratuita. | Guarda el catálogo de laptops, los perfiles, las recomendaciones y los eventos de uso. | ✅ (en `docker-compose.yml`) |
| **SQL** | El lenguaje para consultar bases de datos. | Casi no lo escribiremos directo (lo hace Eloquent), pero sí para las consultas de KPIs del dashboard. | ⏳ (Bloque III) |
| **pgAdmin / DBeaver** | Programas con interfaz para mirar y editar la base de datos a mano. | Herramienta opcional para inspeccionar datos durante el desarrollo. | ⏳ (opcional) |

---

## 6. Motor de recomendación: Python

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Python** | Lenguaje de programación, estándar en ciencia de datos e IA. | El lenguaje del motor que calcula la recomendación. | ✅ (3.12 en Docker) |
| **pip** | Gestor de paquetes de Python (el "Composer" de Python). | Instala FastAPI, pandas, scikit-learn… listados en `ml-engine/requirements.txt`. | ✅ |
| **entorno virtual (venv)** | Carpeta aislada con las librerías de *este* proyecto, para no mezclarlas con otras. | En Docker no hace falta; útil si alguien corre el motor sin Docker. | ✅ |
| **FastAPI** | Framework para crear APIs web en Python, moderno y rápido. Genera documentación sola. | El motor es una app FastAPI: recibe el perfil, responde la recomendación. En local corre como servidor. | ✅ (esqueleto) |
| **Uvicorn** | El servidor que ejecuta la app FastAPI. | Levanta el motor en `http://localhost:5001` durante el desarrollo. | ✅ |
| **Pydantic** | Valida que los datos que llegan tengan la forma correcta (tipos, campos obligatorios). | Rechaza perfiles mal formados antes de procesarlos. Viene con FastAPI. | ✅ |
| **pandas** | Librería para manipular tablas de datos en Python (filtrar, agrupar, calcular). | Cargar y procesar el catálogo de laptops y las características del perfil. | ✅ (en `requirements.txt`) |
| **NumPy** | Cálculo numérico rápido con vectores y matrices. Base de pandas y scikit-learn. | Operaciones del cálculo de compatibilidad. | ✅ |
| **scikit-learn** | La librería de Machine Learning más usada de Python (modelos, similitud, clasificación). | El modelo que cruza perfil ↔ laptop. Empezamos con similitud de vectores y un puntaje ponderado. | ✅ (en `requirements.txt`) |
| **Jupyter** | Cuaderno interactivo para explorar datos y probar ideas paso a paso, mezclando código, gráficos y notas. | Exploración del catálogo y del modelo (lo pide el curso de IA). Va en `ml-engine/notebooks/`. | ⏳ |
| **pytest** | Framework de pruebas de Python. | Prueba el cálculo de compatibilidad con distintos perfiles. El CI lo corre. | ✅ |
| **ruff** | Revisor + formateador de código Python, muy rápido (reemplaza a varias herramientas viejas). | El CI verifica el estilo y busca errores en `ml-engine/`. | ✅ |

---

## 7. Generación de documentos y gráficos (en la app)

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **pdfmake** | Genera archivos PDF desde JavaScript. | El PDF de la cotización / configuración personalizada que el usuario descarga. | ⏳ |
| **docx** | Genera archivos Word (.docx) desde JavaScript. | Ficha de recomendación o borrador de Memoria en Word, si se necesita. | ⏳ |
| **exceljs** | Lee y crea archivos Excel. | Importar el catálogo de laptops desde un Excel; exportar reportes de KPIs. | ⏳ |
| **file-saver** | Dispara la descarga de un archivo en el navegador. | "Descargar PDF", "Descargar Excel". | ⏳ |
| **Plotly.js** | Librería de gráficos interactivos para la web. | Visualizar el % de compatibilidad y el desglose de factores en la pantalla de resultado. | ⏳ |

> Estas 5 ya se usaron en el proyecto anterior del equipo, así que hay experiencia previa.

---

## 8. Analítica e impacto (Bloque III)

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Grafana** | Plataforma de tableros (dashboards) que se conecta a una base de datos y grafica métricas en tiempo real. | Opción A para el dashboard de impacto: se conecta directo a PostgreSQL. | ⏳ (Bloque III) |
| **Power BI** | Herramienta de Microsoft para tableros de negocio (más visual, orientada a informes). | Opción B para el dashboard, encaja con el rol de Ingeniería Industrial. | ⏳ (Bloque III) |
| **KPI / OKR** | Indicadores que miden si el sistema genera valor (no son software: son métricas). | Ej.: % de compatibilidad promedio, tiempo de decisión vs. búsqueda manual. | ⏳ |

---

## 9. Despliegue (poner el sistema en internet)

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Render** | Plataforma que toma tu repo de GitHub y lo publica en internet automáticamente en cada `push`. Incluye base de datos. | Donde vivirá el sistema en producción y el entorno de *staging*. | ⏳ |
| **Staging** | Una copia del sistema en internet, igual a producción, para probar antes de publicar de verdad. | Lo exige el sílabo (Unidad I). Ahí se hacen las pruebas con usuarios. | ⏳ |
| **Producción** | La versión real, la que usarían las personas y verá el jurado. | Meta de la Unidad IV: "software en producción". | ⏳ |
| **Variables de entorno (`.env`)** | Archivo con la configuración secreta (contraseñas, claves) que **nunca** se sube a Git. | Credenciales de la base de datos, claves de la app. `.env.example` muestra qué va sin los valores reales. | ✅ |

---

## 10. Integración Continua (CI): revisión automática

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **GitHub Actions** | Servicio de GitHub que ejecuta tareas automáticas (probar, revisar, construir) cada vez que subes código. | En cada PR corre: formato + pruebas de Laravel, del motor Python y build del frontend. Si algo falla, no se puede mezclar. | ✅ |
| **Workflow** | El archivo que define esas tareas (`.github/workflows/ci.yml`). | Nuestro `ci.yml` tiene 3 "jobs": `laravel`, `ml-engine`, `frontend`. | ✅ |
| **Job / step** | Un job es un bloque de trabajo; los steps son sus pasos. | Cada job instala lo suyo y corre lint + pruebas. | ✅ |
| **Swagger / OpenAPI** | Estándar para documentar una API + una página web que la muestra y permite probarla. | FastAPI la genera sola en `/docs`. Es evidencia para la Unidad IV. | ✅ (viene con FastAPI) |
| **Playwright** | Herramienta que simula a un usuario real usando el navegador, para pruebas de extremo a extremo. | Probar el flujo completo: llenar perfil → ver resultado → personalizar. | ⏳ |
| **SonarQube** | Analiza el código y reporta deuda técnica, bugs potenciales y cobertura de pruebas. | Lo menciona el sílabo; opcional. Alternativa gratis: SonarCloud para repos públicos. | ⏳ (opcional) |

---

## 11. Gestión del proyecto (Bloque II)

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Trello / Jira** | Tableros Kanban: tarjetas de tareas en columnas (Por hacer / Haciendo / Hecho). | El tablero visible del equipo. El respaldo versionado está en `docs/gestion/backlog.md`. | ⏳ |
| **MoSCoW** | Método de priorización: **M**ust / **S**hould / **C**ould / **W**on't. | Ordena el backlog: qué es imprescindible para el MVP y qué puede esperar. | ✅ (en el backlog) |
| **Sprint** | Periodo corto y fijo (aquí, 2 semanas) al final del cual se entrega algo funcionando. | Ritmo de trabajo. Se registra en `docs/gestion/sprints.md`. | ✅ |
| **UAT** | *User Acceptance Testing*: pruebas con usuarios reales para ver si el sistema les sirve. | Formulario y guion que arma Diego; alimenta los KPIs de impacto. | ⏳ |

---

## 12. Diseño (UX/UI)

| Herramienta | Qué es | Para qué en IngeTech AI | Estado |
|---|---|---|---|
| **Figma** | Herramienta web para diseñar pantallas antes de programarlas (maquetas, prototipos). | Diseñar el flujo de perfil → resultado antes de que Marco lo construya. | ⏳ |
| **Responsive** | Que la interfaz se vea bien en pantalla de laptop y de celular. | Requisito de calidad del Módulo B. | ⏳ |

---

## 13. Archivos de configuración que verás en el repo

| Archivo | Qué es |
|---|---|
| `.gitignore` | Lista de archivos que Git **ignora** (dependencias descargadas, `.env`, temporales). |
| `.gitattributes` | Normaliza los saltos de línea para que Windows/Mac/Linux no generen ruido. |
| `.editorconfig` | Reglas básicas de formato (espacios, codificación) que respetan todos los editores. |
| `.env` / `.env.example` | Configuración local. El `.example` es la plantilla pública; el `.env` real es secreto. |
| `composer.json` / `package.json` / `requirements.txt` | Listas de dependencias de PHP / JavaScript / Python. |
| `docker-compose.yml` | Definición de los contenedores del entorno local. |
| `pyproject.toml` | Configuración de las herramientas de Python (ruff, pytest). |
| `*.yml` / `*.yaml` | Formato de texto para configuración (lo usa GitHub Actions, Docker Compose). |
| `*.md` | Markdown: texto con formato simple. Toda esta documentación. |

---

## Resumen: qué está instalado hoy vs. qué falta

**Ya funcionando:** Git, GitHub, GitHub Actions (CI), Docker + Compose, el esqueleto del motor
(FastAPI, Pydantic, pytest, ruff) y PostgreSQL definido en Compose.

**Llega con el scaffold de Laravel (próxima tarea):** Laravel, Artisan, Eloquent, Breeze, Inertia,
Vite, React, Tailwind, Pint, PHPUnit, ESLint, Prettier, Vitest.

**Más adelante, por bloque:** Jupyter y el modelo real de scikit-learn (motor) · pdfmake, docx,
exceljs, Plotly (reportes) · Grafana/Power BI (impacto) · Render (despliegue) · Playwright, Figma,
Trello (calidad, diseño, gestión).
