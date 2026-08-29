import json
import os

def cargar_todos_los_componentes():
    ruta = "src/data"
    archivos = [
        "componentes_cpu.json",
        "componentes_gpu.json",
        "componentes_ram.json",
        "componentes_mobo.json",
        "componentes_fuentes.json",
        "componentes_cases.json",
        "componentes_ssd.json"
    ]

    componentes = []

    for archivo in archivos:
        path = os.path.join(ruta, archivo)
        with open(path, "r", encoding="utf-8") as f:
            componentes.extend(json.load(f))

    return componentes
