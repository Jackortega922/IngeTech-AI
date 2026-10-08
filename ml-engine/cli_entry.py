"""Motor de recomendación — modo subproceso (producción).

Laravel lo ejecuta así:

    echo '{"perfil": {...}, "opciones": {...}}' | python cli_entry.py

Lee un JSON por stdin y escribe el JSON de respuesta por stdout.
Código de salida 0 salvo error interno.

Con ``"operacion"`` en el JSON hace otra cosa en vez de una recomendación:

- ``"segmentar"``: segmentación de clientes (Marketing),
  ``{"operacion": "segmentar", "clientes": [...]}``
- ``"afinidad"``: ordena las laptops del comparador según el cuestionario,
  ``{"operacion": "afinidad", "preferencias": {...}, "laptop_ids": [...]}``
"""

import json
import sys

from recommender.comparar import comparar_afinidad
from recommender.scoring import recomendar
from recommender.segmentacion import segmentar

OPERACIONES = {"segmentar": segmentar, "afinidad": comparar_afinidad}


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as exc:
        json.dump(
            {"version": "v0", "error": "perfil_invalido", "mensaje": f"JSON inválido: {exc}"},
            sys.stdout,
        )
        return 0

    try:
        operacion = OPERACIONES.get(payload.get("operacion"), recomendar)
        resultado = operacion(payload)
    except Exception as exc:  # noqa: BLE001 - la frontera CLI reporta cualquier fallo como JSON
        json.dump(
            {"version": "v0", "error": "error_interno", "mensaje": str(exc)},
            sys.stdout,
        )
        return 1

    json.dump(resultado, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
