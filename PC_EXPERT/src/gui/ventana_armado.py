# ventana_armado.py — Armado guiado paso a paso (Builder)

import tkinter as tk
from tkinter import ttk, messagebox

from .estilos import Estilos
from src.builder import PCBuilder
from src.busqueda import buscar_categoria
from src.utils import formatear_precio
from export.exportar_pdf import PDFExporter
from export.exportar_txt import exportar_pc_txt



class VentanaArmado:

    def __init__(self, root, datos, volver_callback, tema="oscuro"):

        self.root = root
        self.datos = datos
        self.volver = volver_callback

        self.estilos = Estilos(tema)
        self.estilos.aplicar_global(self.root)

        self.root.title("PC EXPERT — Armado paso a paso (Builder)")
        self.root.geometry("1000x700")

        # Cargar motor builder
        self.builder = PCBuilder(self.datos["componentes"])

        # 🔹 guardar referencias a los combos
        self.combos = {}

        self.frame = tk.Frame(self.root, bg=self.estilos.colores["fondo"])
        self.frame.pack(expand=True, fill="both")

        self.crear_interfaz()


    # --------------------------------------------------------
    # CREAR INTERFAZ COMPLETA
    # --------------------------------------------------------
    def crear_interfaz(self):

        titulo = tk.Label(self.frame, text="Armado de PC — Paso a Paso", font=("Inter", 22, "bold"))
        self.estilos.estilo_label(titulo)
        titulo.pack(pady=20)

        sub = tk.Label(self.frame, text="Selecciona los componentes en orden recomendado")
        self.estilos.estilo_label(sub)
        sub.pack(pady=5)

        # Panel central
        panel = tk.Frame(self.frame, bg=self.estilos.colores["fondo_panel"])
        self.estilos.estilo_panel(panel)
        panel.pack(fill="both", expand=True, padx=30, pady=20)

        # Selectores
        self.crear_selector(panel, "CPU", 0, self.seleccionar_cpu)
        self.crear_selector(panel, "Placa Madre", 1, self.seleccionar_mobo)
        self.crear_selector(panel, "RAM", 2, self.seleccionar_ram)
        self.crear_selector(panel, "GPU", 3, self.seleccionar_gpu)
        self.crear_selector(panel, "Case", 4, self.seleccionar_case)
        self.crear_selector(panel, "Fuente", 5, self.seleccionar_fuente)
        self.crear_selector(panel, "SSD", 6, self.seleccionar_ssd)

        # Botón finalizar
        boton_finalizar = tk.Button(panel, text="Finalizar armado", command=self.finalizar)
        self.estilos.estilo_boton(boton_finalizar)
        boton_finalizar.grid(row=7, column=0, columnspan=3, pady=20)

        # Resultado
        self.resultado_texto = tk.Text(
            self.frame,
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"],
            font=("Inter", 12),
            relief="flat",
            height=10
        )
        self.estilos.estilo_panel(self.resultado_texto)
        self.resultado_texto.pack(fill="x", padx=30, pady=10)

        # Botón volver
        btn_volver = tk.Button(self.frame, text="Volver al menú", command=self.volver)
        self.estilos.estilo_boton(btn_volver)
        btn_volver.pack(pady=15)

    # --------------------------------------------------------
    # CREAR SELECTOR POR CATEGORÍA
    # --------------------------------------------------------
    def crear_selector(self, parent, texto, fila, comando):

        tk.Label(
            parent,
            text=texto + ":",
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"]
        ).grid(row=fila, column=0, padx=5, pady=10)

        lista = buscar_categoria(self.datos["componentes"], texto.lower()) or []
        nombres = [c.get("nombre", "??") for c in lista]

        combo = ttk.Combobox(parent, values=nombres, width=40)
        combo.grid(row=fila, column=1, padx=10, pady=10)

        # 🔹 guardar referencia del combo
        clave = texto.lower()        # "cpu", "placa madre", "ram", ...
        self.combos[clave] = combo

        boton = tk.Button(parent, text="Seleccionar", command=lambda: comando(combo.get()))
        self.estilos.estilo_boton(boton)
        boton.grid(row=fila, column=2, padx=10)


    # --------------------------------------------------------
    # SELECCIÓN DE CADA COMPONENTE
    # --------------------------------------------------------
    def seleccionar_cpu(self, nombre):
        cpu = self.buscar("cpu", nombre)
        if cpu:
            self.builder.elegir_cpu(cpu)
            messagebox.showinfo("CPU seleccionada", f"Elegiste: {cpu['nombre']}")
            self.autocompletar_restante()
        else:
            messagebox.showerror("Error", "CPU no válida")

    def seleccionar_mobo(self, nombre):
        mobo = self.buscar("placa madre", nombre)
        if mobo:
            if self.builder.elegir_mobo(mobo):
                messagebox.showinfo("Placa seleccionada", f"Elegiste: {mobo['nombre']}")
                self.autocompletar_restante()
            else:
                messagebox.showerror("Error", "Placa no compatible con la CPU.")
        else:
            messagebox.showerror("Error", "Placa no válida")

    def seleccionar_ram(self, nombre):
        ram = self.buscar("ram", nombre)
        if ram:
            if self.builder.elegir_ram(ram):
                messagebox.showinfo("RAM seleccionada", f"Elegiste: {ram['nombre']}")
                self.autocompletar_restante()
            else:
                messagebox.showerror("Error", "La RAM no es compatible.")
        else:
            messagebox.showerror("Error", "RAM no válida")

    def seleccionar_gpu(self, nombre):
        gpu = self.buscar("gpu", nombre)
        if gpu:
            self.builder.elegir_gpu(gpu)
            messagebox.showinfo("GPU seleccionada", f"Elegiste: {gpu['nombre']}")
            self.autocompletar_restante()
        else:
            messagebox.showerror("Error", "GPU no válida")

    def seleccionar_case(self, nombre):
        case = self.buscar("case", nombre)
        if case:
            if self.builder.elegir_case(case):
                messagebox.showinfo("Case seleccionado", f"Elegiste: {case['nombre']}")
                self.autocompletar_restante()
            else:
                messagebox.showerror("Error", "El case no es compatible.")
        else:
            messagebox.showerror("Error", "Case no válido")

    def seleccionar_fuente(self, nombre):
        fuente = self.buscar("fuente", nombre)
        if fuente:
            if self.builder.elegir_fuente(fuente):
                messagebox.showinfo("Fuente seleccionada", f"Elegiste: {fuente['nombre']}")
                self.autocompletar_restante()
            else:
                messagebox.showerror("Error", "Fuente insuficiente.")
        else:
            messagebox.showerror("Error", "Fuente no válida")

    def seleccionar_ssd(self, nombre):
        ssd = self.buscar("ssd", nombre)
        if ssd:
            if self.builder.elegir_ssd(ssd):
                messagebox.showinfo("SSD seleccionada", f"Elegiste: {ssd['nombre']}")
                self.autocompletar_restante()
            else:
                messagebox.showerror("Error", "SSD no compatible.")
        else:
            messagebox.showerror("Error", "SSD no válida")


    # --------------------------------------------------------
    # FINALIZAR ARMADO
    # --------------------------------------------------------
    def finalizar(self):

        pc = self.builder.obtener_pc()

        self.resultado_texto.delete("1.0", "end")

        if not pc:
            self.resultado_texto.insert("end", "❌ La PC aún no está completa.\n")
            return

        self.resultado_texto.insert("end", "✔ PC COMPLETA ARMADA EXITOSAMENTE\n\n")

        for categoria, comp in pc.items():
            if isinstance(comp, dict):
                self.resultado_texto.insert(
                    "end",
                    f"{categoria.upper()}: {comp.get('nombre','')} — {formatear_precio(comp.get('precio',0))}\n"
                )

        self.resultado_texto.insert("end", f"\nTOTAL: {formatear_precio(pc.get('precio_total',0))}\n")

    # --------------------------------------------------------
    # UTILIDAD: BUSCAR COMPONENTE
    # --------------------------------------------------------
    def buscar(self, categoria, nombre):

        lista = buscar_categoria(self.datos["componentes"], categoria) or []

        for c in lista:
            if c.get("nombre", "") == nombre:
                return c

        return None
    def autocompletar_restante(self):
        """
        Completa automáticamente los componentes que faltan,
        usando solo componentes compatibles según PCBuilder.
        """

        # 1) CPU ya seleccionada → elegir mejor placa (más barata compatible)
        if self.builder.cpu and not self.builder.mobo:
            placas = self.builder.placas_compatibles()
            if placas:
                mejores = sorted(placas, key=lambda x: x.get("precio", 0))
                self.builder.elegir_mobo(mejores[0])

        # 2) Placa seleccionada → RAM compatible (más barata compatible)
        if self.builder.mobo and not self.builder.ram:
            rams = self.builder.rams_compatibles()
            if rams:
                mejores = sorted(rams, key=lambda x: x.get("precio", 0))
                self.builder.elegir_ram(mejores[0])

        # 3) GPU compatible → mejor rendimiento
        if self.builder.mobo and not self.builder.gpu:
            gpus = self.builder.gpus_compatibles()
            if gpus:
                mejores = sorted(gpus, key=lambda x: x.get("rendimiento", 0), reverse=True)
                self.builder.elegir_gpu(mejores[0])

        # 4) Fuente compatible → más barata que cumpla
        if self.builder.gpu and not self.builder.fuente:
            fuentes = self.builder.fuentes_compatibles()
            if fuentes:
                mejores = sorted(fuentes, key=lambda x: x.get("precio", 0))
                self.builder.elegir_fuente(mejores[0])

        # 5) Case compatible con GPU y placa
        if self.builder.gpu and self.builder.mobo and not self.builder.case:
            cases = self.builder.cases_compatibles()
            if cases:
                mejores = sorted(cases, key=lambda x: x.get("precio", 0))
                self.builder.elegir_case(mejores[0])

        # 6) SSD compatible
        if self.builder.mobo and not self.builder.ssd:
            ssds = self.builder.ssds_compatibles()
            if ssds:
                mejores = sorted(ssds, key=lambda x: x.get("precio", 0))
                self.builder.elegir_ssd(mejores[0])

        # 🔹 actualizar combos visualmente
        self.actualizar_combos_desde_builder()

        # 🔹 mostrar resumen + recomendaciones
        self.mostrar_pc_autocompletada()
        
    def actualizar_combos_desde_builder(self):
        """
        Sincroniza los combobox con lo que tenga seleccionado el builder.
        """

        mapa = {
            "cpu": ("cpu", "cpu"),
            "placa madre": ("mobo", "placa madre"),
            "ram": ("ram", "ram"),
            "gpu": ("gpu", "gpu"),
            "case": ("case", "case"),
            "fuente": ("fuente", "fuente"),
            "ssd": ("ssd", "ssd"),
        }

        for clave_combo, (attr_builder, _) in mapa.items():
            combo = self.combos.get(clave_combo)
            comp = getattr(self.builder, attr_builder, None)
            if combo is not None and comp is not None:
                combo.set(comp.get("nombre", ""))


    def mostrar_pc_autocompletada(self):

        # Construir un dict parcial con lo que haya
        pc = {
            "cpu": self.builder.cpu,
            "placa madre": self.builder.mobo,
            "ram": self.builder.ram,
            "gpu": self.builder.gpu,
            "ssd": self.builder.ssd,
            "fuente": self.builder.fuente,
            "case": self.builder.case,
        }

        self.resultado_texto.delete("1.0", "end")

        self.resultado_texto.insert("end", "✅ Configuración generada automáticamente (puedes cambiar componentes):\n\n")

        total = 0
        for categoria, comp in pc.items():
            if isinstance(comp, dict):
                precio = comp.get("precio", 0)
                total += precio
                self.resultado_texto.insert(
                    "end",
                    f"{categoria.upper()}: {comp.get('nombre','')} — {formatear_precio(precio)}\n"
                )

        self.resultado_texto.insert("end", f"\nSUBTOTAL: {formatear_precio(total)}\n\n")

        # ───────── Recomendaciones ─────────
        self.resultado_texto.insert("end", "💡 Recomendaciones:\n")

        cpu = pc.get("cpu")
        gpu = pc.get("gpu")
        fuente = pc.get("fuente")

        # balance CPU/GPU si tengo ambos
        if cpu and gpu:
            rend_cpu = cpu.get("rendimiento", 0)
            rend_gpu = gpu.get("rendimiento", 0)
            if rend_gpu < 0.8 * rend_cpu:
                self.resultado_texto.insert("end", "- La GPU puede limitar el rendimiento, considera una mejor.\n")
            elif rend_cpu < 0.8 * rend_gpu:
                self.resultado_texto.insert("end", "- El CPU puede ser cuello de botella, una CPU mejoraría el balance.\n")
            else:
                self.resultado_texto.insert("end", "- CPU y GPU están bastante equilibrados.\n")
        else:
            self.resultado_texto.insert("end", "- Completa CPU y GPU para analizar el balance.\n")

        # fuente vs GPU si tengo ambos
        if fuente and gpu:
            if fuente.get("watts", 0) < gpu.get("min_fuente", 0):
                self.resultado_texto.insert("end", "- La fuente está por debajo de lo recomendado para la GPU.\n")
            else:
                self.resultado_texto.insert("end", "- La fuente es adecuada para esta GPU.\n")

        # ───────── Opciones para reducir costo (solo GPU por ahora) ─────────
        self.resultado_texto.insert("end", "\n💰 Opciones para reducir costo:\n")

        if gpu:
            gpus_todas = buscar_categoria(self.datos["componentes"], "gpu") or []
            alternativas = [
                g for g in gpus_todas
                if g.get("precio", 0) < gpu.get("precio", 0)
            ]
            alternativas = sorted(alternativas, key=lambda x: x.get("precio", 0))

            if alternativas:
                barato = alternativas[0]
                ahorro = gpu.get("precio", 0) - barato.get("precio", 0)
                self.resultado_texto.insert(
                    "end",
                    f"- GPU alternativa: {barato.get('nombre','')} (ahorro aprox. {formatear_precio(ahorro)})\n"
                )
            else:
                self.resultado_texto.insert("end", "- No se encontraron GPUs más baratas en la base de datos.\n")
        else:
            self.resultado_texto.insert("end", "- Selecciona una GPU para sugerir alternativas más económicas.\n")

