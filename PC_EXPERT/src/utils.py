# utils.py — Funciones auxiliares para PC EXPERT

import unicodedata


# ======================================================
# NORMALIZACIÓN DE TEXTO
# ======================================================

def normalizar(texto: str) -> str:
    """
    Convierte una cadena a minúsculas, sin acentos y sin espacios duplicados.
    Funciona incluso con valores None o datos no-string.
    """
    if not isinstance(texto, str):
        return ""

    texto = texto.lower().strip()

    # Eliminar acentos
    texto = unicodedata.normalize("NFD", texto)
    texto = texto.encode("ascii", "ignore").decode("utf-8")

    # Quitar espacios duplicados
    texto = " ".join(texto.split())

    return texto


# ======================================================
# FILTRADO Y ORDENAMIENTO
# ======================================================

def filtrar_por_categoria(componentes, categoria):
    categoria = normalizar(categoria)
    return [c for c in componentes if normalizar(c.get("categoria", "")) == categoria]


def ordenar_por_precio(componentes, asc=True):
    return sorted(componentes, key=lambda x: x.get("precio", 0), reverse=not asc)


def ordenar_por_rendimiento(componentes, asc=False):
    return sorted(componentes, key=lambda x: x.get("rendimiento", 0), reverse=not asc)


# ======================================================
# BÚSQUEDAS
# ======================================================

def buscar_por_nombre(componentes, texto):
    texto = normalizar(texto)
    return [c for c in componentes if texto in normalizar(c.get("nombre", ""))]


def buscar_componente_exactamente(componentes, nombre):
    nombre = normalizar(nombre)
    for c in componentes:
        if normalizar(c.get("nombre", "")) == nombre:
            return c
    return None


# ======================================================
# VALIDACIÓN
# ======================================================

def validar_componente(componente, campos_obligatorios):
    """
    Verifica que un componente tenga ciertos campos obligatorios.
    """
    for campo in campos_obligatorios:
        if campo not in componente:
            return False
    return True


# ======================================================
# FORMATEO
# ======================================================

def formatear_precio(valor):
    """
    Convierte un número en formato 'S/ xxx.xx'
    """
    try:
        precio = float(valor)
        return f"S/ {precio:,.2f}"
    except:
        return "S/ 0.00"


def formatear_rendimiento(valor):
    try:
        return f"{int(valor)} pts"
    except:
        return "0 pts"


# ======================================================
# AGRUPAR COMPONENTES
# ======================================================

def agrupar_por_categoria(componentes):
    """
    Devuelve un diccionario con cada categoría mapeada a su lista.
    """
    grupos = {}
    for c in componentes:
        cat = c.get("categoria", "desconocido").lower()
        if cat not in grupos:
            grupos[cat] = []
        grupos[cat].append(c)
    return grupos


# ======================================================
# OTROS
# ======================================================

def convertir_a_int(valor):
    """
    Convierte un string o float a int sin romper el programa.
    """
    try:
        return int(float(valor))
    except:
        return 0


def rango_precios(componentes):
    """
    Devuelve (precio_min, precio_max)
    """
    if not componentes:
        return (0, 0)
    precios = [c.get("precio", 0) for c in componentes]
    return (min(precios), max(precios))
