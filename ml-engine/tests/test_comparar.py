"""Operación ``afinidad``: ordenar las laptops del comparador según el cuestionario."""

import pytest

from recommender import comparar
from recommender.comparar import comparar_afinidad


def _laptop(id_, **cambios):
    base = {
        "id": id_,
        "marca": "Lenovo",
        "cpu_score": 60,
        "ram_gb": 16,
        "ram_ampliable_gb": 16,
        "almacenamiento_tipo": "SSD",
        "gpu_dedicada": False,
        "bateria_horas": 8,
        "pantalla_pulgadas": 15.6,
        "pantalla_resolucion": "1920x1080",
        "pantalla_hz": 60,
        "peso_kg": 1.6,
        "puertos": ["usb_a", "usb_c", "hdmi"],
        "precio_soles": 3000,
    }
    return {**base, **cambios}


@pytest.fixture
def catalogo(monkeypatch):
    laptops = [
        _laptop(1, peso_kg=2.4, bateria_horas=5, marca="Acer"),
        _laptop(2, peso_kg=1.2, bateria_horas=12, marca="Apple"),
        _laptop(3, peso_kg=1.7, bateria_horas=8, marca="HP"),
    ]
    monkeypatch.setattr(comparar, "cargar_laptops", lambda: laptops)
    return laptops


def test_ordena_por_afinidad_con_la_persona(catalogo):
    pref = {"movilidad": "diario", "lejos_enchufe": "muchas_horas"}

    r = comparar_afinidad({"preferencias": pref, "laptop_ids": [1, 2, 3]})

    assert r["version"] == "v0"
    assert [a["laptop_id"] for a in r["afinidades"]] == [2, 3, 1]
    mejor, peor = r["afinidades"][0], r["afinidades"][-1]
    assert mejor["afinidad_pct"] > peor["afinidad_pct"]
    # Dice por qué: los motivos y avisos salen de las mismas reglas que la recomendación con IA.
    assert any("Ligera" in f["criterio"] for f in mejor["factores"])
    assert peor["advertencias"]


def test_avisa_si_es_una_marca_que_prefiere_evitar(catalogo):
    r = comparar_afinidad(
        {"preferencias": {"movilidad": "diario", "marcas_evitar": ["Acer"]}, "laptop_ids": [1, 2]}
    )

    acer = next(a for a in r["afinidades"] if a["laptop_id"] == 1)
    assert "Es de una marca que prefieres evitar." in acer["advertencias"]


def test_sin_cuestionario_no_recomienda_nada(catalogo):
    sin_nada = {"preferencias": {}, "laptop_ids": [1, 2]}
    assert comparar_afinidad(sin_nada)["error"] == "sin_preferencias"
    # Respuestas que no generan ningún criterio (p. ej. solo listas vacías).
    vacias = {"preferencias": {"molestias": []}, "laptop_ids": [1, 2]}
    assert comparar_afinidad(vacias)["error"] == "sin_preferencias"


def test_necesita_al_menos_dos_laptops_del_catalogo(catalogo):
    r = comparar_afinidad({"preferencias": {"movilidad": "diario"}, "laptop_ids": [2, 99]})

    assert r["error"] == "sin_resultados"
