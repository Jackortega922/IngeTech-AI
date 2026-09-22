"""Pruebas de la traducción de actividades a especificaciones ideales y la similitud
coseno contra el catálogo (funciones puras, sin depender de archivos ni del clasificador)."""

from recommender.similitud import (
    calcular_compatibilidad,
    combinar_vectores,
    vector_ideal_por_actividades,
)

ACTIVIDADES_IDX = {
    "ia_ml": {"clave": "ia_ml", "peso_ram": 2, "peso_cpu": 2, "peso_gpu": 3},
    "ofimatica": {"clave": "ofimatica", "peso_ram": 1, "peso_cpu": 1, "peso_gpu": 0},
}

LAPTOP_CON_GPU = {
    "id": 1, "ram_gb": 16, "cpu_score": 5000, "gpu_dedicada": True, "precio_soles": 4000,
}
LAPTOP_SIN_GPU = {
    "id": 2, "ram_gb": 16, "cpu_score": 5000, "gpu_dedicada": False, "precio_soles": 4000,
}


def test_vector_ideal_normaliza_pesos_a_0_1():
    ideal = vector_ideal_por_actividades(["ia_ml"], ACTIVIDADES_IDX)
    assert ideal["gpu"] == 1.0
    assert 0 < ideal["ram"] <= 1
    assert 0 < ideal["cpu"] <= 1


def test_actividad_no_reconocida_no_rompe():
    ideal = vector_ideal_por_actividades(["actividad_inexistente"], ACTIVIDADES_IDX)
    assert ideal == {"ram": 0.0, "cpu": 0.0, "gpu": 0.0}


def test_combinar_vectores_promedia():
    a = {"ram": 1.0, "cpu": 0.0, "gpu": 0.0}
    b = {"ram": 0.0, "cpu": 1.0, "gpu": 0.0}
    assert combinar_vectores(a, b) == {"ram": 0.5, "cpu": 0.5, "gpu": 0.0}


def test_laptop_con_gpu_puntua_mas_alto_para_perfil_que_necesita_gpu():
    ideal = vector_ideal_por_actividades(["ia_ml"], ACTIVIDADES_IDX)
    resultados = calcular_compatibilidad(ideal, [LAPTOP_CON_GPU, LAPTOP_SIN_GPU])
    por_id = {r["laptop"]["id"]: r["compatibilidad_pct"] for r in resultados}
    assert por_id[1] > por_id[2]


def test_advertencia_cuando_falta_gpu_necesaria():
    ideal = vector_ideal_por_actividades(["ia_ml"], ACTIVIDADES_IDX)
    resultados = calcular_compatibilidad(ideal, [LAPTOP_SIN_GPU])
    assert any("GPU" in a for a in resultados[0]["advertencias"])


def test_calcular_compatibilidad_con_catalogo_vacio():
    ideal = vector_ideal_por_actividades(["ia_ml"], ACTIVIDADES_IDX)
    assert calcular_compatibilidad(ideal, []) == []
