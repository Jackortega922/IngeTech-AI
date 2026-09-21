"""Punto de entrada del motor de recomendación.

Orquesta: catálogo -> perfilado (clasificación supervisada) -> similitud por contenido
(coseno) -> filtro de presupuesto -> ranking top-N. Ver docs/arquitectura/contrato-motor.md
para el contrato exacto y docs/contexto-proyecto.md §7-8 para el diseño completo.
"""

from __future__ import annotations

from typing import Any

from .catalogo import cargar_actividades, cargar_laptops
from .perfilado import VECTOR_BASE_POR_CATEGORIA, clasificar_perfil
from .similitud import calcular_compatibilidad, combinar_vectores, vector_ideal_por_actividades

CONTRATO_VERSION = "v0"


def _a_numero(valor: Any) -> float | None:
    """Convierte a float lo que venga del JSON; devuelve None si no es un número."""
    try:
        return float(valor)
    except (TypeError, ValueError):
        return None


def _error(codigo: str, mensaje: str) -> dict[str, Any]:
    return {"version": CONTRATO_VERSION, "error": codigo, "mensaje": mensaje}


def recomendar(payload: dict[str, Any]) -> dict[str, Any]:
    """Recibe ``{"perfil": {...}, "opciones": {...}}`` y devuelve la respuesta del contrato."""
    perfil = payload.get("perfil") or {}

    if not perfil.get("actividades"):
        return _error("perfil_invalido", "El perfil no incluye actividades.")

    presupuesto = _a_numero(perfil.get("presupuesto_soles"))
    if presupuesto is None or presupuesto <= 0:
        return _error("perfil_invalido", "El perfil no incluye un presupuesto válido.")

    top_n = (payload.get("opciones") or {}).get("top_n", 3)
    top_n = max(1, min(int(top_n), 10))

    laptops = cargar_laptops()
    if not laptops:
        return _error("catalogo_vacio", "El catálogo de laptops está vacío.")

    candidatos = [laptop for laptop in laptops if laptop.get("precio_soles", 0) <= presupuesto]
    if not candidatos:
        return _error("sin_resultados", "No hay laptops dentro del presupuesto.")

    actividades_idx = cargar_actividades()
    categoria = clasificar_perfil(perfil, actividades_idx)
    ideal_actividades = vector_ideal_por_actividades(perfil["actividades"], actividades_idx)
    base_categoria = VECTOR_BASE_POR_CATEGORIA.get(categoria, ideal_actividades)
    ideal = combinar_vectores(ideal_actividades, base_categoria)

    resultados = calcular_compatibilidad(ideal, candidatos)
    resultados.sort(key=lambda r: r["compatibilidad_pct"], reverse=True)
    top = resultados[:top_n]

    recomendaciones = [
        {
            "laptop_id": r["laptop"]["id"],
            "compatibilidad_pct": r["compatibilidad_pct"],
            "precio_soles": r["laptop"]["precio_soles"],
            "sobrante_soles": round(presupuesto - r["laptop"]["precio_soles"], 2),
            "explicacion": {
                "factores": r["factores"],
                "advertencias": r["advertencias"],
            },
        }
        for r in top
    ]

    return {"version": CONTRATO_VERSION, "recomendaciones": recomendaciones}
