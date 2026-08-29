# Módulo B — Frontend del flujo de usuario

**Dueño:** Marco · **IA:** DeepSeek

Las pantallas que usa la persona de principio a fin: llenar su perfil, ver la laptop recomendada
con su % de compatibilidad, y personalizar la configuración.

## Objetivo

Un flujo claro y usable, en 3 pantallas:

1. **Perfil** — formulario por pasos: carrera → nivel → actividades → software → presupuesto.
2. **Resultado** — laptop recomendada, % de compatibilidad (visualizado, no solo un número),
   y la explicación de *por qué* (factores que suman).
3. **Personalización** — ajustar RAM/SSD y agregar kits/accesorios; ver cómo cambia el precio.

## Carpetas que te pertenecen

```
resources/js/pages/perfil/          # formulario por pasos
resources/js/pages/resultado/       # tarjeta de recomendación + gráfico de compatibilidad
resources/js/pages/personalizar/    # selección de RAM/SSD/kits/accesorios + resumen de precio
resources/js/hooks/                 # hooks propios del flujo (ej. useWizard)
```

## Qué NO tocas

- `app/` y `ml-engine/` → Módulo A. Tú **consumes** la API, no la modificas.
- `resources/js/pages/admin/` → Módulo C.
- `resources/js/components/ui/` (componentes de shadcn/ui) y `resources/js/layouts/` → los usas; si falta uno, pídeselo a Jack.

> El frontend es **TypeScript** (`.tsx`). Puedes empezar con tipos flojos (`any` donde te trabe) e
> ir apretando. Los componentes base (botón, input, select, diálogo, tarjeta…) ya vienen de shadcn/ui
> en `resources/js/components/ui/`. El login/registro y los ajustes de perfil ya están hechos.

## De qué dependes

| Necesitas | Te lo da | Mientras no esté listo |
|---|---|---|
| `POST /api/recomendaciones` | Módulo A | A entrega un **mock** que responde según [el contrato](../arquitectura/contrato-motor.md). Trabaja contra ese contrato desde el día 1. |
| Catálogos de `actividades` y `software` para los selectores | Módulo A / C | Usa `ml-engine/data/actividades.json` y `software.json` (o un mock local con la misma forma). |
| Componentes base (Button, Input, Card…) | Módulo A (shadcn/ui) | — |

**Clave:** como el contrato JSON está fijo, puedes construir las 3 pantallas completas con datos
de ejemplo antes de que el motor real exista.

## Primeras tareas (orden sugerido)

1. `feat: página Perfil — paso 1 (carrera y nivel)`
2. `feat: Perfil — pasos 2 y 3 (actividades, software) con selección múltiple`
3. `feat: Perfil — paso 4 (presupuesto) + validación + envío a /api/recomendaciones`
4. `feat: página Resultado — tarjeta de laptop + barra/aro de compatibilidad`
5. `feat: Resultado — lista de factores de la explicación y advertencias`
6. `feat: página Personalizar — selección de RAM/SSD y recálculo de precio`
7. `feat: Personalizar — agregar kits y accesorios al resumen`
8. `test: pruebas de los componentes del wizard`
9. `chore: estados de carga y de error de la API`

## Cómo probar

```bash
composer run dev          # servidor + vite; abre http://localhost:8000
npm run lint              # ESLint
npx tsc --noEmit          # tipos
npm run format            # Prettier (formatea)
php artisan test          # pruebas de las páginas (Pest, con Inertia)
```
Prueba con presupuesto muy bajo (debe mostrar el error `sin_resultados` con elegancia) y con
perfiles distintos.

> Aún no hay runner de pruebas de JS (Vitest). Si tu componente tiene lógica de cálculo (ej. el
> precio al personalizar), coordina con Jack para agregar Vitest, o extrae esa lógica a una función
> pura y pruébala desde una prueba Pest/Inertia.

## Definición de "hecho"

- Se ve bien en pantalla de laptop y de celular (responsive).
- Maneja carga, error y "sin resultados" sin romperse.
- `npm run lint`, `tsc` y `npm run format:check` en verde.
- Textos en español, claros, sin jerga técnica para el usuario final.
