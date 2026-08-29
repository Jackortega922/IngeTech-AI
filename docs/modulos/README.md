# Módulos del proyecto

Cada persona es **dueña** de un módulo: lo diseña, lo implementa y responde por él en la
sustentación. Fuera de tu módulo, solo lees; para cambiar algo ajeno, coordínalo antes.

| Módulo | Dueño | IA | Ficha |
|---|---|---|---|
| **A** — Núcleo Laravel · API · Motor de recomendación · Infra/CI/Deploy | Jack | Claude | [A-nucleo-api-infra.md](A-nucleo-api-infra.md) |
| **B** — Frontend del flujo de usuario (perfil → resultado → personalización) | Marco | DeepSeek | [B-frontend-flujo.md](B-frontend-flujo.md) |
| **C** — Catálogo · datos reales · manuales · QA/UAT | Diego | Claude/DeepSeek (guiado) | [C-catalogo-datos-docs.md](C-catalogo-datos-docs.md) |

## Cómo encajan las 6 disciplinas del proyecto

| Disciplina | Dónde vive en el repo |
|---|---|
| Ingeniería de Sistemas | Módulo A (arquitectura, full-stack, CI/CD) |
| IA / Ciencia de Datos | Módulo A (`ml-engine/`) + datos del Módulo C |
| Ingeniería Industrial | Analítica y KPIs (Módulo A) + `docs/gestion/` |
| Administración / Gestión | `docs/gestion/` (backlog, sprints) — responsabilidad de todos |
| Diseño UX/UI | Módulo B (pantallas del flujo) |
| Ética y Protección de Datos | `explicacion` del contrato del motor + `docs/adr/` sobre privacidad del perfil |

## Regla de dependencias

```
B (frontend) ──depende de──> A (API + contrato del motor)
C (catálogo) ──depende de──> A (esquema base de BD)
A ──no depende de nadie──> es la base
```

Por eso el **Módulo A arranca primero** con el scaffold, y deja endpoints y tablas mock para que
B y C puedan trabajar en paralelo sin esperar el motor real.
