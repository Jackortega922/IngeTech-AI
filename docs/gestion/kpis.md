# KPIs — ¿la IA recomienda bien?

Aporte de **Ingeniería Industrial** (historia E2 del backlog) y entregable **D1**. Define qué
se mide para saber si el motor de recomendación cumple su objetivo, cómo se calcula cada
indicador y qué valor se considera bueno.

Los indicadores se calculan en `DashboardController::calidadDeLaRecomendacion()` y se ven en
el panel de administración → pestaña **Dashboard** → sección *Calidad de la recomendación*.

## OKR

**Objetivo:** que cualquier cliente elija, sin conocimientos técnicos, una laptop que de verdad
le sirva para su carrera y su presupuesto.

| Resultado clave | KPI | Meta (propuesta) |
|---|---|---|
| La gente confía en lo que recomienda la IA | Tasa de elección | ≥ 60 % |
| Decidir deja de ser un proceso largo | Tiempo de decisión | ≤ 3 min (mediana) |
| Lo recomendado calza con las necesidades | Compatibilidad promedio | ≥ 80 % |
| El catálogo cubre a quien consulta | Cobertura del catálogo | ≥ 90 % |

> **Las metas son una propuesta** y deben validarse en equipo antes de usarse para evaluar.
> Todavía no hay una línea base real: los primeros valores útiles saldrán de las pruebas con
> usuarios (C9) y de la encuesta de usabilidad (D8).

## Indicadores

### 1. Tasa de elección

- **Pregunta:** ¿la gente elige lo que la IA le recomienda?
- **Fórmula:** perfiles que eligieron una opción recomendada ÷ consultas que obtuvieron
  recomendaciones × 100.
- **Fuente:** eventos `eleccion_recomendacion` (se registran al pulsar "elegir" en
  `/resultado`) sobre eventos `consulta_recomendacion` con `resultado = ok`.
- **Cuidado:** solo cuenta la **primera** elección de cada perfil. Si alguien vuelve atrás y
  elige otra opción, no pesa doble.
- **Lectura:** una tasa baja indica que las opciones no convencen — revisar el catálogo, los
  pesos del motor o la explicación que se muestra.

### 2. Tiempo de decisión

- **Pregunta:** ¿la IA ayuda a decidir rápido?
- **Fórmula:** mediana de (momento de la primera elección − momento de la consulta), por perfil.
- **Fuente:** `perfiles_usuario.created_at` (se crea al consultar) y `created_at` del evento de
  elección. Ambos los fija el reloj del **servidor**, no el del navegador, que cada usuario
  puede tener desajustado.
- **Por qué mediana y no promedio:** una persona que deja la pestaña abierta una hora
  distorsionaría el promedio; la mediana no se mueve por casos extremos.

### 3. Compatibilidad promedio

- **Pregunta:** ¿qué tan bien calzan las laptops recomendadas con lo que la persona necesita?
- **Fórmula:** promedio de `recomendaciones.compatibilidad_pct` (el % que calcula el motor por
  similitud coseno).
- **Lectura:** un promedio bajo sostenido significa que el catálogo no tiene equipos adecuados
  para los perfiles que consultan, no necesariamente que el motor falle.

### 4. Cobertura del catálogo

- **Pregunta:** ¿cuántas consultas terminan sin ninguna opción?
- **Fórmula:** consultas con `resultado = ok` ÷ total de consultas × 100.
- **Lectura:** si baja, hay perfiles (presupuestos, portabilidades) que el catálogo no cubre.
  Es un insumo directo para decidir qué equipos agregar.

### 5. Opción que más eligen *(descriptivo, sin meta)*

- **Pregunta:** cuando deciden, ¿qué valoran más: precio, equilibrio o rendimiento?
- **Fórmula:** primeras elecciones agrupadas por el badge de la opción elegida (*Mejor Opción
  Económica*, *Opción Equilibrada*, *Mejor Rendimiento*). Si una laptop ganó dos badges, cuenta
  para ambos.
- **Para qué sirve:** no mide si la IA acierta, sino qué prioriza la gente. Informa decisiones
  de catálogo y de Marketing (E6).

## Decisiones de diseño

- **Sin muestra no hay valor.** Cuando todavía no hay datos, los indicadores se muestran como
  "—" y no como 0 %: un 0 % se leería como "la IA recomienda mal" cuando en realidad no hay
  nada que medir.
- **Solo el dueño registra su elección.** La API rechaza (403) elecciones sobre
  recomendaciones de otra persona, para que nadie pueda inflar los KPIs con datos falsos.
- **Medir nunca bloquea la compra.** Si el registro de la elección falla, la persona igual
  pasa a personalizar.
- **Sin migración nueva.** La elección se guarda como un evento más en `eventos_analitica`,
  la tabla que ya existía para analítica.

## Limitaciones actuales

- Los datos acumulados hasta ahora vienen de pruebas locales del equipo, no de usuarios reales.
- La tasa de elección mide si la persona **eligió** una opción, no si después la **compró**:
  el sistema no tiene todavía registro de compras.
- El tiempo de decisión empieza a contar al recibir la recomendación, no al abrir el
  formulario; el tiempo que toma llenar el perfil no se mide.
