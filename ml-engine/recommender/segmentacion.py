"""Segmentación de clientes con K-Means (Marketing).

Agrupa a los clientes por cómo se comportan en la tienda — cuánto dicen que pueden gastar,
cuántas recomendaciones pidieron, cuántas compras hicieron, cuánto gastaron y hace cuánto no
vuelven — para que Marketing le hable distinto a cada grupo.

Técnica: aprendizaje **no supervisado**. A diferencia del perfilado (que aprende de ejemplos
etiquetados), aquí nadie dice de antemano qué grupos existen: K-Means los descubre buscando
clientes parecidos entre sí. El número de grupos (k) se elige probando k = 2..5 y quedándose con
el de mejor **coeficiente de silueta** (qué tan separados y compactos quedan los grupos, de -1 a 1).

Recibe solo números por cliente, sin nombre ni correo (Ley 29733: minimización de datos).
Función pura, sin I/O, igual que ``scoring.recomendar``. Contrato en
docs/arquitectura/contrato-motor.md ("Operación: segmentar").
"""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

VERSION = "v0"

VARIABLES = ("presupuesto_soles", "recomendaciones", "pedidos", "gasto_soles", "dias_inactivo")

# Con menos clientes que esto, los grupos no significan nada (hasta 5 grupos de al menos 2).
MINIMO_CLIENTES = 6
K_MAXIMO = 5
SEMILLA = 42

ACCIONES = {
    "alto_valor": "Fidelizar: acceso anticipado a novedades y accesorios premium.",
    "compradores": "Venta cruzada: kits y accesorios para la laptop que ya compraron.",
    "interesados": "Cupón de primera compra: consultan varias veces pero aún no se deciden.",
    "exploradores": "Recordarles el comparador y la guía para decidir, sin presionar.",
    "inactivos": "Campaña de reactivación con las novedades del catálogo.",
}

NOMBRES = {
    "alto_valor": "Clientes de alto valor",
    "compradores": "Compradores",
    "interesados": "Interesados que aún no compran",
    "exploradores": "Exploradores",
    "inactivos": "Inactivos",
}


def _error(codigo: str, mensaje: str) -> dict[str, Any]:
    return {"version": VERSION, "error": codigo, "mensaje": mensaje}


def _matriz(clientes: list[dict[str, Any]]) -> np.ndarray:
    filas = [[float(c.get(v) or 0) for v in VARIABLES] for c in clientes]
    x = np.array(filas)
    # Dinero en escala logarítmica: la diferencia entre S/ 0 y S/ 2 000 importa más que entre
    # S/ 8 000 y S/ 10 000. Sin esto, un solo cliente que gastó mucho arma su propio grupo.
    for i, v in enumerate(VARIABLES):
        if v.endswith("_soles"):
            x[:, i] = np.log1p(np.maximum(x[:, i], 0))
    return x


def _tipo(centro: dict[str, float], gasto_alto: float) -> str:
    """Nombre del grupo a partir de su cliente promedio (reglas legibles, no IA)."""
    if centro["pedidos"] >= 0.5:
        return "alto_valor" if centro["gasto_soles"] >= gasto_alto else "compradores"
    if centro["dias_inactivo"] > 60:
        return "inactivos"
    if centro["recomendaciones"] >= 2:
        return "interesados"
    return "exploradores"


def _nivel(valor: float, bajo: float, alto: float) -> str:
    return "alto" if valor >= alto else "bajo" if valor <= bajo else "medio"


def segmentar(payload: dict[str, Any]) -> dict[str, Any]:
    """Recibe ``{"clientes": [{"id": 1, "presupuesto_soles": ..., ...}]}``."""
    clientes = [c for c in (payload.get("clientes") or []) if c.get("id") is not None]
    if len(clientes) < MINIMO_CLIENTES:
        return _error(
            "datos_insuficientes",
            f"Se necesitan al menos {MINIMO_CLIENTES} clientes con actividad para segmentar.",
        )

    crudo = np.array([[float(c.get(v) or 0) for v in VARIABLES] for c in clientes])
    x = StandardScaler().fit_transform(_matriz(clientes))
    distintos = len(np.unique(x.round(6), axis=0))
    if distintos < 2:
        return _error(
            "datos_insuficientes",
            "Todos los clientes se comportan igual: no hay grupos que separar.",
        )

    # Probar varios k y quedarse con el de mejor silueta. No más grupos que clientes distintos.
    mejor = None
    for k in range(2, min(K_MAXIMO, len(clientes) - 1, distintos) + 1):
        modelo = KMeans(n_clusters=k, n_init=10, random_state=SEMILLA).fit(x)
        if len(set(modelo.labels_)) < 2:
            continue
        silueta = float(silhouette_score(x, modelo.labels_))
        if mejor is None or silueta > mejor[0]:
            mejor = (silueta, k, modelo.labels_)
    if mejor is None:
        return _error(
            "datos_insuficientes", "No se encontraron grupos distintos entre los clientes."
        )
    silueta, k, etiquetas = mejor

    compraron = crudo[:, VARIABLES.index("pedidos")] > 0
    gastos = crudo[compraron, VARIABLES.index("gasto_soles")]
    gasto_alto = float(np.percentile(gastos, 75)) if len(gastos) else float("inf")
    presupuestos = crudo[:, VARIABLES.index("presupuesto_soles")]
    p_bajo, p_alto = (float(np.percentile(presupuestos, q)) for q in (33, 67))

    segmentos = []
    for grupo in range(k):
        miembros = etiquetas == grupo
        centro = {v: float(crudo[miembros, i].mean()) for i, v in enumerate(VARIABLES)}
        tipo = _tipo(centro, gasto_alto)
        segmentos.append(
            {
                "tipo": tipo,
                "nombre": f"{NOMBRES[tipo]} · presupuesto "
                f"{_nivel(centro['presupuesto_soles'], p_bajo, p_alto)}",
                "accion": ACCIONES[tipo],
                "tamano": int(miembros.sum()),
                "clientes": [clientes[i]["id"] for i in np.flatnonzero(miembros)],
                "promedio": {v: round(val, 1) for v, val in centro.items()},
            }
        )

    segmentos.sort(key=lambda s: s["tamano"], reverse=True)
    return {"version": VERSION, "k": k, "silueta": round(silueta, 3), "segmentos": segmentos}
