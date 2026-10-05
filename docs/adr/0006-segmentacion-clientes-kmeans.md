# ADR 0006 — El motor Python también segmenta clientes (K-Means)

- **Fecha:** 2026-10-06
- **Estado:** Aceptada

## Contexto

Marketing necesita saber a qué grupos de clientes hablarles distinto (los que compran mucho,
los que consultan y no compran, los que no vuelven). Se podía hacer con reglas fijas en PHP o
con un modelo de aprendizaje no supervisado.

## Decisión

La segmentación es una **segunda operación del motor existente** (`ml-engine/`), con
`KMeans` de scikit-learn. Usa el mismo patrón de dos modos del ADR 0003: `POST /segmentar` en
modo servidor y `"operacion": "segmentar"` en `cli_entry.py` en modo subproceso. La lógica
vive en `recommender/segmentacion.py`, pura y sin I/O, como `scoring.recomendar()`.

En Laravel va en una interfaz aparte (`SegmentadorClientes`) dentro de
`app/Services/Recommender/`, que sigue siendo el único lugar que sabe qué modo se usa.

## Por qué

- **IA real en otra disciplina:** cubre el aprendizaje no supervisado del sílabo (clustering,
  elección de k con el coeficiente de silueta), que el motor de recomendación no usaba.
- **Sin dependencias ni servicios nuevos:** scikit-learn ya está instalado y el motor ya se
  despliega en los dos modos.
- **Privacidad:** el motor recibe solo números por cliente, sin nombre ni correo (Ley 29733), y
  al panel llegan los grupos, no la lista de personas.

## Consecuencias

- Hay que mantener dos operaciones en el contrato (`docs/arquitectura/contrato-motor.md`).
- Con pocos clientes (menos de 6) no hay segmentación: el panel lo dice en vez de inventar
  grupos.
- Los nombres de los grupos salen de reglas sobre el cliente promedio (legibles y explicables);
  si cambian las variables, hay que revisar esas reglas.
