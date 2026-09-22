"""Similitud por contenido entre el perfil del usuario y el catálogo de laptops.

Traduce las actividades declaradas en un vector de especificaciones ideales (pesos de
``ml-engine/data/actividades.json``), lo combina con el vector base de la categoría técnica
predicha por ``perfilado.py``, y compara ese vector contra cada laptop del catálogo con
similitud coseno (``sklearn.metrics.pairwise.cosine_similarity``). Funciones puras: reciben
datos ya cargados, no leen archivos ni dependen de un framework.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

FACTORES = ("ram", "cpu", "gpu")

PESO_MAXIMO = 3  # escala documentada en ml-engine/data/README.md (0-3 por actividad)

ETIQUETAS_FACTOR = {
    "ram": "Memoria RAM suficiente para tus actividades",
    "cpu": "Procesador adecuado para tus actividades",
    "gpu": "GPU dedicada para tareas que la necesitan",
}


def vector_ideal_por_actividades(
    actividades_perfil: list[str],
    actividades_idx: dict[str, dict[str, Any]],
) -> dict[str, float]:
    """Suma los pesos de las actividades declaradas y los limita a [0, 1] por factor."""
    crudo = {"ram": 0.0, "cpu": 0.0, "gpu": 0.0}
    for clave in actividades_perfil:
        actividad = actividades_idx.get(clave)
        if not actividad:
            continue
        crudo["ram"] += actividad.get("peso_ram", 0)
        crudo["cpu"] += actividad.get("peso_cpu", 0)
        crudo["gpu"] += actividad.get("peso_gpu", 0)
    return {f: min(crudo[f] / PESO_MAXIMO, 1.0) for f in FACTORES}


def combinar_vectores(a: dict[str, float], b: dict[str, float]) -> dict[str, float]:
    """Promedia el vector de actividades con el vector base de la categoría predicha."""
    return {f: (a.get(f, 0.0) + b.get(f, 0.0)) / 2 for f in FACTORES}


def _normalizar_catalogo(laptops: list[dict[str, Any]]) -> dict[Any, dict[str, float]]:
    """Normaliza ram_gb y cpu_score del catálogo a [0,1] (min-max); gpu_dedicada ya es 0/1."""
    rams = [laptop.get("ram_gb", 0) for laptop in laptops]
    cpus = [laptop.get("cpu_score", 0) for laptop in laptops]
    ram_min, ram_max = min(rams), max(rams)
    cpu_min, cpu_max = min(cpus), max(cpus)

    def escalar(valor: float, minimo: float, maximo: float) -> float:
        if maximo == minimo:
            return 1.0
        return (valor - minimo) / (maximo - minimo)

    return {
        laptop["id"]: {
            "ram": escalar(laptop.get("ram_gb", 0), ram_min, ram_max),
            "cpu": escalar(laptop.get("cpu_score", 0), cpu_min, cpu_max),
            "gpu": 1.0 if laptop.get("gpu_dedicada") else 0.0,
        }
        for laptop in laptops
    }


def calcular_compatibilidad(
    ideal: dict[str, float],
    laptops: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Por cada laptop: % de compatibilidad (similitud coseno) + explicación de factores."""
    if not laptops:
        return []

    normalizado = _normalizar_catalogo(laptops)
    vector_a = np.array([[ideal[f] for f in FACTORES]])

    resultados = []
    for laptop in laptops:
        specs = normalizado[laptop["id"]]
        vector_b = np.array([[specs[f] for f in FACTORES]])

        similitud = float(cosine_similarity(vector_a, vector_b)[0][0])
        compatibilidad_pct = round(similitud * 100)

        contribuciones = {f: ideal[f] * specs[f] for f in FACTORES}
        total_contribucion = sum(contribuciones.values()) or 1.0
        factores = [
            {
                "criterio": ETIQUETAS_FACTOR[f],
                "aporte": round((contribuciones[f] / total_contribucion) * compatibilidad_pct),
            }
            for f in FACTORES
            if ideal[f] > 0
        ]
        factores.sort(key=lambda x: x["aporte"], reverse=True)

        advertencias = []
        if ideal["ram"] > 0.6 and specs["ram"] < 0.5:
            advertencias.append("La RAM puede quedar corta para tus actividades más exigentes.")
        if ideal["gpu"] > 0.5 and specs["gpu"] == 0.0:
            advertencias.append(
                "Esta laptop no tiene GPU dedicada; puede limitar tareas de IA/diseño."
            )

        resultados.append(
            {
                "laptop": laptop,
                "compatibilidad_pct": compatibilidad_pct,
                "factores": factores,
                "advertencias": advertencias,
            }
        )

    return resultados
