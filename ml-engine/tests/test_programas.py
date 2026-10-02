"""El motor recomienda a partir de los programas que usa la persona, no solo de sus actividades."""

from recommender.scoring import recomendar


def _payload(actividades, software):
    return {
        "perfil": {
            "carrera": "",
            "nivel_experiencia": "intermedio",
            "actividades": actividades,
            "software": software,
            "presupuesto_soles": 8000,
        },
        "opciones": {"top_n": 3},
    }


def test_sin_actividades_pero_con_programas_si_recomienda():
    respuesta = recomendar(_payload([], ["office"]))

    assert "error" not in respuesta
    assert len(respuesta["recomendaciones"]) == 3


def test_sin_actividades_ni_programas_es_perfil_invalido():
    respuesta = recomendar(_payload([], []))

    assert respuesta["error"] == "perfil_invalido"


def test_un_programa_exigente_cambia_la_recomendacion():
    # Mismo perfil; solo cambia el programa. AutoCAD pide GPU dedicada, Office no.
    con_office = recomendar(_payload([], ["office"]))
    con_autocad = recomendar(_payload([], ["autocad"]))

    ids_office = [r["laptop_id"] for r in con_office["recomendaciones"]]
    ids_autocad = [r["laptop_id"] for r in con_autocad["recomendaciones"]]

    assert ids_office != ids_autocad
    # La primera opción para AutoCAD tiene GPU dedicada: no aparece la advertencia de "sin GPU".
    assert not any(
        "GPU" in a for a in con_autocad["recomendaciones"][0]["explicacion"]["advertencias"]
    )


def test_office_recibe_laptops_de_oficina_y_autocad_laptops_con_gpu():
    # Antes del arreglo, sin actividades el clasificador ponía a todos como "científico de datos"
    # y a quien solo usa Office le recomendaba laptops gamer, igual que a quien usa AutoCAD.
    from recommender.catalogo import cargar_laptops

    gpu = {lap["id"]: lap["gpu_dedicada"] for lap in cargar_laptops()}
    con_office = recomendar(_payload([], ["office"]))
    con_autocad = recomendar(_payload([], ["autocad"]))

    assert not any(gpu[r["laptop_id"]] for r in con_office["recomendaciones"])
    assert all(gpu[r["laptop_id"]] for r in con_autocad["recomendaciones"])
