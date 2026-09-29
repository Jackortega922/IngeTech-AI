"""Motor de recomendación — modo servidor (desarrollo local).

Solo expone HTTP y delega en ``recommender.scoring.recomendar``. Nada de lógica aquí.
En producción se usa ``cli_entry.py`` en su lugar (ver ADR 0003).
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field

from recommender.scoring import recomendar

app = FastAPI(title="IngeTech AI — Motor de recomendación", version="0.0.0")


class Preferencias(BaseModel):
    """Cuestionario de bienvenida (opcional), ver docs/arquitectura/contrato-motor.md."""

    movilidad: str | None = None
    lejos_enchufe: str | None = None
    molestias: list[str] = Field(default_factory=list)
    anios_uso: str | None = None
    prioridades: list[str] = Field(default_factory=list)
    marcas_preferidas: list[str] = Field(default_factory=list)
    marcas_evitar: list[str] = Field(default_factory=list)
    perifericos: list[str] = Field(default_factory=list)


class Perfil(BaseModel):
    carrera: str = ""
    nivel_experiencia: str = "basico"
    actividades: list[str] = Field(default_factory=list)
    software: list[str] = Field(default_factory=list)
    presupuesto_soles: float | None = None
    # Sin este campo, FastAPI descartaba las preferencias en silencio en el modo HTTP, mientras
    # que el modo CLI (producción) sí las pasaba: los dos modos deben recibir lo mismo.
    preferencias: Preferencias | None = None


class Opciones(BaseModel):
    top_n: int = 3


class SolicitudRecomendacion(BaseModel):
    perfil: Perfil
    opciones: Opciones = Field(default_factory=Opciones)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recomendar")
def post_recomendar(solicitud: SolicitudRecomendacion) -> dict:
    return recomendar(solicitud.model_dump())
