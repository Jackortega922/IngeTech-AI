# estilos.py — Manejo de temas y estilos para la GUI de PC EXPERT

import json
import os
import tkinter as tk
from tkinter import ttk

# ---------------------------------------------
# RUTA CORRECTA a /src/temas/
# ---------------------------------------------
RUTA_TEMAS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temas")



class Estilos:
    """
    Carga y maneja el tema visual de PC EXPERT.
    Los temas se guardan en JSON dentro de /temas/.
    """

    def __init__(self, tema="oscuro"):
        self.tema = tema
        self.colores = self.cargar_tema(tema)

    # ---------------------------------------
    # CARGAR TEMA DESDE JSON
    # ---------------------------------------
    def cargar_tema(self, nombre_tema):
        ruta = os.path.join(RUTA_TEMAS, f"{nombre_tema}.json")

        try:
            with open(ruta, "r", encoding="utf-8") as f:
                print(f"✔ Tema cargado: {ruta}")
                return json.load(f)
        except Exception as e:
            print(f"❌ No se pudo cargar el tema '{nombre_tema}'. Error: {e}")
            print("   → Cargando tema oscuro por defecto.")
            return self.cargar_tema_por_defecto()

    def cargar_tema_por_defecto(self):
        """
        Tema de respaldo si no existe el JSON.
        """
        self.tema = "oscuro"
        return {
            "fondo": "#1E1E1E",
            "fondo_panel": "#2A2A2A",
            "texto": "#FFFFFF",
            "boton_fondo": "#3C7DFF",
            "boton_texto": "#FFFFFF",
            "borde": "#444444",
            "seleccion": "#3C7DFF"
        }

    # ---------------------------------------
    # APLICAR ESTILOS A LA VENTANA
    # ---------------------------------------
    def aplicar_global(self, ventana: tk.Tk):
        ventana.configure(bg=self.colores["fondo"])

    def estilo_label(self, label: tk.Label):
        label.configure(
            bg=self.colores["fondo"],
            fg=self.colores["texto"],
            font=("Inter", 12)
        )

    def estilo_panel(self, frame: tk.Frame):
        frame.configure(
            bg=self.colores["fondo_panel"],
            highlightbackground=self.colores["borde"],
            highlightthickness=1
        )

    def estilo_boton(self, boton: tk.Button):
        boton.configure(
            bg=self.colores["boton_fondo"],
            fg=self.colores["boton_texto"],
            activebackground=self.colores["seleccion"],
            activeforeground="#000000",
            font=("Inter", 11, "bold"),
            relief="flat",
            bd=0,
            padx=10,
            pady=5
        )

    # ---------------------------------------
    # ESTILO PARA TABLAS (Treeview)
    # ---------------------------------------
    def aplicar_tablas(self):
        estilo = ttk.Style()
        estilo.theme_use("clam")

        estilo.configure(
            "Treeview",
            background=self.colores["fondo_panel"],
            foreground=self.colores["texto"],
            fieldbackground=self.colores["fondo_panel"],
            bordercolor=self.colores["borde"],
            rowheight=26,
            font=("Inter", 11)
        )

        estilo.map(
            "Treeview",
            background=[("selected", self.colores["seleccion"])]
        )
