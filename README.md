# IngeTech AI

Sistema inteligente de **recomendación y personalización de equipos tecnológicos** (laptops + kits
y accesorios). El usuario ingresa su perfil (carrera, nivel de experiencia, actividades, software
que usa, presupuesto) y el sistema recomienda la laptop más compatible con un **porcentaje de
compatibilidad**, permitiéndole después personalizar la configuración (RAM, SSD, mochila,
accesorios, kits).

> Proyecto grupal — UNHEVAL, Facultad de Ingeniería Industrial, de Sistemas y Mecatrónica.
> Grupo 12 · 2026-II. Cursos: *Proyecto Inter y Transdisciplinario* + *Inteligencia Artificial*.

## Documentación

| Documento | Para qué |
|---|---|
| [ONBOARDING.md](ONBOARDING.md) | Instalar y correr el proyecto en tu PC (empieza aquí) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo trabajar en equipo: ramas, commits, Pull Requests |
| [docs/arquitectura/vision-general.md](docs/arquitectura/vision-general.md) | Cómo está armado el sistema |
| [docs/modulos/](docs/modulos/) | Qué hace cada módulo y quién lo mantiene |
| [docs/gestion/](docs/gestion/) | Backlog y sprints |
| [docs/adr/](docs/adr/) | Decisiones de arquitectura y por qué se tomaron |

## Stack

| Capa | Tecnología |
|---|---|
| App + API | Laravel 11 (PHP 8.2+) |
| Frontend | Inertia + React + Tailwind CSS |
| Motor de recomendación | Python · FastAPI · pandas · scikit-learn |
| Base de datos | PostgreSQL 16 |
| Infra | Docker Compose · GitHub Actions · Render |

## Módulos y responsables

| Módulo | Carpeta principal | Responsable |
|---|---|---|
| Núcleo Laravel · API · Motor IA · Infra | `app/`, `ml-engine/`, `.github/` | Jack |
| Frontend del flujo de usuario | `resources/js/Pages/{Perfil,Resultado,Personalizar}/` | Marco |
| Catálogo · datos reales · manuales | `resources/js/Pages/Admin/Catalogo/`, `database/`, `docs/manuales/` | Diego |

## Arranque rápido

```bash
git clone https://github.com/Jackortega922/IngeTech-AI.git
cd IngeTech-AI
docker compose up --build
```

- App: http://localhost:8000
- Motor de recomendación (Swagger): http://localhost:5001/docs

Detalle completo en [ONBOARDING.md](ONBOARDING.md).
