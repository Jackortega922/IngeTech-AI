# Analítica e impacto (Bloque III)

Mide si el sistema genera valor. Se apoya en la tabla `eventos_analitica` que llena la API
(Módulo A) cada vez que alguien pide una recomendación o personaliza una configuración.

## KPIs / OKRs candidatos

| Indicador | Cómo se mide | Fuente |
|---|---|---|
| % de compatibilidad promedio de las recomendaciones | media de `recomendaciones.compatibilidad_pct` | BD |
| Tiempo de decisión con el sistema vs. búsqueda manual | cronómetro en las pruebas UAT | `docs/manuales/` |
| Tasa de personalización (usuarios que ajustan la config) | eventos `personalizacion_iniciada` / `recomendacion_vista` | BD |
| Ahorro estimado (sobrante de presupuesto bien usado) | media de `sobrante_soles` | BD |
| Satisfacción (encuesta post-uso) | formulario UAT (escala 1–5) | `docs/manuales/` |

## Dashboard

Grafana conectado directo a PostgreSQL (paneles versionados como JSON en esta carpeta) o
Power BI Desktop (`.pbix` + capturas). La decisión se registra en un ADR cuando se implemente (D2).

## Contenido de esta carpeta (cuando exista)

```
analitica/
├── consultas/        # SQL de cada KPI
├── grafana/          # dashboards exportados (JSON)
└── informe/          # borrador del informe de evaluación de impacto
```
