# busqueda.py — Módulo de búsqueda avanzada para PC EXPERT

# ==========================================================
# IMPORTS ABSOLUTOS (Opción 1)
# ==========================================================

from src.utils import (
    normalizar,
    filtrar_por_categoria,
    ordenar_por_precio,
    ordenar_por_rendimiento,
)



# --------------------------------------
# BÚSQUEDA GENERAL (TEXTO LIBRE)
# --------------------------------------

def buscar_general(componentes, texto):
    """
    Búsqueda inteligente:
    - Coincidencia en nombre
    - Coincidencia en categoría
    - Coincidencia parcial
    - Texto normalizado
    """
    texto = normalizar(texto)

    resultados = []

    for c in componentes:
        nombre = normalizar(c.get("nombre", ""))
        categoria = normalizar(c.get("categoria", ""))

        # Coincidencia parcial
        if texto in nombre or texto in categoria:
            resultados.append(c)

    return resultados


# --------------------------------------
# BUSCAR POR CATEGORÍA
# --------------------------------------

def buscar_categoria(componentes, categoria):
    """
    Busca categorías aunque no coincidan exactamente.
    Permite:
    - Mayúsculas/minúsculas
    - Espacios
    - Diferencias como "Placa Madre", "motherboard", "Mainboard"
    - Evita listas vacías en RAM, GPU, CASE, etc.
    """

    categoria = categoria.strip().lower()

    def norm(txt):
        return txt.strip().lower()

    resultados = []

    for c in componentes:
        cat = norm(c.get("categoria", ""))

        # Coincidencia flexible
        if categoria in cat or cat in categoria:
            resultados.append(c)

    return resultados


# --------------------------------------
# BUSCAR POR RANGO DE PRECIOS
# --------------------------------------

def buscar_por_precio(componentes, minimo=0, maximo=99999):
    """
    Busca componentes dentro de un rango de precios.
    """
    return [
        c for c in componentes
        if minimo <= c.get("precio", 0) <= maximo
    ]


# --------------------------------------
# FILTRAR POR MARCA
# --------------------------------------

def buscar_por_marca(componentes, marca):
    """
    Busca componentes por marca:
    Nvidia, AMD, Intel, Kingston, Crucial, Asus, MSI, etc.
    """
    marca = normalizar(marca)
    return [c for c in componentes if marca in normalizar(c.get("marca", ""))]


# --------------------------------------
# BUSCAR POR RENDIMIENTO
# --------------------------------------

def mejores_por_rendimiento(componentes, top=10):
    """
    Retorna los mejores componentes por rendimiento.
    """
    ordenados = ordenar_por_rendimiento(componentes, asc=False)
    return ordenados[:top]


def peores_por_rendimiento(componentes, cantidad=10):
    """
    Devuelve los componentes más débiles en rendimiento.
    """
    ordenados = ordenar_por_rendimiento(componentes, asc=True)
    return ordenados[:cantidad]


# --------------------------------------
# BUSCAR GPU PARA PRESUPUESTO
# --------------------------------------

def buscar_gpu_para_presupuesto(componentes, presupuesto):
    """
    Devuelve las GPUs más adecuadas según el presupuesto.
    Busca GPUs dentro del 25%-60% del presupuesto total.
    """
    minimo = int(presupuesto * 0.25)
    maximo = int(presupuesto * 0.60)

    gpus = buscar_categoria(componentes, "gpu")
    gpus_filtradas = buscar_por_precio(gpus, minimo, maximo)

    return ordenar_por_rendimiento(gpus_filtradas, asc=False)


# --------------------------------------
# BUSCAR CPU COMPATIBLE PARA UNA GPU
# --------------------------------------

def buscar_cpu_para_gpu(componentes, gpu_objetivo):
    """
    Busca CPUs que no generen cuello de botella con la GPU.
    Usa nivel_cpu >= nivel_gpu
    """
    if not gpu_objetivo:
        return []

    nivel_gpu = gpu_objetivo.get("nivel_gpu", 1)

    cpus = buscar_categoria(componentes, "cpu")

    compatibles = [
        c for c in cpus
        if c.get("nivel_cpu", 0) >= nivel_gpu
    ]

    return ordenar_por_rendimiento(compatibles, asc=False)


# --------------------------------------
# BÚSQUEDA EXACTA POR NOMBRE
# --------------------------------------

def buscar_nombre_exactamente(componentes, nombre):
    nombre = normalizar(nombre)
    for c in componentes:
        if normalizar(c.get("nombre", "")) == nombre:
            return c
    return None


# --------------------------------------
# BÚSQUEDA AVANZADA COMBINADA
# --------------------------------------

def buscar_avanzado(componentes, texto="", categoria=None, min_precio=None, max_precio=None, marca=None):
    """
    Búsqueda avanzada que combina:
    - texto libre
    - categoría
    - rango de precio
    - marca
    - ordenamiento dinámico
    """

    resultados = componentes

    if texto:
        resultados = buscar_general(resultados, texto)

    if categoria:
        resultados = buscar_categoria(resultados, categoria)

    if marca:
        resultados = buscar_por_marca(resultados, marca)

    if min_precio is not None or max_precio is not None:
        resultados = buscar_por_precio(
            resultados,
            min_precio or 0,
            max_precio or 99999
        )

    return resultados
