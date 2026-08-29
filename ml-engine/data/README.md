# Datos del catálogo

**Los mantiene el Módulo C (Diego).** El motor y el seeder de Laravel leen estos archivos.

Reglas:
- JSON válido (usa un validador; cuidado con la coma final de más).
- Precios en **soles peruanos** (número, sin `S/` ni comas de miles).
- Cada laptop con un **link a la tienda** donde verificaste specs y precio.
- No inventes datos. Si no encuentras un dato, ponlo en `null` y anótalo.

## `laptops.json` — formato de cada laptop

```json
{
  "id": 1,
  "marca": "Lenovo",
  "modelo": "IdeaPad Slim 3",
  "cpu": "AMD Ryzen 5 7530U",
  "cpu_score": 3200,
  "ram_gb": 16,
  "ram_ampliable_gb": 24,
  "almacenamiento_gb": 512,
  "almacenamiento_tipo": "SSD NVMe",
  "gpu": "AMD Radeon integrada",
  "gpu_dedicada": false,
  "pantalla_pulgadas": 15.6,
  "peso_kg": 1.6,
  "precio_soles": 2499,
  "tienda": "Coolbox",
  "link": "https://...",
  "fecha_verificacion": "2026-08-28"
}
```

| Campo | Para qué lo usa el motor |
|---|---|
| `cpu_score` | comparar potencia entre modelos (usa un ranking público, ej. PassMark; anota la fuente) |
| `ram_gb`, `ram_ampliable_gb` | actividades pesadas (VMs, IA) piden más RAM |
| `gpu_dedicada` | diseño/3D e IA/ML puntúan alto si es `true` |
| `almacenamiento_gb` | proyectos grandes / muchos entornos |
| `precio_soles` | filtro de presupuesto y cálculo de sobrante |

## Otros archivos

| Archivo | Contenido |
|---|---|
| `accesorios.json` | mochila, mouse, cooler, hub… `{id, nombre, tipo, precio_soles, ...}` |
| `kits.json` | combos con descuento `{id, nombre, incluye: [ids], precio_soles}` |
| `actividades.json` | lista cerrada de actividades del perfil — **acordar con Marco** (él las pone en el formulario) |
| `software.json` | lista cerrada de software del perfil — **acordar con Marco** |

Ejemplo `actividades.json`:
```json
[
  { "clave": "programacion_web", "etiqueta": "Desarrollo web", "peso_ram": 1, "peso_cpu": 2, "peso_gpu": 0 },
  { "clave": "maquinas_virtuales", "etiqueta": "Máquinas virtuales", "peso_ram": 3, "peso_cpu": 2, "peso_gpu": 0 },
  { "clave": "ia_ml", "etiqueta": "IA / Machine Learning", "peso_ram": 2, "peso_cpu": 2, "peso_gpu": 3 },
  { "clave": "diseno_3d", "etiqueta": "Diseño y 3D", "peso_ram": 2, "peso_cpu": 2, "peso_gpu": 3 }
]
```
