# Módulo C — Catálogo · datos reales · manuales · QA

**Dueño:** Marco (además del Módulo B) · **IA:** DeepSeek (con revisión cercana de Jack en cada PR)

> Diego colabora de forma ocasional en tareas puntuales de este módulo (a definir más adelante).
> Mientras no tenga una tarea asignada, Marco es quien responde por todo lo de aquí.

Este módulo alimenta a todo el sistema: sin catálogo no hay qué recomendar. Es la mejor forma de
aprender el proyecto porque toca un poco de todo (datos → base de datos → una pantalla), en pasos
chicos y guiados.

## Objetivo

1. **Datos reales**: una lista de laptops que se venden en Perú (Huánuco de referencia), con sus
   especificaciones y precios en soles. Igual para accesorios y kits.
2. **Cargarlos a la base de datos** con migraciones y *seeders*.
3. **Pantalla de administración** para ver y editar el catálogo (CRUD), copiando un ejemplo que
   deja Jack.
4. **Manual de usuario** y **formulario UAT** (pruebas con usuarios reales) para el Bloque IV.

## Carpetas que te pertenecen

```
ml-engine/data/laptops.json          # catálogo de laptops (lo llenas tú)
ml-engine/data/accesorios.json
ml-engine/data/kits.json
ml-engine/data/actividades.json      # lista cerrada de actividades del perfil
ml-engine/data/software.json         # lista cerrada de software del perfil
database/seeders/CatalogoSeeder.php  # carga esos JSON a la BD
database/migrations/xxxx_catalogo_*  # tablas de catálogo (con ayuda de Jack)
resources/js/pages/admin/catalogo/   # pantalla CRUD (copiando el ejemplo de Jack)
docs/manuales/                       # manual de usuario, guion de UAT, resultados
```

## Qué NO tocas

- `app/` (salvo el controlador del catálogo, que armas con Jack) y `ml-engine/recommender/` —
  son del Módulo A. Sí puedes tocar `resources/js/pages/{perfil,resultado,personalizar}/`
  porque también es tuyo (Módulo B), pero no mezcles ambos módulos en el mismo PR — mantenlos
  en commits/PRs separados para que sea fácil de revisar.
- Si algo de eso te bloquea, escríbelo en el grupo.

## De qué dependes

| Necesitas | Te lo da |
|---|---|
| Las tablas base del catálogo (`laptops`, `accesorios`, `kits` con columnas mínimas) | Módulo A |
| Un CRUD de ejemplo ya hecho (ej. `Accesorio`) para copiar el patrón | Jack — te lo deja como referencia |
| La forma (columnas) que espera el motor | [contrato-motor.md](../arquitectura/contrato-motor.md) y `ml-engine/data/*.json` |

## Primeras tareas (orden sugerido, de menos a más código)

1. `docs: plantilla de ficha de laptop` — define qué datos recolectar (marca, modelo, CPU, RAM,
   RAM ampliable, SSD, GPU, pantalla, precio S/, tienda, link).
2. `docs: 15 laptops reales` — llena `ml-engine/data/laptops.json` con datos verificados.
3. `docs: actividades.json y software.json` — listas cerradas; como también eres dueño del
   Módulo B, defínelas pensando ya en cómo se ven en los selectores del formulario de Perfil.
4. `feat: CatalogoSeeder` — carga los JSON a la BD (Jack te muestra cómo).
5. `feat: pantalla Admin/Catalogo — listado de laptops` (copiando el ejemplo de Jack).
6. `feat: Admin/Catalogo — crear y editar una laptop`.
7. `feat: Admin/Catalogo — accesorios y kits` (mismo patrón).
8. `docs: manual de usuario` — cómo usar la app, con capturas.
9. `docs: guion de UAT` — 5 tareas que le pediremos a usuarios reales + formulario de feedback.

> Empieza por las tareas 1–3: son de investigación y documentación, no necesitan que el proyecto
> compile, y ya aportan valor real al resto del equipo.

## Cómo probar

```bash
docker compose exec app php artisan migrate:fresh --seed   # ¿se cargó el catálogo sin errores?
docker compose exec app php artisan test --filter Catalogo
```
Abre `http://localhost:8000/admin/catalogo` y verifica que se ve el listado y que puedes crear/editar.

## Definición de "hecho"

- Los JSON son válidos (sin comas de más) y tienen todas las columnas que pide el contrato.
- `migrate:fresh --seed` corre limpio.
- La pantalla lista, crea y edita sin errores.
- Los precios y specs están verificados (link a la tienda en la ficha).
