"""La fachada HTTP (app.py) debe pasar a recomendar() lo mismo que el modo CLI.

Se prueba el modelo de entrada de FastAPI, que es el que filtra campos: si un campo del contrato
no está declarado ahí, se descarta en silencio y el modo HTTP se comporta distinto del CLI.
"""

from app import SolicitudRecomendacion


def test_el_modelo_http_conserva_las_preferencias():
    payload = {
        "perfil": {
            "carrera": "Ingeniería de Sistemas",
            "actividades": ["programacion_web"],
            "presupuesto_soles": 5000,
            "preferencias": {"movilidad": "diario", "prioridades": ["portabilidad", "precio"]},
        },
        "opciones": {"top_n": 3},
    }

    datos = SolicitudRecomendacion(**payload).model_dump()

    assert datos["perfil"]["preferencias"]["movilidad"] == "diario"
    assert datos["perfil"]["preferencias"]["prioridades"] == ["portabilidad", "precio"]


def test_sin_preferencias_el_campo_queda_vacio():
    datos = SolicitudRecomendacion(perfil={"actividades": ["programacion_web"]}).model_dump()

    assert datos["perfil"]["preferencias"] is None


def test_el_modelo_http_conserva_las_laptops_a_excluir():
    datos = SolicitudRecomendacion(
        perfil={"actividades": ["programacion_web"]}, opciones={"top_n": 3, "excluir_ids": [4, 7]}
    ).model_dump()

    assert datos["opciones"]["excluir_ids"] == [4, 7]
