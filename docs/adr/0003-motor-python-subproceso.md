# ADR 0003 — El motor Python corre como subproceso en producción

- **Fecha:** 2026-08-28
- **Estado:** Aceptada

## Contexto

Laravel (PHP) y el motor de recomendación (Python) son dos runtimes distintos. Hay que decidir
cómo se comunican en local y en el despliegue de Render.

## Decisión

Un solo código Python en `ml-engine/`, dos modos de ejecución:

| Entorno | Modo | Cómo |
|---|---|---|
| Local (Docker Compose) | Servidor | `ml-engine` corre como servicio `uvicorn` en `:5001`. Laravel hace HTTP POST a `http://ml-engine:5001/recomendar`. |
| Producción (Render) | Subproceso | Laravel ejecuta `python ml-engine/cli_entry.py`, escribe el perfil en stdin, lee el JSON de stdout. El proceso arranca, responde y muere. |

`app/Services/Recommender/RecommenderClient.php` decide el modo según una variable de entorno
(`RECOMMENDER_MODE=http|cli`). El resto de la app solo llama a `recomendar($perfil)`.

## Por qué

- Es el patrón que el equipo ya operó en *web-etabs* y conoce.
- En un contenedor único (PHP + Python) el modo subproceso no necesita orquestar dos servicios ni
  gestionar un puerto interno, healthchecks, reinicios, etc. — menos cosas que se rompan en la demo.
- El modo HTTP en local da recarga en caliente y Swagger para desarrollar el motor cómodo.
- El mismo `recommender/` (funciones puras) se testea igual sin importar el modo.

## Consecuencias

- Hay que mantener `app.py` (FastAPI) y `cli_entry.py` finos: ambos solo parsean entrada, llaman a
  `recommender.recomendar(...)` y serializan la salida. La lógica vive en `recommender/`.
- El arranque del subproceso añade latencia (cargar Python + libs por request). Aceptable para el
  volumen de un proyecto académico; si molesta, se cachea el modelo o se pasa a servicio HTTP en Render.
- El contrato JSON ([contrato-motor.md](../arquitectura/contrato-motor.md)) es idéntico en ambos modos.
