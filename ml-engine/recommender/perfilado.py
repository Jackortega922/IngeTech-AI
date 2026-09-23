"""Clasificación supervisada del perfil del usuario en una categoría técnica.

El modelo (``LogisticRegression`` de scikit-learn) se entrena offline con
``entrenamiento/entrenar_perfilado.py`` y se serializa en ``modelo_perfilado.joblib``
(commiteado al repo). Este módulo solo carga ese artefacto una vez por proceso y expone
``clasificar_perfil()``. Ver ``docs/contexto-proyecto.md`` §7-8 para el diseño completo y
"Cuándo reentrenar" para el criterio de actualización del modelo.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib

NIVEL_ORDINAL = {"basico": 0, "intermedio": 1, "avanzado": 2}

MODELO_PATH = Path(__file__).resolve().parent / "modelo_perfilado.joblib"

# Vector base de especificaciones ideales por categoría técnica (0-1 por factor). Se combina
# con el vector derivado de las actividades declaradas (ver similitud.combinar_vectores).
VECTOR_BASE_POR_CATEGORIA: dict[str, dict[str, float]] = {
    "desarrollador_software": {"ram": 0.6, "cpu": 0.7, "gpu": 0.1},
    "cientifico_datos_ia": {"ram": 0.9, "cpu": 0.8, "gpu": 0.8},
    "disenador_creativo": {"ram": 0.7, "cpu": 0.6, "gpu": 0.9},
    "estudiante_general": {"ram": 0.3, "cpu": 0.3, "gpu": 0.0},
}


def featurizar(perfil: dict[str, Any], actividades_idx: dict[str, dict[str, Any]]) -> list[float]:
    """Convierte un perfil en el vector numérico que espera el clasificador.

    La usan tanto el entrenamiento (``entrenar_perfilado.py``) como la inferencia, para que
    ambos lados calculen las features exactamente de la misma forma.
    """
    actividades = perfil.get("actividades", [])
    software = perfil.get("software", [])

    peso_ram = peso_cpu = peso_gpu = 0
    for clave in actividades:
        actividad = actividades_idx.get(clave, {})
        peso_ram += actividad.get("peso_ram", 0)
        peso_cpu += actividad.get("peso_cpu", 0)
        peso_gpu += actividad.get("peso_gpu", 0)

    nivel = NIVEL_ORDINAL.get(perfil.get("nivel_experiencia", "basico"), 0)

    return [peso_ram, peso_cpu, peso_gpu, nivel, len(actividades), len(software)]


_modelo = None


def _obtener_modelo():
    global _modelo
    if _modelo is None:
        _modelo = joblib.load(MODELO_PATH)
    return _modelo


def clasificar_perfil(perfil: dict[str, Any], actividades_idx: dict[str, dict[str, Any]]) -> str:
    modelo = _obtener_modelo()
    x = [featurizar(perfil, actividades_idx)]
    return str(modelo.predict(x)[0])
