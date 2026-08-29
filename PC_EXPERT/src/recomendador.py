# recomendador.py — Motor principal de recomendación de PC por presupuesto

from src.busqueda import (
    buscar_gpu_para_presupuesto,
    buscar_cpu_para_gpu
)
from src.compatibilidad import verificar_pc
from export.exportar_pdf import PDFExporter
from export.exportar_txt import exportar_pc_txt


# src/recomendador.py

def recomendar_pc_por_presupuesto(presupuesto, componentes):
    try:
        presupuesto = float(presupuesto)
    except:
        return {"error": "Presupuesto inválido."}

    # Separar componentes por categoría
    categorias = {
        "cpu": [],
        "gpu": [],
        "placa madre": [],
        "ram": [],
        "ssd": [],
        "fuente": [],
        "case": []
    }

    for c in componentes:
        cat = c.get("categoria", "").lower()
        if cat in categorias:
            categorias[cat].append(c)

    # 1) GPU: mejor rendimiento dentro del presupuesto
    gpus_posibles = [g for g in categorias["gpu"] if g["precio"] <= presupuesto]
    if not gpus_posibles:
        return {"error": "No hay GPU dentro del presupuesto."}
    gpu = sorted(gpus_posibles, key=lambda x: x["rendimiento"], reverse=True)[0]

    # 2) CPU: mismo socket que la placa compatible
    cpus = categorias["cpu"]

    # 3) Placas madre compatibles según socket
    placas = categorias["placa madre"]

    cpu = None
    mobo = None

    for c in cpus:
        mismas_placas = [p for p in placas if p["socket"] == c["socket"]]
        if mismas_placas:
            cpu = c
            mobo = mismas_placas[0]
            break

    if cpu is None:
        return {"error": "No hay CPU compatible con placa madre."}

    # 4) RAM compatible con tipo (DDR4 o DDR5)
    tipo_ram_mobo = mobo["tipo_ram"]
    posibles_ram = [ram for ram in categorias["ram"] if ram["tipo"] == tipo_ram_mobo]

    if not posibles_ram:
        return {"error": "No hay RAM compatible con la placa madre."}

    ram = sorted(posibles_ram, key=lambda x: x["frecuencia"], reverse=True)[0]

    # 5) SSD → escogemos el mejor rendimiento lectura/escritura dentro del presupuesto
    ssd = sorted(categorias["ssd"], key=lambda x: (x["lectura"] + x["escritura"]), reverse=True)[0]

    # 6) Fuente → watts reales del rail 12v >= min_fuente GPU
    fuentes_posibles = [
        f for f in categorias["fuente"]
        if f["rail_12v"] >= gpu["min_fuente"]
    ]

    if not fuentes_posibles:
        return {"error": "No hay fuentes suficientes para esta GPU."}

    fuente = sorted(fuentes_posibles, key=lambda x: x["rail_12v"], reverse=True)[0]

    # 7) Case → largo GPU <= gpu_max_mm
    cases_posibles = [
        c for c in categorias["case"]
        if c["gpu_max_mm"] >= gpu["largo_mm"]
    ]

    if not cases_posibles:
        return {"error": "No hay case compatible con el tamaño de la GPU."}

    case = sorted(cases_posibles, key=lambda x: x["airflow_score"], reverse=True)[0]

    total = cpu["precio"] + mobo["precio"] + ram["precio"] + gpu["precio"] + ssd["precio"] + fuente["precio"] + case["precio"]

    if total > presupuesto:
        return {"error": f"El total ({total}) supera el presupuesto ({presupuesto})."}

    return {
        "cpu": cpu,
        "placa madre": mobo,
        "ram": ram,
        "gpu": gpu,
        "ssd": ssd,
        "fuente": fuente,
        "case": case,
        "precio_total": total
    }
