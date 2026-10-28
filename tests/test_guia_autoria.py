"""Integração da ODA de autoria com o gerador e os tipos do motor."""
import sys
import tempfile
import unittest
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from gerar_odas import gerar, OBRIGATORIOS


class GuiaAutoriaTest(unittest.TestCase):
    def test_gera_guia_com_todos_os_componentes(self):
        dados = yaml.safe_load((ROOT / 'guia-autoria' / 'oda.yml').read_text())
        tipos = {b['tipo'] for a in dados['abas'] for b in a['blocos']}
        self.assertEqual(set(OBRIGATORIOS) - tipos, set())
        with tempfile.TemporaryDirectory() as destino:
            self.assertEqual(gerar(ROOT, Path(destino)), [])
            self.assertTrue((Path(destino) / 'oda-criar' / 'index.html').exists())
