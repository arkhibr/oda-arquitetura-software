"""Verifica a configuração estrutural do portal."""

from pathlib import Path
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]


class _Loader(yaml.SafeLoader):
    """Carregador que ignora tags Python usadas pelo pymdownx."""


_Loader.add_multi_constructor("tag:yaml.org,2002:python/", lambda *_: None)


def carregar_config():
    return yaml.load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"), Loader=_Loader)


class TestProjeto(unittest.TestCase):
    def test_hook_do_catalogo_registrado(self):
        self.assertEqual(carregar_config()["hooks"], ["hooks/catalogo.py"])

    def test_nucleo_carregado_como_modulo(self):
        scripts = carregar_config()["extra_javascript"]
        self.assertIn({"path": "assets/javascripts/oda/index.mjs", "type": "module"}, scripts)

    def test_specs_e_planos_fora_do_site(self):
        self.assertIn("superpowers/**", carregar_config()["exclude_docs"])

    def test_pagina_mestre_tem_marcador(self):
        texto = (ROOT / "docs/index.md").read_text(encoding="utf-8")
        self.assertIn("<!-- catalogo-odas -->", texto)

    def test_material_fixado(self):
        self.assertIn("mkdocs-material==9.7.6", (ROOT / "requirements.txt").read_text())


if __name__ == "__main__":
    unittest.main()
