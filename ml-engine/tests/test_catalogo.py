"""Pruebas de la carga del catálogo (única pieza de recommender/ que hace I/O)."""

from recommender import catalogo


def test_cargar_laptops_devuelve_el_catalogo_semilla_real():
    laptops = catalogo.cargar_laptops()
    assert len(laptops) >= 6
    assert all("id" in laptop and "precio_soles" in laptop for laptop in laptops)


def test_cargar_actividades_indexa_por_clave():
    actividades = catalogo.cargar_actividades()
    assert "ia_ml" in actividades
    assert actividades["ia_ml"]["peso_gpu"] == 3


def test_cargar_software_indexa_por_clave():
    software = catalogo.cargar_software()
    assert "vscode" in software


def test_catalogo_ausente_devuelve_listas_vacias(tmp_path, monkeypatch):
    monkeypatch.setattr(catalogo, "DATA_DIR", tmp_path)
    assert catalogo.cargar_laptops() == []
    assert catalogo.cargar_actividades() == {}


def test_json_invalido_devuelve_lista_vacia(tmp_path, monkeypatch):
    (tmp_path / "laptops.json").write_text("{esto no es json valido", encoding="utf-8")
    monkeypatch.setattr(catalogo, "DATA_DIR", tmp_path)
    assert catalogo.cargar_laptops() == []
