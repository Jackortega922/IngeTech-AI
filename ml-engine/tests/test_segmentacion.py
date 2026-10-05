"""Segmentación de clientes con K-Means (Marketing)."""

from recommender.segmentacion import MINIMO_CLIENTES, segmentar


def _cliente(i, presupuesto, recs, pedidos, gasto, dias):
    return {
        "id": i,
        "presupuesto_soles": presupuesto,
        "recomendaciones": recs,
        "pedidos": pedidos,
        "gasto_soles": gasto,
        "dias_inactivo": dias,
    }


# Tres comportamientos bien distintos, 4 clientes cada uno.
CLIENTES = (
    [_cliente(i, 6000, 3, 2, 9000, 5) for i in range(1, 5)]  # compran caro y seguido
    + [_cliente(i, 2500, 4, 0, 0, 10) for i in range(5, 9)]  # consultan mucho, no compran
    + [_cliente(i, 1800, 1, 0, 0, 120) for i in range(9, 13)]  # vinieron una vez y no volvieron
)


def test_encuentra_los_grupos_y_los_nombra():
    resp = segmentar({"clientes": CLIENTES})

    assert resp["k"] == 3
    assert resp["silueta"] > 0.5
    por_tipo = {s["tipo"]: s for s in resp["segmentos"]}
    assert set(por_tipo) == {"alto_valor", "interesados", "inactivos"}
    assert por_tipo["alto_valor"]["clientes"] == [1, 2, 3, 4]
    assert por_tipo["inactivos"]["clientes"] == [9, 10, 11, 12]
    assert por_tipo["alto_valor"]["nombre"].endswith("presupuesto alto")
    assert por_tipo["interesados"]["accion"].startswith("Cupón")


def test_cada_cliente_queda_en_un_solo_grupo():
    resp = segmentar({"clientes": CLIENTES})
    ids = [i for s in resp["segmentos"] for i in s["clientes"]]
    assert sorted(ids) == list(range(1, 13))


def test_es_reproducible():
    assert segmentar({"clientes": CLIENTES}) == segmentar({"clientes": CLIENTES})


def test_pocos_clientes_no_se_segmentan():
    resp = segmentar({"clientes": CLIENTES[: MINIMO_CLIENTES - 1]})
    assert resp["error"] == "datos_insuficientes"


def test_clientes_identicos_no_forman_grupos():
    resp = segmentar({"clientes": [_cliente(i, 2000, 1, 0, 0, 3) for i in range(10)]})
    assert resp["error"] == "datos_insuficientes"
