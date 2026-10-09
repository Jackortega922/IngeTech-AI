# ADR 0005 — Un LLM (ej. DeepSeek) es una función complementaria, no el motor de recomendación

- **Fecha:** 2026-09-14
- **Estado:** Aceptada

## Contexto

Al planear el motor real (tareas A7–A8), surgió la opción de usar una API de un modelo de
lenguaje (LLM), como DeepSeek, para generar la recomendación directamente — pedirle al LLM
que "razone" qué laptop conviene, en vez de entrenar un modelo propio.

## Decisión

El motor de recomendación (`ml-engine/recommender/`) se construye con aprendizaje automático
clásico y local (scikit-learn): clasificación supervisada del perfil + filtrado basado en
contenido (similitud coseno) contra el catálogo, tal como ya está documentado en
[docs/contexto-proyecto.md §7](../contexto-proyecto.md) y en el contrato del motor.

Un LLM (DeepSeek u otro) puede incorporarse **más adelante como función aparte** — por ejemplo,
un asistente conversacional que responda dudas sobre el catálogo o redacte la explicación en
lenguaje más natural — nunca como reemplazo del cálculo de compatibilidad. Backlog: **A13**.

## Por qué

- **Evaluación del curso:** las Unidades 2 y 3 del sílabo de Inteligencia Artificial piden
  preprocesamiento, entrenamiento, métricas (accuracy/F1) y ajuste de hiperparámetros de un
  modelo propio. Llamar a un LLM externo no produce ninguna de esas evidencias — no hay modelo
  que entrenar ni evaluar.
- **Explicabilidad verificable:** el requisito ético del proyecto (`RF-ET1`) exige que cada
  recomendación traiga una explicación de factores. Con similitud coseno, esa explicación sale
  directamente de los pesos del cálculo — es matemáticamente trazable. Un LLM puede redactar una
  justificación plausible que no corresponda al cálculo real ("alucinación").
- **Privacidad (`RF-ET2`, `RNF-05`):** el perfil del usuario no debe salir de la infraestructura
  propia. Enviarlo a una API externa de terceros para generar la recomendación misma
  contradice ese principio; para una función complementaria y opcional (ej. un chat de ayuda)
  el usuario puede optar explícitamente por usarla.
- **Costo y dependencia:** cada llamada a una API de LLM tiene costo y depende de que el
  proveedor esté disponible; el cálculo local no depende de internet ni de un tercero.
- El sílabo de IA sí contempla LLM/NLP/RAG en su Unidad 4 ("Sistemas Inteligentes") como una
  capa adicional de la aplicación — encaja como función complementaria, no como núcleo.

## Consecuencias

- `ml-engine/recommender/` sigue siendo funciones puras de ML clásico, sin llamadas a APIs
  externas ni claves de terceros en su lógica central.
- La función de asistente con LLM (A13), cuando se construya, vive en un módulo aparte (ej.
  `ml-engine/assistant/` o un servicio propio en Laravel) con su propio contrato, sin tocar
  `contrato-motor.md`.
- Si el equipo más adelante decide que el asistente con LLM necesita datos del perfil, eso pasa
  por consentimiento explícito del usuario (no automático), coherente con la disciplina de
  Ética y Protección de Datos.

## Actualización (2026-10-07): el proveedor pasa a Gemini

La decisión no cambia: el LLM sigue siendo solo el asistente del chat. Cambia el proveedor:
**DeepSeek → Gemini** (Google AI Studio), porque DeepSeek exige saldo y el plan gratuito de
Gemini no pide tarjeta. Se usa su endpoint compatible con OpenAI, el mismo formato que ya usaba
el chat (`app/Services/Asistente/GeminiAsistente.php`).

Consecuencia de Derecho: en el plan gratuito Google puede usar las conversaciones para mejorar
sus productos. Por eso al LLM no se le envía nada del usuario (ni nombre, ni correo, ni perfil),
solo lo que escribe en el chat, y la página "Cómo decide la IA" lo avisa.

## Actualización (2026-10-09): modo personal

El chat también ayuda al **personal de la tienda**. Si quien escribe tiene un rol del personal
(Administrador, Ventas, Almacén o Contabilidad), Laravel le dice al LLM **solo ese rol**, y las
instrucciones pasan de "asistente de ventas" a "asistente del panel": explica cómo usar las
secciones que ese rol puede ver (`App\Support\GuiaPanel`, una guía por permiso de
`App\Support\Roles`).

- El rol no identifica a nadie: sigue sin enviarse nombre, correo ni perfil.
- El LLM **no recibe datos de la tienda** (pedidos, clientes, ventas, stock). Si se los piden,
  indica en qué sección del panel verlos. Darle esos datos expondría información personal.
- Sin Gemini, el respaldo por palabras clave devuelve la guía de la sección, solo si el rol puede
  verla.
- Clientes y visitantes no cambian: siguen con el asistente de ventas.
