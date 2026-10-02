"""Punto de entrada del motor de recomendación.

Orquesta: catálogo -> perfilado (clasificación supervisada) -> similitud por contenido
(coseno) -> filtro de presupuesto -> ranking top-N. Ver docs/arquitectura/contrato-motor.md
para el contrato exacto y docs/contexto-proyecto.md §7-8 para el diseño completo.
"""

from __future__ import annotations

from typing import Any

from .catalogo import cargar_actividades, cargar_laptops, cargar_software
from .perfilado import VECTOR_BASE_POR_CATEGORIA, clasificar_perfil
from .preferencias import PESO_AFINIDAD, afinidad, filtrar_marcas
from .similitud import (
    calcular_compatibilidad,
    combinar_vectores,
    maximo_vectores,
    vector_ideal_por_actividades,
    vector_ideal_por_software,
)

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

    # Basta con actividades O programas: alguien puede saber qué programas usa sin marcar
    # ninguna actividad (y al revés).
    if not perfil.get("actividades") and not perfil.get("software"):
        return _error("perfil_invalido", "El perfil no incluye actividades ni programas.")

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

    # Cuestionario de bienvenida (opcional): marcas a evitar se descartan antes de rankear.
    preferencias = perfil.get("preferencias") or {}
    if preferencias:
        candidatos = filtrar_marcas(candidatos, preferencias, minimo=min(top_n, len(candidatos)))

    actividades_idx = cargar_actividades()
    categoria = clasificar_perfil(perfil, actividades_idx)
    ideal_actividades = vector_ideal_por_actividades(
        perfil.get("actividades") or [], actividades_idx
    )
    ideal_programas = vector_ideal_por_software(perfil.get("software") or [], cargar_software())
    # Lo más exigente entre lo que harás (actividades) y lo que usarás (programas).
    ideal_uso = maximo_vectores(ideal_actividades, ideal_programas)
    if perfil.get("actividades"):
        base_categoria = VECTOR_BASE_POR_CATEGORIA.get(categoria, ideal_uso)
        ideal = combinar_vectores(ideal_uso, base_categoria)
    else:
        # Sin actividades, el clasificador (entrenado con perfiles que siempre las tienen)
        # adivina una categoría al azar y esa categoría pesaría la mitad del resultado. Se
        # recomienda solo por lo que piden los programas.
        ideal = ideal_uso

    resultados = calcular_compatibilidad(ideal, candidatos)
    if preferencias:
        _aplicar_preferencias(resultados, preferencias, candidatos)
    resultados.sort(key=lambda r: r["compatibilidad_pct"], reverse=True)
    top = resultados[:top_n]

    recomendaciones = [
        {
            "laptop_id": r["laptop"]["id"],
            "compatibilidad_pct": r["compatibilidad_pct"],
            # Solo si hubo preferencias: de dónde sale el % (técnica vs. la persona).
            **(
                {"compatibilidad_tecnica_pct": r["tecnica_pct"], "afinidad_pct": r["afinidad_pct"]}
                if "afinidad_pct" in r
                else {}
            ),
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


def _aplicar_preferencias(
    resultados: list[dict[str, Any]],
    preferencias: dict[str, Any],
    candidatos: list[dict[str, Any]],
) -> None:
    """Combina la compatibilidad técnica con la afinidad a la persona (70% / 30%).

    Modifica ``resultados`` en el lugar: ajusta el %, agrega los motivos que vienen del
    cuestionario a ``factores`` y los avisos a ``advertencias``.
    """
    precios = [c.get("precio_soles", 0) for c in candidatos]
    rango = (min(precios), max(precios))

    for r in resultados:
        af = afinidad(r["laptop"], preferencias, rango)
        if af is None:
            continue

        tecnica = r["compatibilidad_pct"]
        final = round((1 - PESO_AFINIDAD) * tecnica + PESO_AFINIDAD * af["valor"] * 100)

        # Los factores técnicos pesan 70% del total; los de la persona, el 30% restante.
        factores = [
            {**f, "aporte": round(f["aporte"] * (1 - PESO_AFINIDAD))} for f in r["factores"]
        ]
        factores += [
            {"criterio": f["criterio"], "aporte": round(PESO_AFINIDAD * 100 * f["peso_relativo"])}
            for f in af["factores"]
        ]
        factores.sort(key=lambda x: x["aporte"], reverse=True)

        advertencias = r["advertencias"] + af["advertencias"]
        if af["marca_evitada"]:
            advertencias.append(
                "Es de una marca que prefieres evitar; la incluimos porque hay pocas opciones "
                "en tu presupuesto."
            )

        r.update(
            compatibilidad_pct=final,
            tecnica_pct=tecnica,
            afinidad_pct=round(af["valor"] * 100),
            factores=factores,
            advertencias=advertencias,
        )
