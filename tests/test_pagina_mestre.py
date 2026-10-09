"""Testes da geração da página mestre e do cabeçalho das ODAs."""

from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from hooks.catalogo import (carregar_catalogo, formatar_horas, oda_por_id,  # noqa: E402
                            renderizar_cabecalho, renderizar_indice)

CATALOGO = carregar_catalogo(ROOT / "catalogo" / "odas.yml")


class TestPaginaMestre(unittest.TestCase):
    def setUp(self):
        self.html = renderizar_indice(CATALOGO)

    def test_sete_trilhas_como_titulos_markdown(self):
        self.assertEqual(self.html.count("\n## Trilha "), 7)
        self.assertIn("## Trilha 6 — Back-end .NET", self.html)

    def test_uma_linha_por_oda(self):
        self.assertEqual(self.html.count("<tr data-repositorio="), 36)

    def test_planejada_sem_link(self):
        self.assertIn('data-situacao="planejada"', self.html)
        self.assertNotIn('href="oda-00', self.html)

    def test_disponivel_com_link_relativo(self):
        catalogo = {**CATALOGO, "odas": [dict(o) for o in CATALOGO["odas"]]}
        oda = oda_por_id(catalogo, "02")
        oda.update(situacao="disponivel", pagina="oda-02-fsd-fronteiras.md")
        self.assertIn('<a href="oda-02-fsd-fronteiras/">', renderizar_indice(catalogo))

    def test_totais(self):
        self.assertIn("36 ODAs", self.html)
        self.assertIn("2 ODAs · 1,8 h", self.html)

    def test_tabela_sem_classe_para_receber_estilo_do_material(self):
        self.assertEqual(self.html.count('<div class="oda-catalogo__tabela"><table>'), 7)
        self.assertNotIn("<table class=", self.html)

    def test_filtro_antes_da_primeira_trilha(self):
        self.assertLess(self.html.index('data-oda="filtro-catalogo"'), self.html.index("## Trilha 1"))

    def test_titulos_escapados(self):
        catalogo = {**CATALOGO, "odas": [dict(o) for o in CATALOGO["odas"]]}
        catalogo["odas"][0]["titulo"] = "<script>alert(1)</script>"
        html = renderizar_indice(catalogo)
        self.assertNotIn("<script>alert", html)
        self.assertIn("&lt;script&gt;", html)

    def test_formatar_horas(self):
        self.assertEqual(formatar_horas(105), "1,8 h")
        self.assertEqual(formatar_horas(60), "1,0 h")


class TestCabecalho(unittest.TestCase):
    def test_cabecalho_da_oda_20(self):
        html = renderizar_cabecalho(CATALOGO, oda_por_id(CATALOGO, "20"))
        self.assertIn('class="oda-cabecalho"', html)
        self.assertIn("Trilha 6 — Back-end .NET", html)
        self.assertIn("75 min", html)
        self.assertIn("https://github.com/arkhibr/net-minimal-api/tree/702145a", html)
        self.assertIn("ODA 19 (planejada)", html)

    def test_pre_requisito_disponivel_tem_link(self):
        catalogo = {**CATALOGO, "odas": [dict(o) for o in CATALOGO["odas"]]}
        oda_por_id(catalogo, "19").update(situacao="disponivel", pagina="oda-19-clean.md")
        html = renderizar_cabecalho(catalogo, oda_por_id(catalogo, "20"))
        self.assertIn('<a href="../oda-19-clean/">ODA 19', html)

    def test_sem_pre_requisitos(self):
        html = renderizar_cabecalho(CATALOGO, oda_por_id(CATALOGO, "16"))
        self.assertIn("<dd>Nenhum</dd>", html)


if __name__ == "__main__":
    unittest.main()
