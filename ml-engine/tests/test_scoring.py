"""Pruebas del punto de entrada del motor (A8: scoring real, ya sin el mock)."""

from recommender.scoring import recomendar

PERFIL_DESARROLLADOR = {
    "carrera": "Ingeniería de Sistemas",
    "nivel_experiencia": "intermedio",
    "actividades": ["programacion_web", "maquinas_virtuales"],
    "software": ["vscode", "docker"],
    "presupuesto_soles": 4000,
}


def test_devuelve_forma_del_contrato():
    resp = recomendar({"perfil": PERFIL_DESARROLLADOR, "opciones": {"top_n": 2}})
    assert resp["version"] == "v0"
    assert len(resp["recomendaciones"]) == 2
    rec = resp["recomendaciones"][0]
    assert 0 <= rec["compatibilidad_pct"] <= 100
    assert "factores" in rec["explicacion"]
    assert "advertencias" in rec["explicacion"]


def test_recomendaciones_ordenadas_de_mayor_a_menor_compatibilidad():
    resp = recomendar({"perfil": PERFIL_DESARROLLADOR, "opciones": {"top_n": 5}})
    porcentajes = [r["compatibilidad_pct"] for r in resp["recomendaciones"]]
    assert porcentajes == sorted(porcentajes, reverse=True)


def test_top_n_ya_no_esta_topeado_a_3():
    # Presupuesto alto para asegurar que las 8 laptops semilla califiquen como candidatas.
    perfil = {**PERFIL_DESARROLLADOR, "presupuesto_soles": 6500}
    resp = recomendar({"perfil": perfil, "opciones": {"top_n": 6}})
    assert len(resp["recomendaciones"]) == 6


def test_perfil_sin_actividades_es_invalido():
    resp = recomendar({"perfil": {"presupuesto_soles": 4000}})
    assert resp["error"] == "perfil_invalido"


def test_perfil_sin_presupuesto_es_invalido():
    resp = recomendar({"perfil": {"actividades": ["ia_ml"]}})
    assert resp["error"] == "perfil_invalido"


def test_sin_resultados_si_el_presupuesto_es_muy_bajo():
    perfil = {**PERFIL_DESARROLLADOR, "presupuesto_soles": 100}
    resp = recomendar({"perfil": perfil})
    assert resp["error"] == "sin_resultados"


def test_sobrante_se_calcula_contra_el_precio_real_de_la_laptop():
    resp = recomendar({"perfil": PERFIL_DESARROLLADOR, "opciones": {"top_n": 1}})
    rec = resp["recomendaciones"][0]
    assert rec["sobrante_soles"] == round(4000 - rec["precio_soles"], 2)
