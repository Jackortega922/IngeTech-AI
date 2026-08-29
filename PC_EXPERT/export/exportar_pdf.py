# exportar_pdf.py — Exporta configuraciones a PDF

from fpdf import FPDF
import os


class PDFExporter:

    def __init__(self, ruta_salida="pc_expert_resultado.pdf"):
        self.ruta_salida = ruta_salida

        # Crear PDF
        self.pdf = FPDF()
        self.pdf.add_page()
        self.pdf.set_auto_page_break(auto=True, margin=10)

        # Título general
        self.pdf.set_font("Arial", "B", 18)
        self.pdf.cell(0, 10, "PC EXPERT — Configuración de PC", 0, 1, "C")
        self.pdf.ln(10)

    # --------------------------------------------------------
    # AGREGAR SECCIÓN
    # --------------------------------------------------------

    def agregar_seccion(self, titulo):
        self.pdf.set_font("Arial", "B", 14)
        self.pdf.set_text_color(0, 128, 255)
        self.pdf.cell(0, 10, titulo, 0, 1)
        self.pdf.set_text_color(0, 0, 0)

    # --------------------------------------------------------
    # AGREGAR TEXTO
    # --------------------------------------------------------

    def agregar_linea(self, texto):
        self.pdf.set_font("Arial", "", 12)
        self.pdf.multi_cell(0, 8, texto)

    # --------------------------------------------------------
    # EXPORTAR CONFIGURACIÓN COMPLETA
    # --------------------------------------------------------

    def exportar_pc(self, pc_dict):
        """
        Recibe una PC final armada en formato dict:
            {
                "cpu": {...},
                "placa madre": {...},
                "ram": {...},
                ...
                "precio_total": 3999
            }
        """

        self.agregar_seccion("Componentes Seleccionados")

        for categoria, comp in pc_dict.items():
            if categoria == "precio_total":
                continue

            nombre = comp.get("nombre", "—")
            precio = comp.get("precio", 0)

            linea = f"{categoria.upper()}: {nombre} — S/ {precio}"
            self.agregar_linea(linea)

        self.pdf.ln(5)
        self.agregar_seccion("Precio Total")
        self.agregar_linea(f"S/ {pc_dict['precio_total']}")

        self.pdf.output(self.ruta_salida)
        return self.ruta_salida
