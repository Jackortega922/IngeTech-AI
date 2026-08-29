# Contrato del motor de recomendación

Formato JSON que intercambian Laravel (`app/Services/Recommender/`) y el motor Python
(`ml-engine/`). **Vale igual para el modo HTTP y el modo subproceso CLI.**

> ⚠️ Este contrato es un punto de acuerdo entre módulos. Cualquier cambio se hace en un PR que
> también actualice este documento y se anuncia en el grupo. Módulo A es el dueño.

## Versión

`v0` — borrador. Se congela como `v1` al cerrar el MVP (Examen Parcial).

## Entrada (perfil del usuario)

```json
{
  "perfil": {
    "carrera": "Ingeniería de Sistemas",
    "nivel_experiencia": "intermedio",
    "actividades": ["programacion_web", "maquinas_virtuales", "ia_ml"],
    "software": ["vscode", "docker", "photoshop"],
    "presupuesto_soles": 4000
  },
  "opciones": {
    "top_n": 3
  }
}
```

| Campo | Tipo | Valores |
|---|---|---|
| `carrera` | string | libre (se normaliza en el motor) |
| `nivel_experiencia` | string | `basico` · `intermedio` · `avanzado` |
| `actividades` | string[] | catálogo cerrado, ver `ml-engine/data/actividades.json` |
| `software` | string[] | catálogo cerrado, ver `ml-engine/data/software.json` |
| `presupuesto_soles` | number | > 0 |
| `opciones.top_n` | int | 1–10, por defecto 3 |

## Salida (recomendación)

```json
{
  "version": "v0",
  "recomendaciones": [
    {
      "laptop_id": 42,
      "compatibilidad_pct": 87,
      "precio_soles": 3899,
      "sobrante_soles": 101,
      "explicacion": {
        "factores": [
          { "criterio": "RAM suficiente para máquinas virtuales", "aporte": 25 },
          { "criterio": "GPU dedicada para IA/ML", "aporte": 20 },
          { "criterio": "Dentro del presupuesto", "aporte": 15 }
        ],
        "advertencias": ["El almacenamiento puede quedar corto para varios proyectos grandes"]
      }
    }
  ]
}
```

| Campo | Tipo | Nota |
|---|---|---|
| `compatibilidad_pct` | int | 0–100 |
| `explicacion.factores` | array | por qué se recomienda — se muestra al usuario (requisito de ética/transparencia) |
| `explicacion.advertencias` | string[] | limitaciones honestas de esa opción |

## Errores

```json
{ "version": "v0", "error": "sin_resultados", "mensaje": "No hay laptops dentro del presupuesto." }
```

Códigos: `sin_resultados` · `perfil_invalido` · `catalogo_vacio` · `error_interno`.

## Modo CLI (producción)

```bash
echo '{"perfil": {...}, "opciones": {...}}' | python ml-engine/cli_entry.py
# → imprime el JSON de salida en stdout, código de salida 0 (o ≠0 si error_interno)
```
