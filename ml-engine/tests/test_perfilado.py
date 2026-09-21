"""Pruebas de la featurización y clasificación supervisada del perfil (A8)."""

from recommender.perfilado import VECTOR_BASE_POR_CATEGORIA, clasificar_perfil, featurizar

ACTIVIDADES_IDX = {
    "ia_ml": {"clave": "ia_ml", "peso_ram": 2, "peso_cpu": 2, "peso_gpu": 3},
}


def test_featurizar_calcula_pesos_nivel_y_conteos():
    perfil = {"actividades": ["ia_ml"], "software": ["jupyter"], "nivel_experiencia": "avanzado"}
    # [peso_ram, peso_cpu, peso_gpu, nivel_ordinal, n_actividades, n_software]
    assert featurizar(perfil, ACTIVIDADES_IDX) == [2, 2, 3, 2, 1, 1]


def test_featurizar_con_nivel_desconocido_usa_basico():
    perfil = {"actividades": [], "software": [], "nivel_experiencia": "algo_raro"}
    assert featurizar(perfil, ACTIVIDADES_IDX)[3] == 0


def test_clasificar_perfil_devuelve_una_categoria_conocida():
    perfil = {"actividades": ["ia_ml"], "software": [], "nivel_experiencia": "avanzado"}
    categoria = clasificar_perfil(perfil, ACTIVIDADES_IDX)
    assert categoria in VECTOR_BASE_POR_CATEGORIA
