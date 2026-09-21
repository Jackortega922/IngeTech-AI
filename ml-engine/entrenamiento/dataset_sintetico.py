"""Genera un dataset sintético de perfiles etiquetados por categoría técnica.

Todavía no hay datos reales de usuarios (el proyecto recién arranca), así que se generan
perfiles sintéticos con una regla determinística ("oráculo") que asigna la categoría según
qué actividades declaró el perfil — el clasificador entrena sobre esto para aprender a
generalizar combinaciones que el oráculo no cubre explícitamente (ej. varias actividades
mezcladas). Cuando existan datos reales de uso (tabla ``eventos_analitica``), este dataset se
reemplaza o se combina con ellos — ver "Cuándo reentrenar" en ``docs/contexto-proyecto.md`` §8.
"""

from __future__ import annotations

import random

ACTIVIDADES = [
    "programacion_web",
    "maquinas_virtuales",
    "ia_ml",
    "diseno_3d",
    "ofimatica",
    "edicion_video",
]
NIVELES = ["basico", "intermedio", "avanzado"]
SOFTWARE = [
    "vscode",
    "docker",
    "photoshop",
    "blender",
    "office",
    "premiere",
    "android_studio",
    "jupyter",
]

CATEGORIA_POR_ACTIVIDAD = {
    "programacion_web": "desarrollador_software",
    "maquinas_virtuales": "desarrollador_software",
    "ia_ml": "cientifico_datos_ia",
    "diseno_3d": "disenador_creativo",
    "edicion_video": "disenador_creativo",
    "ofimatica": "estudiante_general",
}


def _categoria_oraculo(actividades: list[str]) -> str:
    """Regla determinística que asigna la categoría "verdadera" de un perfil sintético."""
    puntajes = dict.fromkeys(set(CATEGORIA_POR_ACTIVIDAD.values()), 0)
    for actividad in actividades:
        categoria = CATEGORIA_POR_ACTIVIDAD.get(actividad)
        if categoria:
            puntajes[categoria] += 1
    return max(puntajes, key=puntajes.get)


def generar(n: int = 200, semilla: int = 42) -> list[dict]:
    rng = random.Random(semilla)
    filas = []
    for _ in range(n):
        k = rng.randint(1, 3)
        actividades = rng.sample(ACTIVIDADES, k)
        filas.append(
            {
                "actividades": actividades,
                "nivel_experiencia": rng.choice(NIVELES),
                "software": rng.sample(SOFTWARE, rng.randint(0, 3)),
                "categoria": _categoria_oraculo(actividades),
            }
        )
    return filas


if __name__ == "__main__":
    import json

    datos = generar()
    print(json.dumps(datos[:5], indent=2, ensure_ascii=False))
    print(f"Total: {len(datos)} perfiles sintéticos")
