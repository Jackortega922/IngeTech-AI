# -----------------------------------------------------------
#  PC EXPERT — Analizador de Compatibilidad Inteligente
#  Filtrado dinámico CPU → MOBO → RAM → GPU → Fuente → Case
# -----------------------------------------------------------

import tkinter as tk
from tkinter import ttk, messagebox

from .estilos import Estilos
from src.busqueda import buscar_categoria
from src.compatibilidad import verificar_pc
from src.utils import formatear_precio

class VentanaCompatibilidad:

    def __init__(self, root, datos, volver_callback, tema="oscuro"):
        self.root = root
        self.datos = datos
        self.volver = volver_callback

        self.estilos = Estilos(tema)
        self.estilos.aplicar_global(self.root)

        self.root.title("PC EXPERT — Analizador de Compatibilidad")
        self.root.geometry("900x700")

        self.frame = tk.Frame(self.root, bg=self.estilos.colores["fondo"])
        self.frame.pack(expand=True, fill="both")

        self.crear_interfaz()
        self.cargar_todo()

    # --------------------------------------------------------
    # CREAR INTERFACE BASE
    # --------------------------------------------------------
    def crear_interfaz(self):

        titulo = tk.Label(
            self.frame, 
            text="Analizador de Compatibilidad",
            font=("Inter", 22, "bold")
        )
        self.estilos.estilo_label(titulo)
        titulo.pack(pady=20)

        panel = tk.Frame(self.frame, bg=self.estilos.colores["fondo_panel"])
        self.estilos.estilo_panel(panel)
        panel.pack(fill="x", padx=20, pady=10)

        # VARIABLES
        self.cpu_var = tk.StringVar()
        self.mobo_var = tk.StringVar()
        self.ram_var = tk.StringVar()
        self.gpu_var = tk.StringVar()
        self.ssd_var = tk.StringVar()
        self.fuente_var = tk.StringVar()
        self.case_var = tk.StringVar()

        # SELECTORES
        self.cpu_combo   = self.selector(panel, "CPU:", self.cpu_var, 0)
        self.mobo_combo  = self.selector(panel, "Placa madre:", self.mobo_var, 1)
        self.ram_combo   = self.selector(panel, "RAM:", self.ram_var, 2)
        self.gpu_combo   = self.selector(panel, "GPU:", self.gpu_var, 3)
        self.ssd_combo   = self.selector(panel, "SSD:", self.ssd_var, 4)
        self.fuente_combo= self.selector(panel, "Fuente:", self.fuente_var, 5)
        self.case_combo  = self.selector(panel, "Case:", self.case_var, 6)

        # EVENTOS DINÁMICOS
        self.cpu_combo.bind("<<ComboboxSelected>>", self.filtrar_por_cpu)
        self.mobo_combo.bind("<<ComboboxSelected>>", self.filtrar_por_mobo)
        self.gpu_combo.bind("<<ComboboxSelected>>", self.filtrar_por_gpu)

        # BOTÓN ANALIZAR
        btn = tk.Button(panel, text="Analizar compatibilidad", command=self.analizar)
        self.estilos.estilo_boton(btn)
        btn.grid(row=7, column=0, columnspan=3, pady=15)

        # RESULTADO
        resultado_frame = tk.Frame(self.frame, bg=self.estilos.colores["fondo_panel"])
        self.estilos.estilo_panel(resultado_frame)
        resultado_frame.pack(fill="both", expand=True, padx=20, pady=10)

        self.resultado_texto = tk.Text(
            resultado_frame,
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"],
            font=("Inter", 12),
            relief="flat"
        )
        self.resultado_texto.pack(fill="both", expand=True, padx=10, pady=10)

        self.resultado_texto.tag_config("rojo", foreground="red")
        self.resultado_texto.tag_config("verde", foreground="green")

        # VOLVER
        btn_volver = tk.Button(self.frame, text="Volver al menú", command=self.volver)
        self.estilos.estilo_boton(btn_volver)
        btn_volver.pack(pady=15)

    # --------------------------------------------------------
    def selector(self, parent, texto, variable, fila):
        tk.Label(
            parent,
            text=texto,
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"]
        ).grid(row=fila, column=0, padx=5, pady=5)

        combo = ttk.Combobox(parent, textvariable=variable, width=40)
        combo.grid(row=fila, column=1, padx=10, pady=5)
        return combo

    # --------------------------------------------------------
    def cargar_todo(self):
        self.cpu_lista   = buscar_categoria(self.datos["componentes"], "cpu")
        self.mobo_lista  = buscar_categoria(self.datos["componentes"], "placa madre")
        self.ram_lista   = buscar_categoria(self.datos["componentes"], "ram")
        self.gpu_lista   = buscar_categoria(self.datos["componentes"], "gpu")
        self.ssd_lista   = buscar_categoria(self.datos["componentes"], "ssd")
        self.fuente_lista= buscar_categoria(self.datos["componentes"], "fuente")
        self.case_lista  = buscar_categoria(self.datos["componentes"], "case")

        # Cargar combos iniciales
        self.cpu_combo["values"] = [c["nombre"] for c in self.cpu_lista]
        self.gpu_combo["values"] = [c["nombre"] for c in self.gpu_lista]
        self.ssd_combo["values"] = [c["nombre"] for c in self.ssd_lista]

        # Otros combos se filtran dinámicamente

    # --------------------------------------------------------
    # FILTRO CPU → PLACAS
    # --------------------------------------------------------
    def filtrar_por_cpu(self, event):
        cpu_nombre = self.cpu_var.get()
        cpu = next((c for c in self.cpu_lista if c["nombre"] == cpu_nombre), None)
        if not cpu: return

        socket_cpu = cpu.get("socket")

        placas_ok = [
            m["nombre"]
            for m in self.mobo_lista
            if m.get("socket") == socket_cpu
        ]

        self.mobo_combo["values"] = placas_ok
        self.mobo_var.set("")

    # --------------------------------------------------------
    # FILTRO MOBO → RAM
    # --------------------------------------------------------
    def filtrar_por_mobo(self, event):
        mobo_nombre = self.mobo_var.get()
        mobo = next((m for m in self.mobo_lista if m["nombre"] == mobo_nombre), None)
        if not mobo: return

        tipo_ram = mobo.get("tipo_ram")  # DDR4 o DDR5

        rams_ok = [
            r["nombre"]
            for r in self.ram_lista
            if r.get("tipo") == tipo_ram
        ]

        self.ram_combo["values"] = rams_ok
        self.ram_var.set("")

    # --------------------------------------------------------
    # FILTRO GPU → CASE y FUENTE
    # --------------------------------------------------------
    def filtrar_por_gpu(self, event):
        gpu_nombre = self.gpu_var.get()
        gpu = next((g for g in self.gpu_lista if g["nombre"] == gpu_nombre), None)
        if not gpu: return

        largo_gpu = gpu.get("largo", 0)
        watts_gpu = gpu.get("power", 0)

        # CASES
        cases_ok = [
            c["nombre"]
            for c in self.case_lista
            if c.get("gpu_max", 0) >= largo_gpu
        ]
        self.case_combo["values"] = cases_ok
        self.case_var.set("")

        # FUENTES
        fuentes_ok = [
            f["nombre"]
            for f in self.fuente_lista
            if f.get("potencia", 0) >= watts_gpu
        ]
        self.fuente_combo["values"] = fuentes_ok
        self.fuente_var.set("")

    # --------------------------------------------------------
    # ANALIZAR
    # --------------------------------------------------------
        # --------------------------------------------------------
    def analizar(self):
        cpu = self.buscar("cpu", self.cpu_var.get())
        mobo = self.buscar("placa madre", self.mobo_var.get())
        ram = self.buscar("ram", self.ram_var.get())
        gpu = self.buscar("gpu", self.gpu_var.get())
        ssd = self.buscar("ssd", self.ssd_var.get())
        fuente = self.buscar("fuente", self.fuente_var.get())
        case = self.buscar("case", self.case_var.get())

        if not all([cpu, mobo, ram, gpu, ssd, fuente, case]):
            messagebox.showerror("Error", "Debes seleccionar todos los componentes.")
            return

        # ARMAMOS UN SOLO OBJETO PARA verificar_pc()
        build = {
            "cpu": cpu,
            "mobo": mobo,
            "ram": ram,
            "gpu": gpu,
            "ssd": ssd,
            "fuente": fuente,
            "case": case
        }

        errores = verificar_pc(build)

        self.resultado_texto.delete("1.0", "end")

        if errores:
            self.resultado_texto.insert("end", "❌ INCOMPATIBILIDADES:\n\n", "rojo")
            for e in errores:
                self.resultado_texto.insert("end", f"- {e}\n", "rojo")
        else:
            self.resultado_texto.insert("end", "✔ CONFIGURACIÓN COMPATIBLE\n\n", "verde")

            total = (
                cpu["precio"] + mobo["precio"] + ram["precio"] +
                gpu["precio"] + ssd["precio"] + fuente["precio"] + case["precio"]
            )
            self.resultado_texto.insert("end", f"Total: {formatear_precio(total)}\n", "verde")

    # --------------------------------------------------------
    def buscar(self, categoria, nombre):
        lista = buscar_categoria(self.datos["componentes"], categoria)
        for c in lista:
            if c["nombre"] == nombre:
                return c
        return None
