# Guía para asistentes de IA (Claude, DeepSeek y otros)

Reglas comunes para cualquier IA que genere código en este repositorio. `CLAUDE.md` apunta aquí.

## Contexto del proyecto

IngeTech AI recomienda laptops según el perfil del usuario (carrera, actividades, software,
presupuesto) y devuelve un **% de compatibilidad**; luego el usuario personaliza (RAM, SSD, kits,
accesorios). Lee `docs/arquitectura/vision-general.md` y la ficha del módulo en `docs/modulos/`
antes de proponer cambios.

## Stack

- **App + API:** Laravel 11, PHP 8.2+. Frontend con **Inertia + React** (no Blade salvo el layout raíz), Tailwind CSS.
- **Motor de recomendación:** `ml-engine/`, Python + FastAPI. En local corre como servidor
  (uvicorn); en producción Laravel lo invoca como **subproceso CLI** (`ml-engine/cli_entry.py`).
  El mismo código sirve ambos modos.
- **BD:** PostgreSQL. Migraciones con Eloquent. Nunca escribir SQL de esquema a mano.
- **Contrato entre Laravel y el motor:** JSON documentado en `docs/arquitectura/contrato-motor.md`.

## Límites por módulo

Respeta `.github/CODEOWNERS`. No modifiques archivos fuera del módulo en el que se te pidió
trabajar. Si un cambio necesita tocar otro módulo, decláralo en la respuesta en vez de hacerlo.

## Estilo

- PHP: sigue Laravel Pint (PSR-12). Nombres y comentarios en español, código en inglés cuando sea idiomático.
- Python: `ruff` + `black`. Type hints en funciones públicas. Funciones puras en `recommender/`
  (sin I/O, sin framework) para poder testearlas fácil.
- React: componentes funcionales, hooks. Un componente por archivo. Nada de estado global hasta que haga falta.
- Tests junto al código que prueban. Todo PR con lógica nueva trae su prueba.

## Qué NO hacer

- No agregar dependencias sin justificar el porqué en el PR.
- No introducir jQuery, Alpine, Vue, ni librerías de UI pesadas: la línea es React + shadcn/ui.
- No romper el contrato JSON del motor sin actualizar `docs/arquitectura/contrato-motor.md` y avisar.
- No commitear `.env`, credenciales, ni datos de usuarios reales.
- No “arreglar de paso” archivos de otro módulo.

## Reutilización

`PC_EXPERT/` es un prototipo previo (desktop, Tkinter). Su lógica de recomendación y compatibilidad
(`PC_EXPERT/src/recomendador_pro.py`, `PC_EXPERT/src/compatibilidad.py`) y su catálogo JSON
(`PC_EXPERT/data/`) sirven como punto de partida para `ml-engine/`, pero hay que adaptarlos:
PC_EXPERT arma PCs de piezas y recomienda solo por presupuesto; IngeTech AI recomienda laptops
completas y por perfil.
