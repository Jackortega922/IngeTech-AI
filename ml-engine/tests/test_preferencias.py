"""Preferencias del cuestionario de bienvenida (Psicología) aplicadas al ranking."""

from recommender.preferencias import afinidad, filtrar_marcas
from recommender.scoring import recomendar


def _laptop(**cambios):
    base = {
        "id": 1,
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


RANGO = (1500.0, 6000.0)


def test_sin_respuestas_no_hay_afinidad():
    assert afinidad(_laptop(), {}, RANGO) is None
    assert afinidad(_laptop(), {"molestias": [], "perifericos": []}, RANGO) is None


def test_si_la_lleva_a_diario_prefiere_la_ligera():
    pref = {"movilidad": "diario"}
    ligera = afinidad(_laptop(peso_kg=1.2), pref, RANGO)
    pesada = afinidad(_laptop(peso_kg=2.5), pref, RANGO)

    assert ligera["valor"] > pesada["valor"]
    assert any("Ligera" in f["criterio"] for f in ligera["factores"])
    assert any("Pesa 2.5 kg" in a for a in pesada["advertencias"])


def test_si_se_le_congela_la_actual_avisa_con_8_gb():
    pref = {"molestias": ["se_congela"]}
    con_8 = afinidad(_laptop(ram_gb=8), pref, RANGO)
    con_16 = afinidad(_laptop(ram_gb=16), pref, RANGO)

    assert any("congelarse" in a for a in con_8["advertencias"])
    assert con_16["advertencias"] == []


def test_si_conecta_un_proyector_avisa_cuando_no_hay_hdmi():
    pref = {"perifericos": ["proyector"]}
    sin_hdmi = afinidad(_laptop(puertos=["usb_c_carga", "thunderbolt"]), pref, RANGO)

    # Con Thunderbolt se conecta con un adaptador sencillo: puntaje 0.6, sin advertencia.
    assert sin_hdmi["advertencias"] == []
    sin_nada = afinidad(_laptop(puertos=["usb_a"]), pref, RANGO)
    assert any("adaptador" in a for a in sin_nada["advertencias"])


def test_la_prioridad_elegida_primero_pesa_mas():
    barata_lenta = _laptop(precio_soles=1800, cpu_score=40)
    cara_rapida = _laptop(precio_soles=5500, cpu_score=90)

    por_precio = {"prioridades": ["precio", "rendimiento"]}
    por_rendimiento = {"prioridades": ["rendimiento", "precio"]}

    assert (
        afinidad(barata_lenta, por_precio, RANGO)["valor"]
        > afinidad(cara_rapida, por_precio, RANGO)["valor"]
    )
    assert (
        afinidad(cara_rapida, por_rendimiento, RANGO)["valor"]
        > afinidad(barata_lenta, por_rendimiento, RANGO)["valor"]
    )


def test_quita_marcas_a_evitar_salvo_que_no_queden_opciones():
    laptops = [
        _laptop(id=1, marca="Acer"),
        _laptop(id=2, marca="HP"),
        _laptop(id=3, marca="Lenovo"),
    ]
    pref = {"marcas_evitar": ["Acer"]}

    assert [lap["id"] for lap in filtrar_marcas(laptops, pref, minimo=2)] == [2, 3]
    # Si quitándola quedan menos de las que se piden, se conserva (con advertencia).
    assert len(filtrar_marcas(laptops, pref, minimo=3)) == 3


def _payload(preferencias=None):
    perfil = {
        "carrera": "Ingeniería de Sistemas",
        "nivel_experiencia": "intermedio",
        "actividades": ["programacion_web"],
        "software": ["vscode"],
        "presupuesto_soles": 8000,
    }
    if preferencias is not None:
        perfil["preferencias"] = preferencias
    return {"perfil": perfil, "opciones": {"top_n": 3}}


def test_con_el_catalogo_real_las_preferencias_cambian_el_ranking():
    sin = recomendar(_payload())
    con = recomendar(
        _payload(
            {
                "movilidad": "diario",
                "lejos_enchufe": "muchas_horas",
                "prioridades": ["portabilidad", "precio"],
            }
        )
    )

    # Sin cuestionario, el contrato queda igual que antes (sin campos nuevos).
    assert "afinidad_pct" not in sin["recomendaciones"][0]

    ids_sin = [r["laptop_id"] for r in sin["recomendaciones"]]
    ids_con = [r["laptop_id"] for r in con["recomendaciones"]]
    assert ids_sin != ids_con

    primera = con["recomendaciones"][0]
    assert {"compatibilidad_tecnica_pct", "afinidad_pct"} <= primera.keys()
    # 70% técnica + 30% afinidad.
    esperado = round(0.7 * primera["compatibilidad_tecnica_pct"] + 0.3 * primera["afinidad_pct"])
    assert abs(primera["compatibilidad_pct"] - esperado) <= 1
    assert any(
        "Ligera" in f["criterio"] or "Batería" in f["criterio"]
        for f in primera["explicacion"]["factores"]
    )
