# builder.py — Ensamblador paso a paso de PC EXPERT

from src.busqueda import buscar_categoria
from src.compatibilidad import (
    cpu_compatible_con_mobo,
    ram_compatible_con_mobo,
    gpu_compatible_con_fuente,
    gpu_compatible_con_case,
    ssd_compatible_con_mobo,
)


class PCBuilder:
    """
    Sistema de armado de PC paso a paso.
    Guarda temporalmente cada componente seleccionado.
    """

    def __init__(self, componentes):
        self.componentes = componentes

        # Componentes seleccionados
        self.cpu = None
        self.mobo = None
        self.ram = None
        self.gpu = None
        self.ssd = None
        self.fuente = None
        self.case = None

    # -------------------------------------------
    # 1) CPU
    # -------------------------------------------
    def elegir_cpu(self, cpu):
        self.cpu = cpu
        # Resetear pasos posteriores
        self.mobo = None
        self.ram = None
        self.gpu = None
        self.ssd = None
        self.fuente = None
        self.case = None
        return True

    def placas_compatibles(self):
        if not self.cpu:
            return []

        placas = buscar_categoria(self.componentes, "placa madre") or []

        return [
            p for p in placas if cpu_compatible_con_mobo(self.cpu, p)
        ]

    # -------------------------------------------
    # 2) PLACA MADRE
    # -------------------------------------------
    def elegir_mobo(self, mobo):
        if not self.cpu or not cpu_compatible_con_mobo(self.cpu, mobo):
            return False

        self.mobo = mobo

        # Resetear pasos posteriores
        self.ram = None
        self.gpu = None
        self.ssd = None
        self.fuente = None
        self.case = None
        return True

    def rams_compatibles(self):
        if not self.mobo:
            return []

        rams = buscar_categoria(self.componentes, "ram") or []

        tipo_ram = self.mobo.get("tipo_ram", "DDR4")
        max_freq = self.mobo.get("max_ram_mhz", 9999)

        return [
            r for r in rams
            if r.get("tipo") == tipo_ram and r.get("frecuencia", 0) <= max_freq
        ]


    # -------------------------------------------
    # 3) RAM
    # -------------------------------------------
    def elegir_ram(self, ram):
        if not self.mobo or not ram_compatible_con_mobo(ram, self.mobo):
            return False

        self.ram = ram
        return True

    # -------------------------------------------
    # 4) GPU
    # -------------------------------------------
    def gpus_compatibles(self):
        """
        GPUs compatibles con la placa madre:
        - Coincide PCIe (3.0 / 4.0 / 5.0)
        - Admite todas si la placa no especifica pcie_version
        """
        gpus = buscar_categoria(self.componentes, "gpu") or []
        if not self.mobo:
            return gpus

        pcie_pl = self.mobo.get("pcie_version", "3.0")

        compatibles = []
        for g in gpus:
            pcie_gpu = g.get("pcie", "3.0")
            if pcie_gpu[0] <= pcie_pl[0]:   # Ejemplo: GPU 4.0 en placa 5.0 sí entra
                compatibles.append(g)

        return compatibles


    def elegir_gpu(self, gpu):
        self.gpu = gpu
        # Resetear pasos posteriores
        self.fuente = None
        self.case = None
        return True

    # -------------------------------------------
    # 5) CASE
    # -------------------------------------------
    def cases_compatibles(self):
        if not self.gpu or not self.mobo:
            return []

        cases = buscar_categoria(self.componentes, "case") or []

        largo_gpu = self.gpu.get("largo", 0)
        form_factor = self.mobo.get("form_factor", "ATX")

        compatibles = []
        for c in cases:
            if c.get("gpu_max", 9999) >= largo_gpu:
                if form_factor in c.get("formatos_soportados", ["ATX", "mATX", "ITX"]):
                    compatibles.append(c)

        return compatibles


    def elegir_case(self, case):
        if not self.gpu or not self.mobo:
            return False

        if not gpu_compatible_con_case(self.gpu, case):
            return False


        self.case = case
        return True

    # -------------------------------------------
    # 6) FUENTE
    # -------------------------------------------
    def fuentes_compatibles(self):
        fuentes = buscar_categoria(self.componentes, "fuente") or []

        if not self.gpu:
            return fuentes

        min_gpu = self.gpu.get("min_fuente", 0)
        tdp_cpu = self.cpu.get("tdp", 65) if self.cpu else 0

        potencia_minima = min_gpu + tdp_cpu + 100  # margen PRO

        return [
            f for f in fuentes
            if f.get("watts", 0) >= potencia_minima
        ]


    def elegir_fuente(self, fuente):
        if not self.gpu:
            return False

        if not gpu_compatible_con_fuente(self.gpu, fuente, self.cpu):

            return False

        self.fuente = fuente
        return True

    # -------------------------------------------
    # 7) SSD
    # -------------------------------------------
    def ssds_compatibles(self):
        if not self.mobo:
            return []

        ssds = buscar_categoria(self.componentes, "ssd") or []
        pcie_mobo = self.mobo.get("pcie_version", "3.0")

        compatibles = []
        for s in ssds:
            tipo = s.get("tipo", "SATA")
            if tipo == "SATA":
                compatibles.append(s)
            else:
                if s.get("pcie", "3.0")[0] <= pcie_mobo[0]:
                    compatibles.append(s)

        return compatibles


    def elegir_ssd(self, ssd):
        if not self.mobo or not ssd_compatible_con_mobo(ssd, self.mobo):
            return False

        self.ssd = ssd
        return True

    # -------------------------------------------
    # PC FINAL
    # -------------------------------------------
    def obtener_pc(self):
        """
        Devuelve la PC final si todos los componentes están completos.
        """
        if not all([self.cpu, self.mobo, self.ram, self.gpu, self.ssd, self.fuente, self.case]):
            return None

        total = sum([
            self.cpu.get("precio", 0),
            self.mobo.get("precio", 0),
            self.ram.get("precio", 0),
            self.gpu.get("precio", 0),
            self.ssd.get("precio", 0),
            self.fuente.get("precio", 0),
            self.case.get("precio", 0),
        ])

        return {
            "cpu": self.cpu,
            "placa madre": self.mobo,
            "ram": self.ram,
            "gpu": self.gpu,
            "ssd": self.ssd,
            "fuente": self.fuente,
            "case": self.case,
            "precio_total": total
        }
