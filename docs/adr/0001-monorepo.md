# ADR 0001 — Monorepo en vez de repositorios separados

- **Fecha:** 2026-08-28
- **Estado:** Aceptada

## Contexto

El proyecto tiene 3 partes (frontend, backend Laravel, motor Python) y un equipo de 3 personas,
de las cuales solo una tiene experiencia real. 17 semanas de plazo.

## Decisión

Un único repositorio (`IngeTech-AI`) con carpetas por módulo.

## Por qué

- Separar repos obliga a versionar contratos, publicar paquetes y coordinar CI cruzado: trabajo
  de integración que un equipo chico y con principiantes no puede costear.
- El motor Python ya tiene una frontera limpia (contrato JSON + subproceso), así que la
  separación lógica se logra con carpetas y `CODEOWNERS`, sin necesidad de repos aparte.
- Un solo `docker compose up` para levantar todo — clave para el onboarding de principiantes.
- Los asistentes de IA (Claude, DeepSeek) rinden mejor con todo el contexto en un repo.
- CI/CD más simple: un pipeline, con jobs por módulo.

## Consecuencias

- Hay que ser disciplinados con los límites de carpeta (`CODEOWNERS`, fichas de módulo).
- El repo mezcla PHP, JS y Python: el `.gitignore` y el CI deben contemplar los tres.
- Si el motor creciera mucho, se puede extraer a su repo más adelante sin bloquear nada hoy.
