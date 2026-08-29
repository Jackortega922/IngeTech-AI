"""Prueba mínima para que el CI tenga algo que ejecutar desde el primer commit.
Bórrala cuando existan pruebas reales del scoring."""

import recommender


def test_paquete_importa():
    assert recommender.__version__ == "0.0.0"
