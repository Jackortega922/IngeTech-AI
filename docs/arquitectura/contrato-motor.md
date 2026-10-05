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
    "top_n": 3,
    "excluir_ids": [7]
  }
}
```

| Campo | Tipo | Valores |
|---|---|---|
| `carrera` | string | libre; puede venir vacío (`""`): la carrera es opcional para el público general |
| `nivel_experiencia` | string | `basico` · `intermedio` · `avanzado` |
| `actividades` | string[] | catálogo cerrado, ver `ml-engine/data/actividades.json`. Puede ir vacío si viene `software` |
| `software` | string[] | programas que la persona dice usar (o los de su carrera), catálogo `ml-engine/data/software.json` con sus requisitos. El motor toma el más exigente por factor (RAM, CPU, GPU) y lo combina con las actividades. Puede ir vacío si vienen `actividades` |
| `presupuesto_soles` | number | > 0 |
| `opciones.top_n` | int | 1–10, por defecto 3 |
| `opciones.excluir_ids` | int[] | **Opcional.** Laptops que no se deben recomendar: las agotadas según el inventario de Laravel (Administración). Se quitan antes del filtro de presupuesto; si no queda ninguna dentro del presupuesto, la respuesta es `sin_resultados`. |
| `preferencias` | object | **Opcional.** Respuestas del cuestionario de bienvenida (ver abajo). Si falta, el motor recomienda como siempre. |

### `perfil.preferencias` (opcional)

Viene del cuestionario de bienvenida (Psicología, `App\Support\CuestionarioBienvenida`). Laravel
solo lo envía si el cliente completó el cuestionario, y omite las respuestas vacías.

```json
"preferencias": {
  "movilidad": "diario",
  "lejos_enchufe": "muchas_horas",
  "molestias": ["se_congela", "bateria_corta"],
  "anios_uso": "5_mas",
  "prioridades": ["portabilidad", "precio", "rendimiento"],
  "marcas_preferidas": ["Lenovo"],
  "marcas_evitar": ["Acer"],
  "perifericos": ["proyector", "camara_sd"]
}
```

| Campo | Valores | Qué hace en el motor (`recommender/preferencias.py`) |
|---|---|---|
| `movilidad` | `fija` · `a_veces` · `diario` | Premia las laptops ligeras (menos de 1.5 kg si es `diario`) |
| `lejos_enchufe` | `casi_nunca` · `a_veces` · `muchas_horas` | Premia la batería (8 h o más si es `muchas_horas`) |
| `molestias` | `lenta_al_encender` · `se_congela` · `bateria_corta` · `pesada` · `se_calienta` · `pantalla_pequena` · `no_tengo` | Evita repetir el problema: `se_congela` pide 16 GB, `lenta_al_encender` pide SSD, etc. (`se_calienta` aún no tiene dato para medirse) |
| `anios_uso` | `2` · `3_4` · `5_mas` | Premia RAM de sobra, RAM ampliable y buen procesador |
| `prioridades` | orden de `precio` · `rendimiento` · `portabilidad` · `durabilidad` · `diseno` | Lo elegido primero pesa más (3 · 2 · 1.5 · 1 · 0.5) |
| `marcas_preferidas` | marcas del catálogo | Suman afinidad |
| `marcas_evitar` | marcas del catálogo | Se descartan antes del ranking, salvo que no queden suficientes opciones (entonces se avisa) |
| `perifericos` | `monitor` · `proyector` · `tableta_grafica` · `muchas_usb` · `camara_sd` · `ninguno` | Revisa HDMI, USB-A y lector SD |

Con preferencias, `compatibilidad_pct = 70% compatibilidad técnica (coseno) + 30% afinidad con la
persona`. Cada preferencia que la laptop cumple se suma a `explicacion.factores`, y cada una que no
cumple se suma a `explicacion.advertencias`.

El catálogo del motor (`ml-engine/data/laptops.json`) incluye para esto `bateria_horas`,
`pantalla_*`, `peso_kg` y `puertos`. Se regenera desde la BD con `php artisan motor:exportar-catalogo`.

Se exige **al menos `actividades` o `software`**; si faltan los dos, el motor responde
`perfil_invalido`. `ml-engine/data/laptops.json` y `software.json` se regeneran desde la BD con
`php artisan motor:exportar-catalogo`.

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
| `compatibilidad_tecnica_pct` | int | **Solo si hubo `preferencias`.** El % técnico (coseno) antes de combinar |
| `afinidad_pct` | int | **Solo si hubo `preferencias`.** Qué tan bien encaja con cómo es la persona |
| `explicacion.factores` | array | por qué se recomienda — se muestra al usuario (requisito de ética/transparencia) |
| `explicacion.advertencias` | string[] | limitaciones honestas de esa opción |

## Errores

```json
{ "version": "v0", "error": "sin_resultados", "mensaje": "No hay laptops dentro del presupuesto." }
```

Códigos: `sin_resultados` · `perfil_invalido` · `catalogo_vacio` · `error_interno`.

## Operación: segmentar (Marketing)

Segunda operación del mismo motor ([ADR 0006](../adr/0006-segmentacion-clientes-kmeans.md)):
agrupa a los clientes con K-Means según su comportamiento. HTTP: `POST /segmentar`. CLI: el
mismo `cli_entry.py` con `"operacion": "segmentar"` en el JSON. Laravel la llama desde
`App\Services\Recommender\SegmentadorClientes`.

Entrada — solo números por cliente, sin nombre ni correo:

```json
{
  "clientes": [
    { "id": 12, "presupuesto_soles": 2500, "recomendaciones": 3, "pedidos": 0, "gasto_soles": 0, "dias_inactivo": 4 }
  ]
}
```

| Campo | Qué es |
|---|---|
| `presupuesto_soles` | promedio de lo que declaró en sus perfiles (o lo que pagó en promedio, si no pidió recomendaciones) |
| `recomendaciones` | cuántas recomendaciones pidió |
| `pedidos` / `gasto_soles` | compras no canceladas y su total |
| `dias_inactivo` | días desde su última actividad |

Salida:

```json
{
  "version": "v0",
  "k": 3,
  "silueta": 0.62,
  "segmentos": [
    {
      "tipo": "interesados",
      "nombre": "Interesados que aún no compran · presupuesto medio",
      "accion": "Cupón de primera compra: consultan varias veces pero aún no se deciden.",
      "tamano": 14,
      "clientes": [12, 15, 31],
      "promedio": { "presupuesto_soles": 2480.5, "recomendaciones": 3.2, "pedidos": 0, "gasto_soles": 0, "dias_inactivo": 9.1 }
    }
  ]
}
```

- `k`: número de grupos, elegido entre 2 y 5 por el mejor `silueta` (coeficiente de silueta, -1 a 1).
- `tipo`: `alto_valor` · `compradores` · `interesados` · `exploradores` · `inactivos`, puesto con
  reglas legibles sobre el cliente promedio del grupo.
- Error propio: `datos_insuficientes` (menos de 6 clientes, o todos iguales).

## Modo CLI (producción)

```bash
echo '{"perfil": {...}, "opciones": {...}}' | python ml-engine/cli_entry.py
# → imprime el JSON de salida en stdout, código de salida 0 (o ≠0 si error_interno)
```
