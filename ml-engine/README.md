# ml-engine — Motor de recomendación

**Módulo A · Dueño: Jack.** El contenido de `data/` lo llena el Módulo C (Marco).

Recibe un perfil de usuario y devuelve las laptops más compatibles, con un porcentaje y una
explicación. Ver el formato exacto en [../docs/arquitectura/contrato-motor.md](../docs/arquitectura/contrato-motor.md).

## Estructura prevista

```
ml-engine/
├── app.py              # FastAPI — modo servidor (local). Solo parsea y delega.
├── cli_entry.py        # Modo subproceso (producción). Lee stdin, escribe stdout.
├── recommender/
│   ├── __init__.py
│   ├── catalogo.py     # única pieza con I/O: carga laptops/actividades/software de data/
│   ├── perfilado.py    # clasificación supervisada del perfil (modelo .joblib entrenado)
│   ├── similitud.py    # traducción a specs ideales + similitud coseno + explicación
│   ├── scoring.py      # orquesta lo anterior; misma firma recomendar() de siempre
│   └── modelo_perfilado.joblib   # modelo entrenado, commiteado (ver entrenamiento/)
├── entrenamiento/       # genera el dataset sintético y entrena el modelo (se corre a mano)
├── data/               # catálogos JSON — hoy con datos SEMILLA, los reemplaza el Módulo C
│   ├── laptops.json
│   ├── accesorios.json
│   ├── kits.json
│   ├── actividades.json
│   └── software.json
├── notebooks/          # exploración de datos (curso de IA)
├── tests/
└── requirements.txt
```

## Punto de partida (histórico)

Se evaluó reutilizar `PC_EXPERT/src/recomendador_pro.py` y `compatibilidad.py`, pero resultaron
no ser aprovechables: son reglas 100% Python puro (sin scikit-learn) para armar PCs de escritorio
por piezas sueltas (socket de CPU, watts de fuente...), un dominio distinto al de recomendar
laptops completas por perfil. El motor se construyó desde cero siguiendo el diseño de
`docs/contexto-proyecto.md` §7-8 (clasificación supervisada + similitud coseno).

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
