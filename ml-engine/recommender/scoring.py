"""Punto de entrada de la lógica de recomendación.

⚠️  IMPLEMENTACIÓN MOCK. Devuelve una respuesta fija con la forma del contrato
(``docs/arquitectura/contrato-motor.md``) para desbloquear al Módulo B mientras el motor real
se construye (tareas A7–A9). Reemplazar ``recomendar`` por el scoring real, manteniendo la firma.
"""

from typing import Any

CONTRATO_VERSION = "v0"


def recomendar(payload: dict[str, Any]) -> dict[str, Any]:
    """Recibe ``{"perfil": {...}, "opciones": {...}}`` y devuelve la respuesta del contrato."""
    perfil = payload.get("perfil") or {}
    presupuesto = perfil.get("presupuesto_soles")

    if not perfil.get("actividades"):
        return {
            "version": CONTRATO_VERSION,
            "error": "perfil_invalido",
            "mensaje": "El perfil no incluye actividades.",
        }

    top_n = (payload.get("opciones") or {}).get("top_n", 3)

    # --- MOCK: recomendación de ejemplo ---
    ejemplo = {
        "laptop_id": 1,
        "compatibilidad_pct": 84,
        "precio_soles": 3499,
        "sobrante_soles": (presupuesto - 3499) if isinstance(presupuesto, (int, float)) else None,
        "explicacion": {
            "factores": [
                {"criterio": "RAM ampliable para máquinas virtuales", "aporte": 24},
                {"criterio": "Procesador suficiente para desarrollo", "aporte": 22},
                {"criterio": "Dentro del presupuesto", "aporte": 18},
            ],
            "advertencias": ["Respuesta de ejemplo: el motor real todavía no está conectado."],
        },
    }

    return {
        "version": CONTRATO_VERSION,
        "recomendaciones": [ejemplo] * max(1, min(top_n, 3)),
    }
