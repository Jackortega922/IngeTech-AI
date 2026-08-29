# aprendizaje.py — Sistema de aprendizaje del usuario para PC EXPERT

import json
from datetime import datetime
from src.cargar_datos import guardar_historial



# --------------------------------------------------------
# ACTUALIZAR HISTORIAL COMPLETO
# --------------------------------------------------------

def registrar_configuracion(historial, configuracion):
    """
    Guarda una configuración completa armada por el usuario.
    """
    configuracion["fecha"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    historial.setdefault("historico_configuraciones", [])
    historial["historico_configuraciones"].append(configuracion)

    # Registrar presupuesto
    historial.setdefault("presupuestos_consultados", [])
    historial["presupuestos_consultados"].append(configuracion.get("precio_total", 0))

    guardar_historial(historial)


# --------------------------------------------------------
# APRENDER PREFERENCIAS DE MARCA
# --------------------------------------------------------

def registrar_preferencia_de_marca(historial, componente):
    """
    Aprende la marca preferida del usuario.
    """
    marca = componente.get("marca", "")
    if not marca:
        return

    historial.setdefault("marcas_preferidas", {})

    historial["marcas_preferidas"][marca] = historial["marcas_preferidas"].get(marca, 0) + 1

    guardar_historial(historial)


# --------------------------------------------------------
# REGISTRAR USO DE COMPONENTES
# --------------------------------------------------------

def registrar_componente_usado(historial, componente):
    """
    Incrementa el contador de cuánto usa el usuario cada componente.
    """
    nombre = componente.get("nombre", "")
    if not nombre:
        return

    historial.setdefault("componentes_mas_usados", {})

    historial["componentes_mas_usados"][nombre] = historial["componentes_mas_usados"].get(nombre, 0) + 1

    guardar_historial(historial)


# --------------------------------------------------------
# ANALIZAR TENDENCIAS DEL USUARIO
# --------------------------------------------------------

def obtener_preferencias(historial):
    """
    Devuelve un resumen de las preferencias del usuario.
    """

    marcas = historial.get("marcas_preferidas", {})
    componentes_usados = historial.get("componentes_mas_usados", {})

    tendencia_marca = None
    if marcas:
        tendencia_marca = max(marcas, key=marcas.get)

    componente_favorito = None
    if componentes_usados:
        componente_favorito = max(componentes_usados, key=componentes_usados.get)

    return {
        "marca_preferida": tendencia_marca,
        "componente_favorito": componente_favorito
    }


# --------------------------------------------------------
# MEJORAR RECOMENDACIONES SEGÚN APRENDIZAJE
# --------------------------------------------------------

def ajustar_recomendacion_por_preferencias(recomendacion, historial):
    """
    Ajusta la recomendación según los gustos aprendidos.
    Ejemplo:
    - Si prefiere Nvidia, trata de elegir Nvidia cuando el rendimiento sea similar.
    - Si prefiere AMD CPU, evita Intel de precio similar.
    """

    prefs = obtener_preferencias(historial)

    marca_pref = prefs.get("marca_preferida", "")

    if marca_pref:
        # Ajustar CPU
        if "cpu" in recomendacion and recomendacion["cpu"]["marca"] != marca_pref:
            recomendacion["nota_cpu"] = f"Sugerencia ajustada: prefieres {marca_pref}"

        # Ajustar GPU
        if "gpu" in recomendacion and recomendacion["gpu"]["marca"] != marca_pref:
            recomendacion["nota_gpu"] = f"Sugerencia ajustada: prefieres {marca_pref}"

    return recomendacion


# --------------------------------------------------------
# REGISTRAR ACCIONES DEL USUARIO (GUI)
# --------------------------------------------------------

def registrar_accion(historial, accion):
    """
    Registra acciones hechas en la interfaz:
    - "abrió recomendador"
    - "buscó gpu"
    - "seleccionó placa"
    """

    historial.setdefault("acciones_usuario", [])
    historial["acciones_usuario"].append({
        "accion": accion,
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

    guardar_historial(historial)


# --------------------------------------------------------
# REGISTRAR ÚLTIMO ACCESO
# --------------------------------------------------------

def actualizar_ultimo_acceso(historial):
    historial["ultimo_acceso"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    guardar_historial(historial)
