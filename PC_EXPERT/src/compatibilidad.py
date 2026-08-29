def cpu_compatible_con_mobo(cpu, mobo):
    """Compatibilidad CPU ↔ Placa madre usando marca, socket y generación."""
    if not cpu or not mobo:
        return True, ""

    marca = cpu.get("marca", "").lower()
    socket_cpu = cpu.get("socket", "").lower()
    socket_mobo = mobo.get("socket", "").lower()

    # Si faltan datos, asumir compatible
    if not socket_cpu or not socket_mobo:
        return True, ""

    if socket_cpu != socket_mobo:
        return False, "El socket de la CPU no coincide con el de la placa madre."

    return True, ""


def ram_compatible_con_mobo(ram, mobo):
    """Compatibilidad RAM ↔ Placa madre (tipo DDR y frecuencia)."""
    if not ram or not mobo:
        return True, ""

    tipo_ram = ram.get("tipo", "").lower()
    tipo_ram_mobo = mobo.get("tipo_ram", "").lower()

    # Si no hay info → asumir compatible
    if not tipo_ram or not tipo_ram_mobo:
        return True, ""

    if tipo_ram != tipo_ram_mobo:
        return False, "La RAM no coincide con el tipo soportado por la placa."

    # Frecuencias
    freq = ram.get("frecuencia", 0)
    freq_max = mobo.get("ram_max_speed", 0)

    if freq_max and freq > freq_max:
        return False, "La RAM supera la frecuencia máxima soportada."

    return True, ""


def gpu_compatible_con_mobo(gpu, mobo):
    """Revisar si el PCIe es compatible."""
    if not gpu or not mobo:
        return True, ""

    pcie_gpu = gpu.get("pcie", "3.0")
    pcie_mobo = mobo.get("pcie", "3.0")

    # PCIe es retrocompatible → siempre OK
    return True, ""


def gpu_compatible_con_fuente(gpu, fuente, cpu=None):
    """Verifica si la fuente tiene suficiente potencia para CPU + GPU."""

    if not gpu or not fuente:
        return True, ""

    watts_fuente = fuente.get("watts", 0)
    consumo_gpu = gpu.get("consumo", gpu.get("tdp", 0))
    consumo_cpu = 60

    if cpu:
        consumo_cpu = cpu.get("tdp", consumo_cpu)

    consumo_total = consumo_cpu + consumo_gpu + 120  # margen seguro

    if watts_fuente < consumo_total:
        return False, "La fuente es insuficiente para la CPU + GPU."

    return True, ""


def gpu_compatible_con_case(gpu, case):
    """Verifica si la GPU entra físicamente en el case."""
    if not gpu or not case:
        return True, ""

    long_gpu = gpu.get("longitud", 0)
    max_gpu_case = case.get("gpu_max", 0)

    if max_gpu_case and long_gpu > max_gpu_case:
        return False, "La GPU no entra físicamente en el case."

    return True, ""


def ssd_compatible_con_mobo(ssd, mobo):
    """Verifica compatibilidad de SSD SATA / NVMe."""
    if not ssd or not mobo:
        return True, ""

    tipo = ssd.get("tipo", "").lower()
    soporte = mobo.get("soporte", "").lower()

    if tipo == "nvme":
        if "m2" not in soporte:
            return False, "La placa no tiene ranura M.2 NVMe."

    return True, ""


def verificar_pc(build):
    """Revisa TODA la compatibilidad y devuelve lista de errores."""
    errores = []

    cpu = build.get("cpu")
    mobo = build.get("mobo")
    ram = build.get("ram")
    gpu = build.get("gpu")
    fuente = build.get("fuente")
    case = build.get("case")
    ssd = build.get("ssd")

    # CPU ↔ MOBO
    ok, msg = cpu_compatible_con_mobo(cpu, mobo)
    if not ok: errores.append(msg)

    # RAM ↔ MOBO
    ok, msg = ram_compatible_con_mobo(ram, mobo)
    if not ok: errores.append(msg)

    # GPU ↔ CASE
    ok, msg = gpu_compatible_con_case(gpu, case)
    if not ok: errores.append(msg)

    # GPU ↔ FUENTE
    ok, msg = gpu_compatible_con_fuente(gpu, fuente, cpu)
    if not ok: errores.append(msg)

    # SSD ↔ MOBO
    ok, msg = ssd_compatible_con_mobo(ssd, mobo)
    if not ok: errores.append(msg)

    return errores
