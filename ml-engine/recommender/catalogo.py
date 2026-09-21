"""Carga del catálogo (laptops, actividades, software) desde ``ml-engine/data/``.

Es la única pieza de ``recommender/`` que hace I/O. El resto del paquete son funciones
puras que reciben estos datos ya cargados, para poder probarse sin tocar el disco.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _cargar_json(nombre: str) -> list[dict[str, Any]]:
    ruta = DATA_DIR / nombre
    if not ruta.exists():
        return []

    contenido = ruta.read_text(encoding="utf-8").strip()
    if not contenido:
        return []

    try:
        datos = json.loads(contenido)
    except json.JSONDecodeError:
        return []

    return datos if isinstance(datos, list) else []


def cargar_laptops() -> list[dict[str, Any]]:
    return _cargar_json("laptops.json")


def cargar_actividades() -> dict[str, dict[str, Any]]:
    """Índice por ``clave`` para lookup O(1) desde el resto del motor."""
    return {a["clave"]: a for a in _cargar_json("actividades.json") if "clave" in a}


def cargar_software() -> dict[str, dict[str, Any]]:
    return {s["clave"]: s for s in _cargar_json("software.json") if "clave" in s}
