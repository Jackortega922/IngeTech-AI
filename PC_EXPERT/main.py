# main.py — Núcleo del programa PC EXPERT

import sys
import os
import tkinter as tk

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.cargar_datos import cargar_todos_los_datos
from src.gui.ventana_principal import VentanaPrincipal
from src.gui.ventana_recomendador import VentanaRecomendador
from src.gui.ventana_busqueda import VentanaBusqueda
from src.gui.ventana_compatibilidad import VentanaCompatibilidad
from src.gui.ventana_armado import VentanaArmado
from src.cargar_componentes import cargar_todos_los_componentes



class PCExpertApp:

    def __init__(self):
        # -------------- VENTANA PRINCIPAL --------------
        self.root = tk.Tk()
        self.root.title("PC EXPERT")
        self.root.geometry("900x600")

        # -------------- CARGA DE DATOS UNIFICADA --------------
        self.datos = cargar_todos_los_datos()

        # Tema actual
        self.tema_actual = "oscuro"

        # Mostrar menú principal
        self.mostrar_ventana_principal()

        self.root.mainloop()

    # --------------------------------------------------------
    # CAMBIO DE VENTANAS
    # --------------------------------------------------------
    def _limpiar_ventana(self):
        """Elimina widgets anteriores."""
        for widget in self.root.winfo_children():
            widget.destroy()

    def cambiar_ventana(self, ventana):
        """Control central para cambiar pantallas."""
        self._limpiar_ventana()

        if ventana == "menu":
            self.mostrar_ventana_principal()

        elif ventana == "recomendador":
            VentanaRecomendador(
                self.root,
                self.datos,
                volver_callback=lambda: self.cambiar_ventana("menu"),
                tema=self.tema_actual
            )

        elif ventana == "busqueda":
            VentanaBusqueda(
                self.root,
                self.datos,
                volver_callback=lambda: self.cambiar_ventana("menu"),
                tema=self.tema_actual
            )

        elif ventana == "compatibilidad":
            VentanaCompatibilidad(
                self.root,
                self.datos,
                volver_callback=lambda: self.cambiar_ventana("menu"),
                tema=self.tema_actual
            )

        elif ventana == "builder":
            VentanaArmado(
                self.root,
                self.datos,
                volver_callback=lambda: self.cambiar_ventana("menu"),
                tema=self.tema_actual
            )

    # --------------------------------------------------------
    # MENÚ PRINCIPAL
    # --------------------------------------------------------
    def mostrar_ventana_principal(self):
        self._limpiar_ventana()
        VentanaPrincipal(
            self.root,
            cambiar_ventana_callback=self.cambiar_ventana,
            tema=self.tema_actual
        )


# --------------------------------------------------------
# EJECUCIÓN
# --------------------------------------------------------
if __name__ == "__main__":
    PCExpertApp()
