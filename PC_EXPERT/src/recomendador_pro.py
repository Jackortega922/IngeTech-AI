def recomendar_pc_pro(presupuesto, datos, n_opciones=3):

    componentes = datos["componentes"]

    # -----------------------------------------------------------
    # 1. Separar componentes por categoría
    # -----------------------------------------------------------
    cpu_list    = [c for c in componentes if c["categoria"] == "cpu"]
    gpu_list    = [c for c in componentes if c["categoria"] == "gpu"]
    ram_list    = [c for c in componentes if c["categoria"] == "ram"]
    ssd_list    = [c for c in componentes if c["categoria"] == "ssd"]
    fuente_list = [c for c in componentes if c["categoria"] == "fuente"]
    case_list   = [c for c in componentes if c["categoria"] == "case"]
    mobo_list   = [c for c in componentes if c["categoria"] in ["placa madre", "mobo"]]

    # Ordenar por precio (más barato primero)
    for lista in (cpu_list, gpu_list, ram_list, ssd_list, fuente_list, case_list, mobo_list):
        lista.sort(key=lambda x: x["precio"])

    if not gpu_list or not cpu_list or not mobo_list or not ram_list or not ssd_list:
        return {"error": "Faltan componentes en la base de datos para armar una PC."}

    # -----------------------------------------------------------
    # Función auxiliar: construye la MEJOR PC posible para UNA GPU
    # -----------------------------------------------------------
    def build_for_gpu(gpu):
        mejor_build = None

        for cpu in cpu_list:
            # 1) Placas compatibles con el socket del CPU
            mobos_compat = [m for m in mobo_list if m["socket"] == cpu["socket"]]
            if not mobos_compat:
                continue
            mobo = mobos_compat[0]  # la más barata para ese CPU

            # 2) Fuente compatible con la GPU (según watts mínimos)
            fuentes_compat = [f for f in fuente_list if f["watts"] >= gpu["min_fuente"]]
            if not fuentes_compat:
                continue
            fuente = fuentes_compat[0]

            # 3) Case donde quepa la GPU (largo en mm)
            cases_compat = [c for c in case_list if c["gpu_max_mm"] >= gpu["largo_mm"]]
            if not cases_compat:
                continue
            case = cases_compat[0]

            # 4) RAM compatible con la placa (DDR4 / DDR5)
            ram_tipo = mobo["tipo_ram"]

            dual_candidates = [
                r for r in ram_list
                if r["tipo"] == ram_tipo and "2x" in r["nombre"]
            ]
            single_candidates = [
                r for r in ram_list
                if r["tipo"] == ram_tipo and "2x" not in r["nombre"]
            ]

            if not single_candidates and not dual_candidates:
                continue

            # 5) SSD más barato (para simplificar)
            ssd = ssd_list[0]

            # Intentar primero RAM en dual channel (kits 2x...)
            ram_elegida = None

            for r in sorted(dual_candidates, key=lambda x: x["precio"]):
                total = (
                    gpu["precio"] + cpu["precio"] + mobo["precio"] +
                    r["precio"] + ssd["precio"] + fuente["precio"] + case["precio"]
                )
                if total <= presupuesto:
                    ram_elegida = r
                    break

            # Si no entró ninguna RAM dual, probar single stick
            if ram_elegida is None:
                single_candidates = sorted(single_candidates, key=lambda x: x["precio"])
                if not single_candidates:
                    continue
                r = single_candidates[0]
                total = (
                    gpu["precio"] + cpu["precio"] + mobo["precio"] +
                    r["precio"] + ssd["precio"] + fuente["precio"] + case["precio"]
                )
                if total > presupuesto:
                    continue
                ram_elegida = r

            # Recalcular total por seguridad
            total = (
                gpu["precio"] + cpu["precio"] + mobo["precio"] +
                ram_elegida["precio"] + ssd["precio"] +
                fuente["precio"] + case["precio"]
            )
            if total > presupuesto:
                continue

            # Score de esta build: primero rendimiento de GPU, luego de CPU
            score = (
                gpu.get("rendimiento", 0),
                cpu.get("rendimiento", 0)
            )

            if mejor_build is None or score > mejor_build["score"]:
                mejor_build = {
                    "gpu": gpu,
                    "cpu": cpu,
                    "mobo": mobo,
                    "ram": ram_elegida,
                    "ssd": ssd,
                    "fuente": fuente,
                    "case": case,
                    "total": total,
                    "score": score,
                }

        return mejor_build

    # -----------------------------------------------------------
    # 2. Probar todas las GPUs y quedarnos con las mejores builds
    # -----------------------------------------------------------
    builds = []
    for gpu in gpu_list:
        build = build_for_gpu(gpu)
        if build is not None:
            builds.append(build)

    if not builds:
        return {"error": "No se pudo armar una PC con el presupuesto ingresado."}

    # Ordenar por score (GPU, CPU) de mayor a menor
    builds.sort(key=lambda b: (b["score"][0], b["score"][1], -b["total"]), reverse=True)

    # Tomar hasta n_opciones distintas
    seleccionadas = builds[:n_opciones]

    # -----------------------------------------------------------
    # 3. Salida final para la GUI: lista de configuraciones
    # -----------------------------------------------------------
    resultados = []
    for b in seleccionadas:
        resultados.append({
            "gpu": b["gpu"],
            "cpu": b["cpu"],
            "placa madre": b["mobo"],
            "ram": b["ram"],
            "ssd": b["ssd"],
            "fuente": b["fuente"],
            "case": b["case"],
            "precio_total": b["total"],
            "sobrante": presupuesto - b["total"],
        })

    return resultados
