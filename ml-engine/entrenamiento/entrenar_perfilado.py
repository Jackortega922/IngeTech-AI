"""Entrena el clasificador de perfil y lo serializa.

Se corre manualmente (no en cada request — el motor solo *carga* el resultado):

    cd ml-engine
    python -m entrenamiento.entrenar_perfilado

Regenera ``recommender/modelo_perfilado.joblib``.
"""

from __future__ import annotations

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

from entrenamiento.dataset_sintetico import generar
from recommender.catalogo import cargar_actividades
from recommender.perfilado import MODELO_PATH, featurizar


def main() -> None:
    actividades_idx = cargar_actividades()
    dataset = generar()

    x = [featurizar(fila, actividades_idx) for fila in dataset]
    y = [fila["categoria"] for fila in dataset]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.25, random_state=42, stratify=y
    )

    print("Entrenando clasificador de perfil...")
    modelo = LogisticRegression(max_iter=1000)
    modelo.fit(x_train, y_train)

    y_pred = modelo.predict(x_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")
    print(f"Accuracy: {accuracy:.2f} | F1-score: {f1:.2f}")

    print("Serializando modelo...")
    joblib.dump(modelo, MODELO_PATH)
    print(f"{MODELO_PATH.name} guardado ({MODELO_PATH.stat().st_size / 1024:.1f} KB)")
    print("Modelo listo para consumirse desde el motor")


if __name__ == "__main__":
    main()
