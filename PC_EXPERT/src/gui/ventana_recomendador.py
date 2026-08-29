import tkinter as tk
from tkinter import ttk, messagebox

from .estilos import Estilos
from src.recomendador_pro import recomendar_pc_pro
from src.utils import formatear_precio


class VentanaRecomendador:

    def __init__(self, root, datos, volver_callback, tema="oscuro"):
        self.root = root
        self.datos = datos
        self.volver = volver_callback

        # Estilos
        self.estilos = Estilos(tema)
        self.estilos.aplicar_global(self.root)

        self.root.title("PC EXPERT — Recomendador por Presupuesto")
        self.root.geometry("900x650")

        self.frame = tk.Frame(self.root, bg=self.estilos.colores["fondo"])
        self.frame.pack(expand=True, fill="both")

        self.crear_interfaz()

    # --------------------------------------------------------
    # INTERFAZ
    # --------------------------------------------------------
    def crear_interfaz(self):

        titulo = tk.Label(
            self.frame,
            text="Recomendador por Presupuesto",
            font=("Inter", 22, "bold")
        )
        self.estilos.estilo_label(titulo)
        titulo.pack(pady=20)

        # ---------------------------
        # Entrada de presupuesto
        # ---------------------------
        input_frame = tk.Frame(self.frame, bg=self.estilos.colores["fondo"])
        input_frame.pack(pady=10)

        lbl = tk.Label(input_frame, text="Ingresa tu presupuesto (S/):")
        self.estilos.estilo_label(lbl)
        lbl.pack(side="left", padx=5)

        self.entry_presupuesto = tk.Entry(input_frame, width=12)
        self.entry_presupuesto.pack(side="left", padx=5)

        btn = tk.Button(
            input_frame,
            text="Recomendar",
            command=self.ejecutar_recomendacion
        )
        self.estilos.estilo_boton(btn)
        btn.pack(side="left", padx=10)

        # ---------------------------
        # Área de resultados
        # ---------------------------
        self.resultado_frame = tk.Frame(self.frame, bg=self.estilos.colores["fondo_panel"])
        self.estilos.estilo_panel(self.resultado_frame)
        self.resultado_frame.pack(pady=20, fill="both", expand=True)

        # Tabla
        columnas = ("categoria", "nombre", "precio")
        self.tabla = ttk.Treeview(self.resultado_frame, columns=columnas, show="headings")
        self.tabla.heading("categoria", text="Categoría")
        self.tabla.heading("nombre", text="Nombre")
        self.tabla.heading("precio", text="Precio")

        try:
            self.estilos.aplicar_tablas()
        except:
            pass

        self.tabla.pack(expand=True, fill="both", padx=10, pady=10)
                # Colores para las tres opciones
        self.tabla.tag_configure("recomendada", background="#0b3d0b", foreground="white")
        self.tabla.tag_configure("estandar", background="#202020", foreground="white")
        self.tabla.tag_configure("economica", background="#3d0a0a", foreground="white")

        # Botón volver
        btn_volver = tk.Button(self.frame, text="Volver al menú", command=self.volver)
        self.estilos.estilo_boton(btn_volver)
        btn_volver.pack(pady=20)

    # --------------------------------------------------------
    # EJECUTAR RECOMENDACIÓN
    # --------------------------------------------------------
    def ejecutar_recomendacion(self):

        presupuesto_str = self.entry_presupuesto.get().strip()

        try:
            presupuesto = float(presupuesto_str)
            if presupuesto <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Error", "Presupuesto inválido.")
            return

        # Llamamos al motor profesional que ahora devuelve HASTA 3 opciones
        resultados = recomendar_pc_pro(presupuesto, self.datos)

        # Si vino un dict con "error"
        if isinstance(resultados, dict) and "error" in resultados:
            messagebox.showerror("Error", resultados["error"])
            return

        self.mostrar_resultado(resultados)

    # --------------------------------------------------------
    # MOSTRAR RESULTADO
    # --------------------------------------------------------
        # --------------------------------------------------------
    # MOSTRAR RESULTADO (3 OPCIONES)
    # --------------------------------------------------------
    def mostrar_resultado(self, resultados):

        # Vaciar tabla
        for fila in self.tabla.get_children():
            self.tabla.delete(fila)

        etiquetas = [
            ("OPCIÓN 1 - RECOMENDADA", "recomendada"),
            ("OPCIÓN 2 - ESTÁNDAR", "estandar"),
            ("OPCIÓN 3 - ECONÓMICA", "economica"),
        ]

        for idx, resultado in enumerate(resultados):
            titulo, tag = etiquetas[idx]

            # Fila de título de la opción
            self.tabla.insert(
                "",
                "end",
                values=(titulo, "", ""),
                tags=(tag,)
            )

            # Componentes
            for categoria in ["cpu", "placa madre", "ram", "ssd", "gpu", "fuente", "case"]:
                comp = resultado[categoria]
                self.tabla.insert(
                    "",
                    "end",
                    values=(
                        categoria.upper(),
                        comp["nombre"],
                        formatear_precio(comp["precio"])
                    ),
                    tags=(tag,)
                )

            # Total
            self.tabla.insert(
                "",
                "end",
                values=(
                    "TOTAL",
                    "",
                    formatear_precio(resultado["precio_total"])
                ),
                tags=(tag,)
            )

            # Sobrante
            self.tabla.insert(
                "",
                "end",
                values=(
                    "SOBRANTE",
                    "",
                    formatear_precio(resultado["sobrante"])
                ),
                tags=(tag,)
            )

            # Fila vacía separadora
            self.tabla.insert("", "end", values=("", "", ""))
