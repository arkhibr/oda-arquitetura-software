"""Testes do carregamento e da validação do catálogo."""

import copy
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from hooks.catalogo import carregar_catalogo, oda_por_id, validar_catalogo  # noqa: E402

CATALOGO = carregar_catalogo(ROOT / "catalogo" / "odas.yml")


def minimo():
    return {
        "repositorios": {"repo-a": {"url": "https://github.com/x/repo-a", "commit": "abcdef1"}},
        "trilhas": [{"numero": 1, "titulo": "Fundamentos"}],
        "odas": [
            {"id": "00", "titulo": "A", "trilha": 1, "repositorio": "repo-a", "fontes": ["x"],
             "minutos": 60, "pre_requisitos": [], "objetivo": "Objetivo A.", "situacao": "planejada"},
            {"id": "01", "titulo": "B", "trilha": 1, "repositorio": "repo-a", "fontes": ["y"],
             "minutos": 45, "pre_requisitos": ["00"], "objetivo": "Objetivo B.", "situacao": "planejada"},
        ],
    }


class TestCatalogoReal(unittest.TestCase):
    def test_trinta_e_seis_odas_em_sete_trilhas(self):
        self.assertEqual(len(CATALOGO["odas"]), 36)
        self.assertEqual([t["numero"] for t in CATALOGO["trilhas"]], [1, 2, 3, 4, 5, 6, 7])

    def test_catalogo_real_valido(self):
        self.assertEqual(validar_catalogo(CATALOGO, ROOT / "docs"), [])

    def test_commits_de_referencia(self):
        commits = {n: r["commit"] for n, r in CATALOGO["repositorios"].items()}
        self.assertEqual(commits, {"frontend-react": "2179313", "net-minimal-api": "702145a",
                                   "aspire-aws": "50a5344"})

    def test_oda_por_id(self):
        self.assertEqual(oda_por_id(CATALOGO, "20")["repositorio"], "net-minimal-api")
        self.assertIsNone(oda_por_id(CATALOGO, "99"))


class TestValidacao(unittest.TestCase):
    def erros(self, catalogo, docs_dir=None):
        return validar_catalogo(catalogo, docs_dir)

    def test_minimo_valido(self):
        self.assertEqual(self.erros(minimo()), [])

    def test_id_duplicado(self):
        c = minimo()
        c["odas"][1]["id"] = "00"
        c["odas"][1]["pre_requisitos"] = []
        self.assertIn("ODA 00: identificador duplicado.", self.erros(c))

    def test_pre_requisito_inexistente(self):
        c = minimo()
        c["odas"][1]["pre_requisitos"] = ["07"]
        self.assertIn("ODA 01: pré-requisito 07 não existe.", self.erros(c))

    def test_pre_requisito_posterior_impede_ciclo(self):
        c = minimo()
        c["odas"][0]["pre_requisitos"] = ["01"]
        self.assertIn("ODA 00: pré-requisito 01 precisa ter identificador menor.", self.erros(c))

    def test_minutos_fora_da_faixa(self):
        c = minimo()
        c["odas"][0]["minutos"] = 120
        self.assertIn("ODA 00: minutos deve estar entre 45 e 90.", self.erros(c))

    def test_trilha_e_repositorio_desconhecidos(self):
        c = minimo()
        c["odas"][0]["trilha"] = 9
        c["odas"][0]["repositorio"] = "repo-z"
        erros = self.erros(c)
        self.assertIn("ODA 00: trilha 9 não existe.", erros)
        self.assertIn("ODA 00: repositório repo-z não existe.", erros)

    def test_situacao_invalida(self):
        c = minimo()
        c["odas"][0]["situacao"] = "pronta"
        self.assertIn("ODA 00: situação pronta inválida.", self.erros(c))

    def test_disponivel_exige_pagina_existente(self):
        c = minimo()
        c["odas"][0]["situacao"] = "disponivel"
        self.assertIn("ODA 00: situação disponivel exige o campo pagina.", self.erros(c))
        c["odas"][0]["pagina"] = "oda-00-a.md"
        with tempfile.TemporaryDirectory() as tmp:
            self.assertIn("ODA 00: página odas/oda-00-a.md não encontrada.", self.erros(c, Path(tmp)))
            (Path(tmp) / "odas").mkdir()
            (Path(tmp) / "odas" / "oda-00-a.md").write_text("# ODA 00 — A\n", encoding="utf-8")
            self.assertEqual(self.erros(c, Path(tmp)), [])

    def test_planejada_nao_pode_ter_pagina(self):
        c = minimo()
        c["odas"][0]["pagina"] = "oda-00-a.md"
        self.assertIn("ODA 00: situação planejada não admite o campo pagina.", self.erros(c))

    def test_campos_obrigatorios(self):
        c = copy.deepcopy(minimo())
        del c["odas"][0]["objetivo"]
        self.assertIn("ODA 00: campo objetivo ausente.", self.erros(c))


if __name__ == "__main__":
    unittest.main()
