"""El entrenamiento del clasificador es reproducible y el modelo guardado está al día."""

import os
import subprocess
import sys
from pathlib import Path

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

from entrenamiento.dataset_sintetico import _categoria_oraculo, generar
from recommender.catalogo import cargar_actividades
from recommender.perfilado import MODELO_PATH, featurizar

RAIZ = Path(__file__).resolve().parents[1]


def test_los_empates_se_resuelven_siempre_igual():
    # Diseño (más hardware) gana a programación; programación gana a ofimática.
    assert _categoria_oraculo(["programacion_web", "diseno_3d"]) == "disenador_creativo"
    assert _categoria_oraculo(["ofimatica", "programacion_web"]) == "desarrollador_software"
    assert _categoria_oraculo(["ia_ml", "edicion_video"]) == "cientifico_datos_ia"
    assert _categoria_oraculo([]) == "estudiante_general"


def test_el_dataset_es_el_mismo_en_cualquier_ejecucion():
    # Python cambia el hash de los textos en cada ejecución (PYTHONHASHSEED). Antes eso cambiaba
    # el desempate y con él las etiquetas, el modelo y sus métricas.
    codigo = (
        "from entrenamiento.dataset_sintetico import generar; "
        "print([f['categoria'] for f in generar()])"
    )
    salidas = {
        subprocess.run(
            [sys.executable, "-c", codigo],
            cwd=RAIZ,
            env={**os.environ, "PYTHONHASHSEED": semilla},
            capture_output=True,
            text=True,
            check=True,
        ).stdout
        for semilla in ("0", "1", "12345")
    }
    assert len(salidas) == 1


def test_el_modelo_guardado_esta_al_dia_con_el_catalogo():
    # Si cambian los pesos de actividades.json y no se reentrena, el modelo guardado ya no
    # coincide con uno entrenado hoy: hay que correr `python -m entrenamiento.entrenar_perfilado`.
    actividades = cargar_actividades()
    dataset = generar()
    x = [featurizar(fila, actividades) for fila in dataset]
    y = [fila["categoria"] for fila in dataset]
    x_train, x_test, y_train, _ = train_test_split(
        x, y, test_size=0.25, random_state=42, stratify=y
    )

    nuevo = LogisticRegression(max_iter=1000).fit(x_train, y_train)
    guardado = joblib.load(MODELO_PATH)

    assert list(guardado.predict(x_test)) == list(nuevo.predict(x_test))
