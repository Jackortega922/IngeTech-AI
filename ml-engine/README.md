# ml-engine — Motor de recomendación

**Módulo A · Dueño: Jack.** El contenido de `data/` lo llena el Módulo C (Diego).

Recibe un perfil de usuario y devuelve las laptops más compatibles, con un porcentaje y una
explicación. Ver el formato exacto en [../docs/arquitectura/contrato-motor.md](../docs/arquitectura/contrato-motor.md).

## Estructura prevista

```
ml-engine/
├── app.py              # FastAPI — modo servidor (local). Solo parsea y delega.
├── cli_entry.py        # Modo subproceso (producción). Lee stdin, escribe stdout.
├── recommender/
│   ├── __init__.py
│   ├── scoring.py      # cálculo del % de compatibilidad (funciones puras, sin I/O)
│   ├── compatibilidad.py   # reglas de compatibilidad (adaptado de PC_EXPERT)
│   └── catalogo.py     # carga y normaliza el catálogo
├── data/               # catálogos JSON — los mantiene el Módulo C
│   ├── laptops.json
│   ├── accesorios.json
│   ├── kits.json
│   ├── actividades.json
│   └── software.json
├── notebooks/          # exploración de datos (curso de IA)
├── tests/
└── requirements.txt
```

## Punto de partida

`PC_EXPERT/src/recomendador_pro.py` y `PC_EXPERT/src/compatibilidad.py` tienen lógica reutilizable
(funciones puras de scoring y compatibilidad). Hay que adaptarlas: PC_EXPERT arma PCs de piezas y
recomienda **solo por presupuesto**; aquí se recomiendan laptops completas y **por perfil**.

## Desarrollo

```bash
# dentro del contenedor
docker compose exec ml-engine uvicorn app:app --reload --host 0.0.0.0 --port 5001
docker compose exec ml-engine pytest -q
docker compose exec ml-engine ruff check .

# modo CLI (como en producción)
echo '{"perfil": {...}}' | docker compose exec -T ml-engine python cli_entry.py
```

Swagger en http://localhost:5001/docs
