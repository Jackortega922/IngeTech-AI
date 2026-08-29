# ===============================================
# FILTROS INTELIGENTES PARA EL BUILDER
# ===============================================

def filtrar_placas_para_cpu(cpu, placas):
    socket = cpu.get("socket")
    gen = cpu.get("gen")

    filtradas = []
    for m in placas:
        if m.get("socket") == socket:
            # Compatibilidad por chipset básico
            if gen in m.get("compatibilidad_gen", []):
                filtradas.append(m)

    return filtradas


def filtrar_ram_para_mobo(mobo, rams):
    tipo = mobo.get("tipo_ram")
    max_freq = mobo.get("max_freq", 9999)

    filtradas = []
    for r in rams:
        if r.get("tipo") == tipo:
            if r.get("frecuencia", 0) <= max_freq:
                filtradas.append(r)

    return filtradas


def filtrar_case_para_gpu(gpu, cases):
    largo_gpu = gpu.get("largo", 0)

    filtradas = []
    for c in cases:
        if c.get("gpu_max", 9999) >= largo_gpu:
            filtradas.append(c)

    return filtradas


def filtrar_fuentes_para_gpu_cpu(gpu, cpu, fuentes):
    minimo = gpu.get("min_fuente", 0) + cpu.get("tdp", 0) + 150

    filtradas = []
    for f in fuentes:
        if f.get("watts", 0) >= minimo:
            filtradas.append(f)

    return filtradas


def filtrar_ssd_para_mobo(mobo, ssds):
    soporta_nvme = mobo.get("nvme", True)

    filtradas = []
    for s in ssds:
        if s.get("tipo") == "NVMe" and soporta_nvme:
            filtradas.append(s)
        if s.get("tipo") == "SATA":
            filtradas.append(s)

    return filtradas
