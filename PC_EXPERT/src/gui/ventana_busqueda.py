# ventana_busqueda.py — Buscador avanzado de componentes

import tkinter as tk
from tkinter import ttk, messagebox

from .estilos import Estilos
from src.busqueda import (
    buscar_avanzado,
    mejores_por_rendimiento,
    peores_por_rendimiento,
)
from src.utils import formatear_precio


class VentanaBusqueda:

    def __init__(self, root, datos, volver_callback, tema="oscuro"):
        self.root = root
        self.datos = datos
        self.volver = volver_callback

        self.estilos = Estilos(tema)
        self.estilos.aplicar_global(self.root)

        self.root.title("PC EXPERT — Búsqueda Avanzada")
        self.root.geometry("1100x700")

        self.frame = tk.Frame(self.root, bg=self.estilos.colores["fondo"])
        self.frame.pack(expand=True, fill="both")

        self.crear_interfaz()

    # --------------------------------------------------------
    # CREAR INTERFAZ COMPLETA
    # --------------------------------------------------------
    def crear_interfaz(self):

        titulo = tk.Label(
            self.frame,
            text="Buscador Avanzado de Componentes",
            font=("Inter", 22, "bold")
        )
        self.estilos.estilo_label(titulo)
        titulo.pack(pady=20)

        # -----------------------------
        # PANEL DE BÚSQUEDA
        # -----------------------------
        panel = tk.Frame(self.frame, bg=self.estilos.colores["fondo_panel"])
        self.estilos.estilo_panel(panel)
        panel.pack(fill="x", padx=20, pady=10)

        # Texto libre
        tk.Label(
            panel,
            text="Buscar:",
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"]
        ).grid(row=0, column=0, padx=5, pady=5)

        self.texto_var = tk.StringVar()
        tk.Entry(panel, textvariable=self.texto_var, width=25).grid(row=0, column=1, padx=5)

        # Categoría
        tk.Label(
            panel,
            text="Categoría:",
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"]
        ).grid(row=0, column=2, padx=5)

        self.categoria_var = tk.StringVar()
        categorias = ["cpu", "gpu", "placa madre", "ram", "ssd", "fuente", "case"]
        ttk.Combobox(panel, values=categorias, textvariable=self.categoria_var, width=18).grid(row=0, column=3, padx=5)

        # Marca
        tk.Label(
            panel,
            text="Marca:",
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"]
        ).grid(row=1, column=0, padx=5, pady=5)

        self.marca_var = tk.StringVar()
        tk.Entry(panel, textvariable=self.marca_var, width=25).grid(row=1, column=1, padx=5)

        # Precio mínimo
        tk.Label(
            panel,
            text="Precio mínimo:",
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"]
        ).grid(row=1, column=2, padx=5)

        self.min_precio_var = tk.StringVar()
        tk.Entry(panel, textvariable=self.min_precio_var, width=10).grid(row=1, column=3, padx=5)

        # Precio máximo
        tk.Label(
            panel,
            text="Precio máximo:",
            bg=self.estilos.colores["fondo_panel"],
            fg=self.estilos.colores["texto"]
        ).grid(row=1, column=4, padx=5)

        self.max_precio_var = tk.StringVar()
        tk.Entry(panel, textvariable=self.max_precio_var, width=10).grid(row=1, column=5, padx=5)

        # Botón buscar
        btn = tk.Button(panel, text="Buscar", command=self.ejecutar_busqueda)
        self.estilos.estilo_boton(btn)
        btn.grid(row=0, column=6, padx=10)

        # Botón mejores por rendimiento
        btn2 = tk.Button(panel, text="TOP rendimiento", command=self.buscar_top_rendimiento)
        self.estilos.estilo_boton(btn2)
        btn2.grid(row=1, column=6, padx=10)

        # -----------------------------
        # TABLA DE RESULTADOS
        # -----------------------------
        columnas = ("categoria", "nombre", "marca", "precio", "rendimiento")
        self.tabla = ttk.Treeview(self.frame, columns=columnas, show="headings")

        self.tabla.heading("categoria", text="Categoría")
        self.tabla.heading("nombre", text="Nombre")
        self.tabla.heading("marca", text="Marca")
        self.tabla.heading("precio", text="Precio")
        self.tabla.heading("rendimiento", text="Rendimiento")

        # Aplicar estilo si existe el método
        try:
            self.estilos.aplicar_tablas()
        except:
            pass

        self.tabla.pack(fill="both", expand=True, padx=20, pady=20)

        # Botón volver
        btn_volver = tk.Button(self.frame, text="Volver al menú", command=self.volver)
        self.estilos.estilo_boton(btn_volver)
        btn_volver.pack(pady=15)

    # --------------------------------------------------------
    # EJECUTAR BÚSQUEDA
    # --------------------------------------------------------
    def ejecutar_busqueda(self):
        texto = self.texto_var.get()
        categoria = self.categoria_var.get() or None
        marca = self.marca_var.get() or None

        try:
            min_precio = int(self.min_precio_var.get()) if self.min_precio_var.get() else None
        except:
            min_precio = None

        try:
            max_precio = int(self.max_precio_var.get()) if self.max_precio_var.get() else None
        except:
            max_precio = None

        resultados = buscar_avanzado(
            self.datos["componentes"],
            texto=texto,
            categoria=categoria,
            min_precio=min_precio,
            max_precio=max_precio,
            marca=marca
        )

        self.mostrar_tabla(resultados)

    # --------------------------------------------------------
    # TOP RENDIMIENTO
    # --------------------------------------------------------
    def buscar_top_rendimiento(self):
        resultados = mejores_por_rendimiento(self.datos["componentes"], top=10)
        self.mostrar_tabla(resultados)

    # --------------------------------------------------------
    # MOSTRAR TABLA
    # --------------------------------------------------------
    def mostrar_tabla(self, componentes):

        # Limpiar tabla
        for row in self.tabla.get_children():
            self.tabla.delete(row)

        if not componentes:
            messagebox.showinfo("Sin resultados", "No se encontraron componentes.")
            return

        # Mostrar datos
        for c in componentes:
            self.tabla.insert("", "end", values=(
                c.get("categoria", "").upper(),
                c.get("nombre", ""),
                c.get("marca", ""),
                formatear_precio(c.get("precio", 0)),
                c.get("rendimiento", "-")
            ))
