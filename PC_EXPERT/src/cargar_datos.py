import json
import os

# ================================================
# RUTAS CORRECTAS PARA LA CARPETA /data
# ================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_DATA = os.path.join(BASE_DIR, "data")     # <-- CORRECTO

# Archivos individuales
ARCHIVOS_COMPONENTES = [
    "componentes_cpu.json",
    "componentes_gpu.json",
    "componentes_ram.json",
    "componentes_mobo.json",
    "componentes_fuente.json",
    "componentes_case.json",
    "componentes_ssd.json"
]

ARCHIVO_LAPTOPS = os.path.join(RUTA_DATA, "laptops.json")
ARCHIVO_REGLAS = os.path.join(RUTA_DATA, "reglas_compatibilidad.json")
ARCHIVO_HISTORIAL = os.path.join(RUTA_DATA, "historial.json")
ARCHIVO_CONFIG = os.path.join(RUTA_DATA, "configuracion.json")


# ================================================
# CARGA DE JSON
# ================================================

def cargar_json(ruta):
    try:
        with open(ruta, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ ERROR: No se encontró el archivo: {ruta}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ ERROR al leer JSON en {ruta}: {e}")
        return None


def cargar_componentes():
    lista = []

    archivos = [
        "componentes_cpu.json",
        "componentes_gpu.json",
        "componentes_ram.json",
        "componentes_mobo.json",
        "componentes_fuente.json",
        "componentes_case.json",
        "componentes_ssd.json"
    ]

    for nombre in archivos:
        ruta = os.path.join(RUTA_DATA, nombre)
        datos = cargar_json(ruta)
        if datos:
            lista.extend(datos)

    return lista


def cargar_reglas():
    return cargar_json(ARCHIVO_REGLAS) or {}


def cargar_historial():
    return cargar_json(ARCHIVO_HISTORIAL) or {}


def cargar_laptops():
    return cargar_json(ARCHIVO_LAPTOPS) or []


def cargar_todos_los_datos():
    print("📦 Cargando datos de PC EXPERT...")

    return {
        "componentes": cargar_componentes(),
        "laptops": cargar_laptops(),
        "reglas": cargar_reglas(),
        "historial": cargar_historial(),
        "config": cargar_json(ARCHIVO_CONFIG) or {}
    }


# ================================================
# GUARDAR JSON
# ================================================

def guardar_historial(historial):
    try:
        with open(ARCHIVO_HISTORIAL, "w", encoding="utf-8") as f:
            json.dump(historial, f, indent=4, ensure_ascii=False)
        print("✔ Historial actualizado correctamente.")
    except Exception as e:
        print(f"❌ Error guardando historial: {e}")


def guardar_configuracion(config):
    try:
        with open(ARCHIVO_CONFIG, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        print("✔ Configuración guardada.")
    except Exception as e:
        print(f"❌ Error guardando configuración: {e}")
