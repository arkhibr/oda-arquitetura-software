"""Testes do gerador das ODAs no formato de aplicação."""

import copy
import json
from pathlib import Path
import re
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

from hooks.catalogo import carregar_catalogo  # noqa: E402
from gerar_odas import ABAS, html_da_oda, preparar, validar_oda  # noqa: E402

CATALOGO = carregar_catalogo(ROOT / "catalogo" / "odas.yml")


def minima():
    abas = [{"id": a, "titulo": a.title(), "blocos": [{"tipo": "legenda", "texto": "Texto curto."}]} for a in ABAS]
    abas[6]["blocos"].append({"tipo": "quiz", "perguntas": [{"enunciado": "P?", "alternativas": [
        {"texto": "a", "correta": True, "explicacao": "x"}, {"texto": "b", "correta": False, "explicacao": "y"}]}]})
    return {"id": "20", "titulo": "Vertical Slice e comparativo com Clean Architecture", "abas": abas}


class TestValidacao(unittest.TestCase):
    def erros(self, dados):
        return validar_oda(dados, CATALOGO)

    def test_minima_valida(self):
        self.assertEqual(self.erros(minima()), [])

    def test_abas_fora_da_ordem(self):
        d = minima()
        d["abas"][0], d["abas"][1] = d["abas"][1], d["abas"][0]
        self.assertIn(f"As abas devem ser, nesta ordem: {', '.join(ABAS)}.", self.erros(d))

    def test_titulo_diferente_do_catalogo(self):
        d = minima()
        d["titulo"] = "Outro"
        self.assertIn("Título difere do catálogo: Vertical Slice e comparativo com Clean Architecture.", self.erros(d))

    def test_tipo_desconhecido(self):
        d = minima()
        d["abas"][0]["blocos"].append({"tipo": "roleta"})
        self.assertIn("missao[1]: tipo de bloco desconhecido: roleta.", self.erros(d))

    def test_propriedade_obrigatoria(self):
        d = minima()
        d["abas"][1]["blocos"].append({"tipo": "conceito", "titulo": "X"})
        self.assertIn("conceito[1]: conceito exige a propriedade texto.", self.erros(d))

    def test_legenda_com_mais_de_tres_frases(self):
        d = minima()
        d["abas"][0]["blocos"][0]["texto"] = "Um. Dois. Três. Quatro."
        self.assertIn("missao[0]: legenda passa de três frases.", self.erros(d))

    def test_editor_arquivo_exige_commit_do_catalogo(self):
        d = minima()
        d["abas"][2]["blocos"].append({"tipo": "editor", "rotulo": "arquivo", "caminho": "Program.cs", "commit": "aaaaaaa", "linhas": ["x"]})
        self.assertIn("codigo[1]: editor de arquivo cita o commit aaaaaaa, e o catálogo fixa 702145a.", self.erros(d))

    def test_terminal_exige_origem_valida(self):
        d = minima()
        d["abas"][4]["blocos"].append({"tipo": "terminal", "comandos": [{"entrada": "ls", "saida": "a", "origem": "inventado"}]})
        self.assertIn("laboratorio[1]: comando 1 com origem inválida: inventado.", self.erros(d))

    def test_console_api_exige_origem(self):
        d = minima()
        d["abas"][3]["blocos"].append({"tipo": "console-api", "cenarios": [{"rotulo": "x", "requisicao": {"metodo": "GET", "url": "/"}, "resposta": {"status": 200}}]})
        self.assertIn("simulacao[1]: cenário 1 com origem inválida: None.", self.erros(d))

    def test_incidente_exige_uma_correta(self):
        d = minima()
        d["abas"][5]["blocos"].append({"tipo": "incidente", "titulo": "t", "saida": "s", "origem": "executado", "pergunta": "p", "correcao": "c",
                                      "alternativas": [{"texto": "a", "correta": False, "explicacao": "x"}, {"texto": "b", "correta": False, "explicacao": "y"}]})
        self.assertIn("diagnostico[1]: incidente deve ter exatamente uma alternativa correta.", self.erros(d))

    def test_faixa_de_erro_exige_campos(self):
        d = minima()
        d["abas"][4]["blocos"].append({"tipo": "faixa", "estilo": "erro", "sintoma": "s"})
        self.assertIn("laboratorio[1]: faixa de erro exige sintoma, causa e correcao.", self.erros(d))

    def test_passos_validam_editor_aninhado(self):
        d = minima()
        d["abas"][4]["blocos"].append({"tipo": "passos", "itens": [{"titulo": "t", "editor": {"rotulo": "arquivo", "caminho": "a", "linhas": ["x"]}}]})
        self.assertIn("laboratorio[1].passo 1: editor de arquivo exige caminho e commit.", self.erros(d))


class TestGeracao(unittest.TestCase):
    def test_preparar_atribui_ids_e_renomeia(self):
        d = minima()
        d["abas"][1]["blocos"].append({"tipo": "adr", "id": "ADR-0001", "titulo": "t", "status": "accepted", "contexto": "c", "decisao": "d", "alternativas": "a", "consequencias": "q"})
        p = preparar(copy.deepcopy(d))
        self.assertEqual(p["abas"][1]["blocos"][1]["id"], "conceito-1")
        self.assertEqual(p["abas"][1]["blocos"][1]["id_adr"], "ADR-0001")

    def test_html_escapa_fechamento_de_script(self):
        d = preparar(minima())
        d.update(repositorio="net-minimal-api", commit="702145a", minutos=75)
        d["abas"][0]["blocos"][0]["texto"] = "</script><img src=x onerror=alert(1)>"
        html = html_da_oda(d)
        bloco = re.search(r'<script id="oda-dados" type="application/json">(.*?)</script>', html, re.S).group(1)
        self.assertEqual(json.loads(bloco)["abas"][0]["blocos"][0]["texto"], "</script><img src=x onerror=alert(1)>")
        self.assertNotIn("</script><img", html)

    def test_html_referencia_motor(self):
        d = preparar(minima())
        d.update(repositorio="net-minimal-api", commit="702145a", minutos=75)
        html = html_da_oda(d)
        self.assertIn('<link rel="stylesheet" href="../motor/oda.css">', html)
        self.assertIn("import { iniciar } from '../motor/app.mjs'", html)


if __name__ == "__main__":
    unittest.main()
