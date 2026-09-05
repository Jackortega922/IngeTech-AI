# ADR 0002 — Stack: Laravel + Inertia/React + motor Python

- **Fecha:** 2026-08-28
- **Estado:** Aceptada

## Contexto

El sílabo sugiere React/Next.js + FastAPI + PostgreSQL + scikit-learn. El equipo tiene experiencia
fuerte en Laravel/PHP (un proyecto previo, *web-etabs*, con el patrón "app Laravel + motor Python
como subproceso"). Solo una persona programa con soltura.

## Decisión

- **App + API:** Laravel 12 (el scaffold instaló la versión estable actual; Laravel 11 quedó fuera
  de soporte de seguridad en marzo 2026).
- **Frontend:** Inertia + React. La base concreta es el React Starter Kit oficial — ver
  [ADR 0004](0004-react-starter-kit.md), que reemplaza la idea original de usar Breeze.
- **Motor de recomendación:** Python. Se escribe con **FastAPI** (servidor local + Swagger), pero
  en producción Laravel lo invoca como **subproceso CLI**. Ver [ADR 0003](0003-motor-python-subproceso.md).
- **BD:** PostgreSQL (como pide el sílabo).

## Alternativas descartadas

| Opción | Por qué no |
|---|---|
| Todo FastAPI + Next.js (sílabo literal) | El equipo construiría la capa de app (auth, roles, admin, CRUD) en un stack que domina menos, con menos tiempo y sin experiencia. Alto riesgo para la rúbrica "software 100% funcional y desplegado". |
| Todo Laravel, recomendación en PHP | El curso de *Inteligencia Artificial* exige un modelo real (scikit-learn, Jupyter). Hacerlo en PHP no cumpliría ese curso. |
| Next.js SPA separada + API Laravel | Duplica trabajo: auth por token, CORS, tipos compartidos, dos despliegues. Inertia da "React de verdad" sin esa carga. |

## Cómo se cumple la mención de "FastAPI" del sílabo

El motor **es** una app FastAPI (con su `/docs` Swagger como evidencia). Que en producción se
invoque por CLI es un detalle de despliegue, no un cambio de tecnología.

## Consecuencias

- La imagen de despliegue necesita PHP **y** Python (Dockerfile propio, no buildpack).
- `app/Services/Recommender/` aísla el modo (HTTP local vs subproceso prod) del resto de Laravel.
- El frontend "React" que verá el jurado existe, pero servido por Laravel.
