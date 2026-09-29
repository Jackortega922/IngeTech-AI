"""Afinidad entre la laptop y la persona, a partir del cuestionario de bienvenida (Psicología).

La similitud coseno (``similitud.py``) mide si la laptop tiene la potencia que piden las
actividades. Esto mide otra cosa: si encaja con **cómo es la persona** — si la llevará a
diario, si trabaja lejos de un enchufe, qué le molesta de su computadora actual, cuántos años
espera que le dure, qué conecta, qué valora más y qué marcas prefiere o evita.

Cada respuesta se convierte en uno o más **criterios** con un puntaje 0-1 por laptop. La
afinidad es el promedio ponderado de esos puntajes; el orden de prioridades del cliente sube
el peso de los criterios que eligió primero. Cada criterio deja un texto explicativo, así la
recomendación dice *por qué* (transparencia, RF-ET1) y avisa cuando algo no encaja.

Funciones puras: reciben la laptop y las preferencias ya cargadas.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

# Peso de la afinidad en la compatibilidad final: 70% técnica (coseno), 30% la persona.
PESO_AFINIDAD = 0.3

# Peso extra según el puesto en "¿qué valoras más?" (1.º, 2.º, 3.º...).
PESO_POR_PUESTO = [3.0, 2.0, 1.5, 1.0, 0.5]


@dataclass
class Criterio:
    clave: str
    puntaje: float  # 0-1: qué tan bien cumple la laptop
    peso: float
    bien: str  # texto si cumple
    mal: str | None = None  # advertencia si no cumple (None = no avisar)


def _peso_kg(laptop: dict[str, Any]) -> float | None:
    return laptop.get("peso_kg")


def _puntaje_ligera(laptop: dict[str, Any], exigente: bool) -> float | None:
    kg = _peso_kg(laptop)
    if kg is None:
        return None
    if exigente:  # la lleva a diario
        return 1.0 if kg < 1.5 else 0.5 if kg <= 2.0 else 0.0
    return 1.0 if kg <= 2.0 else 0.6 if kg <= 2.3 else 0.3


def _puntaje_bateria(laptop: dict[str, Any], exigente: bool) -> float | None:
    h = laptop.get("bateria_horas")
    if h is None:
        return None
    if exigente:  # muchas horas lejos del enchufe
        return 1.0 if h >= 10 else 0.8 if h >= 8 else 0.4 if h >= 6 else 0.0
    return 1.0 if h >= 6 else 0.6 if h >= 4 else 0.3


def _puntaje_futuro(laptop: dict[str, Any]) -> float:
    """Qué tan preparada está para durar años: RAM de sobra, ampliable y buen procesador."""
    ram = laptop.get("ram_gb", 0)
    ampliable = laptop.get("ram_ampliable_gb") or ram
    cpu = laptop.get("cpu_score", 0)
    return (
        (0.5 if ram >= 16 else 0.0)
        + (0.25 if ampliable > ram else 0.0)
        + (0.25 if cpu >= 60 else 0.0)
    )


def _puntaje_pantalla(laptop: dict[str, Any]) -> float | None:
    pulgadas = laptop.get("pantalla_pulgadas")
    if pulgadas is None:
        return None
    ancho = int((laptop.get("pantalla_resolucion") or "0x0").split("x")[0] or 0)
    hz = laptop.get("pantalla_hz") or 60
    return 1.0 if (ancho > 1920 or hz >= 120) else 0.6 if ancho >= 1920 else 0.2


def criterios_para(
    laptop: dict[str, Any], pref: dict[str, Any], precio_rango: tuple[float, float]
) -> list[Criterio]:
    """Traduce las respuestas del cuestionario en criterios medibles sobre esta laptop."""
    crit: list[Criterio] = []
    molestias = set(pref.get("molestias") or [])
    kg = _peso_kg(laptop)
    horas = laptop.get("bateria_horas")
    puertos = set(laptop.get("puertos") or [])

    # Movilidad / "pesa mucho"
    movilidad = pref.get("movilidad")
    if movilidad in ("diario", "a_veces") or "pesada" in molestias:
        exigente = movilidad == "diario" or "pesada" in molestias
        p = _puntaje_ligera(laptop, exigente)
        if p is not None:
            crit.append(
                Criterio(
                    "portabilidad",
                    p,
                    1.0,
                    f"Ligera para llevarla contigo ({kg} kg)",
                    f"Pesa {kg} kg y dijiste que la llevarás contigo seguido" if p < 0.5 else None,
                )
            )

    # Lejos del enchufe / "la batería dura poco"
    enchufe = pref.get("lejos_enchufe")
    if enchufe in ("muchas_horas", "a_veces") or "bateria_corta" in molestias:
        exigente = enchufe == "muchas_horas" or "bateria_corta" in molestias
        p = _puntaje_bateria(laptop, exigente)
        if p is not None:
            crit.append(
                Criterio(
                    "bateria",
                    p,
                    1.0,
                    f"Batería de {horas} h para trabajar lejos del enchufe",
                    f"Su batería ({horas} h) puede quedarse corta para lo que nos contaste"
                    if p < 0.5
                    else None,
                )
            )

    # Molestias con la computadora actual
    if "se_congela" in molestias:
        p = 1.0 if laptop.get("ram_gb", 0) >= 16 else 0.3
        crit.append(
            Criterio(
                "ram_fluidez",
                p,
                1.5,
                f"{laptop.get('ram_gb')} GB de RAM: no se congela con muchas pestañas",
                (
                    "Con 8 GB podría volver a congelarse con muchas pestañas, "
                    "como tu computadora actual"
                )
                if p < 0.5
                else None,
            )
        )
    if "lenta_al_encender" in molestias:
        es_ssd = "SSD" in str(laptop.get("almacenamiento_tipo", "")).upper()
        p = 1.0 if es_ssd else 0.0
        crit.append(
            Criterio(
                "arranque",
                p,
                1.0,
                "Disco SSD: enciende y abre programas en segundos",
                None if es_ssd else "No tiene SSD: podría tardar en encender",
            )
        )
    if "pantalla_pequena" in molestias and laptop.get("pantalla_pulgadas"):
        pulgadas = laptop["pantalla_pulgadas"]
        p = 1.0 if pulgadas >= 15 else 0.6 if pulgadas >= 14 else 0.2
        crit.append(
            Criterio(
                "pantalla_grande",
                p,
                1.0,
                f'Pantalla amplia de {pulgadas}"',
                f'Su pantalla ({pulgadas}") es pequeña, algo que te molesta hoy'
                if p < 0.5
                else None,
            )
        )

    # Años de uso esperados
    anios = pref.get("anios_uso")
    if anios in ("3_4", "5_mas"):
        p = (
            _puntaje_futuro(laptop)
            if anios == "5_mas"
            else (1.0 if laptop.get("ram_gb", 0) >= 16 else 0.6)
        )
        crit.append(
            Criterio(
                "durabilidad",
                p,
                1.0,
                "Preparada para durarte varios años",
                "Para tantos años de uso, podría quedarse corta más adelante" if p < 0.5 else None,
            )
        )

    # Lo que va a conectar
    perifericos = set(pref.get("perifericos") or [])
    if perifericos & {"monitor", "proyector"}:
        p = 1.0 if "hdmi" in puertos else 0.6 if "thunderbolt" in puertos else 0.2
        crit.append(
            Criterio(
                "hdmi",
                p,
                1.0,
                "Tiene HDMI para tu monitor o proyector",
                "No tiene HDMI: necesitarás un adaptador para el monitor o proyector"
                if p < 1.0
                else None,
            )
        )
    if "muchas_usb" in perifericos:
        p = 1.0 if "usb_a" in puertos else 0.3
        crit.append(
            Criterio(
                "usb",
                p,
                0.7,
                "Puertos USB comunes para tus memorias y periféricos",
                None
                if p == 1.0
                else "No tiene USB-A: necesitarás un adaptador para memorias y mouse comunes",
            )
        )
    if "camara_sd" in perifericos:
        p = 1.0 if "lector_sd" in puertos else 0.2
        crit.append(
            Criterio(
                "lector_sd",
                p,
                0.7,
                "Lector de tarjetas SD para tu cámara",
                None if p == 1.0 else "No tiene lector SD: necesitarás un adaptador para tu cámara",
            )
        )

    # Marcas: la preferida suma; la que se evita se descarta antes (ver filtrar_marcas).
    preferidas = set(pref.get("marcas_preferidas") or [])
    if preferidas:
        es_preferida = laptop.get("marca") in preferidas
        crit.append(
            Criterio(
                "marca",
                1.0 if es_preferida else 0.4,
                0.7,
                f"Es de {laptop.get('marca')}, una marca que prefieres",
            )
        )

    # Prioridades: suben el peso de lo que la persona puso primero, y agregan criterios de
    # precio, rendimiento y diseño si los priorizó.
    prioridades = pref.get("prioridades") or []
    for puesto, prioridad in enumerate(prioridades[: len(PESO_POR_PUESTO)]):
        extra = PESO_POR_PUESTO[puesto]
        if prioridad == "precio":
            barato, caro = precio_rango
            precio = laptop.get("precio_soles", 0)
            p = 1.0 if caro == barato else 1 - (precio - barato) / (caro - barato)
            crit.append(Criterio("precio", p, extra, "Buen precio frente a las demás opciones"))
        elif prioridad == "rendimiento":
            p = min(laptop.get("cpu_score", 0) / 90, 1.0)
            crit.append(Criterio("rendimiento", p, extra, "Procesador rápido, como pediste"))
        elif prioridad == "diseno":
            p = _puntaje_pantalla(laptop)
            if p is not None:
                crit.append(Criterio("diseno", p, extra, "Pantalla de buena calidad"))
        elif prioridad == "portabilidad":
            p = _puntaje_ligera(laptop, exigente=True)
            if p is not None:
                crit.append(
                    Criterio(
                        "portabilidad_prioridad", p, extra, f"Ligera ({kg} kg), lo que más valoras"
                    )
                )
        elif prioridad == "durabilidad":
            crit.append(
                Criterio(
                    "durabilidad_prioridad",
                    _puntaje_futuro(laptop),
                    extra,
                    "Pensada para durar, lo que más valoras",
                )
            )

    return crit


def filtrar_marcas(
    laptops: list[dict[str, Any]], pref: dict[str, Any], minimo: int
) -> list[dict[str, Any]]:
    """Quita las marcas que la persona quiere evitar, salvo que no queden suficientes opciones."""
    evitar = set(pref.get("marcas_evitar") or [])
    if not evitar:
        return laptops
    restantes = [laptop for laptop in laptops if laptop.get("marca") not in evitar]
    return restantes if len(restantes) >= minimo else laptops


def afinidad(
    laptop: dict[str, Any], pref: dict[str, Any], precio_rango: tuple[float, float]
) -> dict[str, Any] | None:
    """Afinidad 0-1 de la laptop con la persona, con sus factores y advertencias.

    Devuelve None si las preferencias no generan ningún criterio (cuestionario vacío u omitido):
    en ese caso la recomendación queda igual que sin cuestionario.
    """
    criterios = criterios_para(laptop, pref, precio_rango)
    if not criterios:
        return None

    peso_total = sum(c.peso for c in criterios)
    valor = sum(c.puntaje * c.peso for c in criterios) / peso_total

    return {
        "valor": valor,
        # Solo lo que de verdad cumple se presenta como motivo, con su aporte relativo.
        "factores": [
            {"criterio": c.bien, "peso_relativo": (c.puntaje * c.peso) / peso_total}
            for c in sorted(criterios, key=lambda c: c.puntaje * c.peso, reverse=True)
            if c.puntaje >= 0.6
        ],
        "advertencias": [c.mal for c in criterios if c.mal and c.puntaje < 0.6],
        "marca_evitada": laptop.get("marca") in set(pref.get("marcas_evitar") or []),
    }
