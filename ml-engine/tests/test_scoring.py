"""Pruebas del punto de entrada del motor. Hoy validan el MOCK y su contrato;
cuando llegue el scoring real (A8) se amplían con casos por perfil."""

from recommender.scoring import recomendar


def test_devuelve_forma_del_contrato():
    resp = recomendar(
        {
            "perfil": {"actividades": ["programacion_web"], "presupuesto_soles": 4000},
            "opciones": {"top_n": 2},
        }
    )
    assert resp["version"] == "v0"
    assert len(resp["recomendaciones"]) == 2
    rec = resp["recomendaciones"][0]
    assert 0 <= rec["compatibilidad_pct"] <= 100
    assert "factores" in rec["explicacion"]


def test_perfil_sin_actividades_es_invalido():
    resp = recomendar({"perfil": {"presupuesto_soles": 4000}})
    assert resp["error"] == "perfil_invalido"


def test_calcula_sobrante_con_presupuesto():
    resp = recomendar({"perfil": {"actividades": ["ia_ml"], "presupuesto_soles": 5000}})
    assert resp["recomendaciones"][0]["sobrante_soles"] == 5000 - 3499
