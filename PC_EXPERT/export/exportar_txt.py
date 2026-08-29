# exportar_txt.py — Exportación básica a TXT

import os

def exportar_pc_txt(pc_dict, ruta="pc_expert_resultado.txt"):
    with open(ruta, "w", encoding="utf-8") as f:

        f.write("PC EXPERT — Configuración de PC\n")
        f.write("=================================\n\n")

        for categoria, comp in pc_dict.items():
            if categoria == "precio_total":
                continue

            nombre = comp.get("nombre", "—")
            precio = comp.get("precio", 0)
            f.write(f"{categoria.upper()}: {nombre} — S/ {precio}\n")

        f.write("\nPRECIO TOTAL: S/ " + str(pc_dict["precio_total"]) + "\n")

    return ruta
