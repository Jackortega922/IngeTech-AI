"""Afinidad de las laptops del comparador con la persona (operación ``afinidad``).

El comparador ya muestra las specs lado a lado; esto agrega "cuál te conviene a ti" usando solo
el cuestionario de bienvenida (Psicología). Usa **la misma** función ``preferencias.afinidad``
que la recomendación con IA, así los dos nunca se contradicen: si cambia un criterio del
cuestionario, cambia en ambos.

No reemplaza a la recomendación con IA, que además usa la carrera, las actividades, los
programas, el presupuesto y el clasificador entrenado; aquí solo se ordenan las 2-3 laptops que
la persona ya eligió comparar. Contrato en docs/arquitectura/contrato-motor.md
("Operación: afinidad").
"""

from __future__ import annotations

from typing import Any

from .catalogo import cargar_laptops
from .preferencias import afinidad

VERSION = "v0"


def _error(codigo: str, mensaje: str) -> dict[str, Any]:
    return {"version": VERSION, "error": codigo, "mensaje": mensaje}


def comparar_afinidad(payload: dict[str, Any]) -> dict[str, Any]:
    """Recibe ``{"preferencias": {...}, "laptop_ids": [...]}`` y las ordena por afinidad."""
    preferencias = payload.get("preferencias") or {}
    if not preferencias:
        return _error("sin_preferencias", "No hay respuestas del cuestionario.")

    ids = list(dict.fromkeys(payload.get("laptop_ids") or []))  # sin repetidos, en orden
    catalogo = {laptop.get("id"): laptop for laptop in cargar_laptops()}
    if not catalogo:
        return _error("catalogo_vacio", "El catálogo de laptops está vacío.")

    laptops = [catalogo[i] for i in ids if i in catalogo]
    if len(laptops) < 2:
        return _error("sin_resultados", "Se necesitan al menos 2 laptops del catálogo.")

    # "Precio" se mide contra las laptops que se están comparando, no contra todo el catálogo.
    precios = [laptop.get("precio_soles", 0) for laptop in laptops]
    rango = (min(precios), max(precios))

    afinidades = []
    for laptop in laptops:
        af = afinidad(laptop, preferencias, rango)
        if af is None:
            # Las respuestas no generan ningún criterio: no hay nada que decir de la persona.
            return _error("sin_preferencias", "Las respuestas del cuestionario no dan criterios.")

        advertencias = list(af["advertencias"])
        if af["marca_evitada"]:
            advertencias.append("Es de una marca que prefieres evitar.")

        afinidades.append(
            {
                "laptop_id": laptop["id"],
                "afinidad_pct": round(af["valor"] * 100),
                "factores": [
                    {"criterio": f["criterio"], "aporte": round(f["peso_relativo"] * 100)}
                    for f in af["factores"]
                ],
                "advertencias": advertencias,
            }
        )

    # Mayor afinidad primero; en empate se respeta el orden en que la persona las eligió.
    afinidades.sort(key=lambda a: a["afinidad_pct"], reverse=True)
    return {"version": VERSION, "afinidades": afinidades}
