# ventana_principal.py — Menú principal de PC EXPERT

import tkinter as tk
from tkinter import ttk

from .estilos import Estilos


class VentanaPrincipal:

    def __init__(self, root, cambiar_ventana_callback, tema="oscuro"):
        self.root = root
        self.cambiar_ventana = cambiar_ventana_callback

        # Cargar tema
        self.estilos = Estilos(tema)
        self.estilos.aplicar_global(self.root)

        # Configuración de la ventana principal
        self.root.title("PC EXPERT — Menú Principal")
        self.root.geometry("800x600")

        # Marco principal
        self.frame = tk.Frame(self.root, bg=self.estilos.colores["fondo"])
        self.frame.pack(expand=True, fill="both")

        self.crear_interfaz()

    # --------------------------------------------------------
    # CREAR INTERFAZ
    # --------------------------------------------------------
    def crear_interfaz(self):

        titulo = tk.Label(self.frame, text="PC EXPERT", font=("Inter", 26, "bold"))
        self.estilos.estilo_label(titulo)
        titulo.pack(pady=20)

        subtitulo = tk.Label(self.frame, text="Sistema profesional de armado y recomendación de PC")
        self.estilos.estilo_label(subtitulo)
        subtitulo.pack(pady=5)

        # -----------------------------------
        # BOTONES PRINCIPALES
        # -----------------------------------
        botones_frame = tk.Frame(self.frame, bg=self.estilos.colores["fondo"])
        botones_frame.pack(pady=40)

        self.boton_principal(botones_frame, "Recomendador por presupuesto",
                             lambda: self.cambiar_ventana("recomendador")).pack(pady=8)

        self.boton_principal(botones_frame, "Buscar componentes",
                             lambda: self.cambiar_ventana("busqueda")).pack(pady=8)

        self.boton_principal(botones_frame, "Armar PC (Builder)",
                             lambda: self.cambiar_ventana("builder")).pack(pady=8)

        self.boton_principal(botones_frame, "Analizar compatibilidad",
                             lambda: self.cambiar_ventana("compatibilidad")).pack(pady=8)

        # ❌ ESTE BOTÓN ROMPE EL PROGRAMA (la ventana no existe)
        # self.boton_principal(botones_frame, "Historial",
        #                      lambda: self.cambiar_ventana("historial")).pack(pady=8)

        # -----------------------------------
        # CAMBIO DE TEMA
        # -----------------------------------
        tema_label = tk.Label(self.frame, text="Tema visual:")
        self.estilos.estilo_label(tema_label)
        tema_label.pack(pady=10)

        tema_combo = ttk.Combobox(self.frame, values=["gamer", "oscuro", "profesional"])
        tema_combo.set("oscuro")
        tema_combo.pack()

        boton_tema = tk.Button(
            self.frame,
            text="Aplicar tema",
            command=lambda: self.cambiar_tema(tema_combo.get())
        )
        self.estilos.estilo_boton(boton_tema)
        boton_tema.pack(pady=10)

    # --------------------------------------------------------
    # BOTÓN PRINCIPAL (ESTILO UNIFICADO)
    # --------------------------------------------------------
    def boton_principal(self, parent, texto, comando):
        boton = tk.Button(parent, text=texto, command=comando, width=30)
        self.estilos.estilo_boton(boton)
        return boton

    # --------------------------------------------------------
    # CAMBIAR TEMA
    # --------------------------------------------------------
    def cambiar_tema(self, nuevo_tema):
        print(f"🎨 Cambiando tema a: {nuevo_tema}")

        self.estilos = Estilos(nuevo_tema)
        self.estilos.aplicar_global(self.root)

        # Recargar ventana
        for widget in self.root.winfo_children():
            widget.destroy()

        VentanaPrincipal(self.root, self.cambiar_ventana, nuevo_tema)
