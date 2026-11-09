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
from gerar_odas import ABAS, COMO_OBTER, ONDE, html_da_oda, preparar, validar_oda  # noqa: E402

CATALOGO = carregar_catalogo(ROOT / "catalogo" / "odas.yml")


def minima():
    abas = [{"id": a, "titulo": a.title(), "blocos": [{"tipo": "legenda", "texto": "Texto curto."}]} for a in ABAS]
    abas[5]["blocos"].append({"tipo": "quiz", "perguntas": [{"enunciado": "P?", "alternativas": [
        {"texto": "a", "correta": True, "explicacao": "x"}, {"texto": "b", "correta": False, "explicacao": "y"}]}]})
    abas[0]["blocos"] = [{"tipo": "glossario", "itens": [{"termo": "API", "definicao": "Interface de programação."}]},
                         {"tipo": "faixa", "estilo": "dica", "titulo": COMO_OBTER, "texto": "Clone o repositório."}]
    abas[3]["blocos"] = [{"tipo": "faixa", "estilo": "objetivo", "problema": "p", "impacto": "i", "mecanismo": "m", "comprovacao": "c"}]
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
        self.assertIn("objetivos[2]: tipo de bloco desconhecido: roleta.", self.erros(d))

    def test_propriedade_obrigatoria(self):
        d = minima()
        d["abas"][1]["blocos"].append({"tipo": "conceito", "titulo": "X"})
        self.assertIn("conceito[1]: conceito exige a propriedade texto.", self.erros(d))

    def test_legenda_com_mais_de_tres_frases(self):
        d = minima()
        d["abas"][1]["blocos"][0]["texto"] = "Um. Dois. Três. Quatro."
        self.assertIn("conceito[0]: legenda passa de três frases.", self.erros(d))

    def test_editor_arquivo_exige_commit_do_catalogo(self):
        d = minima()
        d["abas"][1]["blocos"].append({"tipo": "editor", "rotulo": "arquivo", "caminho": "Program.cs", "commit": "aaaaaaa", "linhas": ["x"]})
        self.assertIn("conceito[1]: editor de arquivo cita o commit aaaaaaa, e o catálogo fixa 702145a.", self.erros(d))

    def test_terminal_exige_origem_valida(self):
        d = minima()
        d["abas"][3]["blocos"].append({"tipo": "terminal", "comandos": [{"entrada": "ls", "saida": "a", "origem": "inventado"}]})
        self.assertIn("laboratorio[1]: comando 1 com origem inválida: inventado.", self.erros(d))

    def test_console_api_exige_origem(self):
        d = minima()
        d["abas"][2]["blocos"].append({"tipo": "console-api", "cenarios": [{"rotulo": "x", "requisicao": {"metodo": "GET", "url": "/"}, "resposta": {"status": 200}}]})
        self.assertIn("simulacao[1]: cenário 1 com origem inválida: None.", self.erros(d))

    def test_incidente_exige_uma_correta(self):
        d = minima()
        d["abas"][4]["blocos"].append({"tipo": "incidente", "titulo": "t", "saida": "s", "origem": "executado", "pergunta": "p", "correcao": "c",
                                      "alternativas": [{"texto": "a", "correta": False, "explicacao": "x"}, {"texto": "b", "correta": False, "explicacao": "y"}]})
        self.assertIn("diagnostico[1]: incidente deve ter exatamente uma alternativa correta.", self.erros(d))

    def test_faixa_de_erro_exige_campos(self):
        d = minima()
        d["abas"][3]["blocos"].append({"tipo": "faixa", "estilo": "erro", "sintoma": "s"})
        self.assertIn("laboratorio[1]: faixa de erro exige sintoma, causa e correcao.", self.erros(d))

    def test_passos_validam_editor_aninhado(self):
        d = minima()
        d["abas"][3]["blocos"].append({"tipo": "passos", "itens": [{"titulo": "t", "editor": {"rotulo": "arquivo", "caminho": "a", "linhas": ["x"]}}]})
        self.assertIn("laboratorio[1].passo 1: editor de arquivo exige caminho e commit.", self.erros(d))

    def test_validacoes_aninhadas(self):
        casos = [
            (2, {"tipo": "classificador", "categorias": [{"id": "a", "rotulo": "A"}], "itens": [{"texto": "t", "categoria": "x", "explicacao": "e"}]},
             "simulacao[1]: item 1 do classificador usa categoria inexistente: x."),
            (3, {"tipo": "terminal", "comandos": [{"entrada": "ls", "saida": "", "origem": "exemplo"}], "cenarios": [{"rotulo": "r", "comando": "pwd"}]},
             "laboratorio[1]: cenário 1 do terminal usa comando não declarado: pwd."),
            (1, {"tipo": "editor", "rotulo": "terminal", "linhas": ["a"], "anotacoes": [{"linha": 9, "texto": "x"}]},
             "conceito[1]: anotação na linha 9 fora do trecho exibido."),
            (1, {"tipo": "editor", "rotulo": "terminal", "linhas": ["a", "b"], "anotacoes": [{"linha": 1, "texto": "x"}, {"linha": 1, "texto": "y"}]},
             "conceito[1]: duas anotações na linha 1."),
            (1, {"tipo": "editor", "rotulo": "terminal", "linhas": "abc"},
             "conceito[1]: editor exige linhas como lista de textos."),
            (3, {"tipo": "terminal", "comandos": [{"entrada": "ls", "saida": "", "origem": "exemplo", "condicao": "fantasma"}]},
             "laboratorio[1]: condição usa estado que nenhum efeito define: fantasma."),
            (5, {"tipo": "quiz", "perguntas": [{"alternativas": [{"texto": "a", "correta": True, "explicacao": "x"}, {"texto": "b", "correta": False, "explicacao": "y"}]}]},
             "verificacao[2]: pergunta 1 exige enunciado."),
            (1, {"tipo": "arvores", "esquerda": {"titulo": "E", "nos": [{"descricao": "d"}]}, "direita": {"titulo": "D", "nos": []}},
             "conceito[1]: nó 1 da árvore esquerda exige caminho e descricao."),
            (2, {"tipo": "fluxo", "titulo": "F", "etapas": [{"titulo": "t"}]},
             "simulacao[1]: etapa 1 exige titulo e descricao."),
            (4, {"tipo": "incidente", "titulo": "t", "saida": ["x"], "origem": "executado", "pergunta": "p", "correcao": "c",
                 "alternativas": [{"texto": "a", "correta": True, "explicacao": "x"}, {"texto": "b", "correta": False, "explicacao": "y"}]},
             "diagnostico[1]: incidente exige saida como texto."),
            (0, "texto solto", "objetivos[2]: bloco deve ser um objeto."),
        ]
        for aba, bloco, esperado in casos:
            with self.subTest(esperado=esperado):
                d = minima()
                d["abas"][aba]["blocos"].append(bloco)
                self.assertIn(esperado, validar_oda(d, CATALOGO))

    def test_anotacao_respeita_inicio_do_trecho(self):
        d = minima()
        d["abas"][1]["blocos"].append({"tipo": "editor", "rotulo": "arquivo", "caminho": "Program.cs", "commit": "702145a", "inicio": 94, "linhas": ["a", "b"], "anotacoes": [{"linha": 95, "texto": "x"}], "contexto": "Arquivo de entrada da API."})
        d["abas"][1]["blocos"].append({"tipo": "faixa", "estilo": "dica", "titulo": ONDE, "texto": "Repositório net-minimal-api."})
        self.assertEqual(validar_oda(d, CATALOGO), [])

    def test_laboratorio_abre_com_objetivo_completo(self):
        d = minima()
        del d["abas"][3]["blocos"][0]["impacto"]
        self.assertIn("laboratorio[0]: faixa de objetivo exige problema, impacto, mecanismo, comprovacao.", validar_oda(d, CATALOGO))
        d = minima()
        d["abas"][3]["blocos"][0]["estilo"] = "dica"
        d["abas"][3]["blocos"][0]["texto"] = "t"
        self.assertIn("laboratorio: a faixa de objetivo deve vir logo depois da legenda e dos conceitos da aba.", validar_oda(d, CATALOGO))

    def test_glossario_vem_primeiro_e_cita_portal_curado(self):
        d = minima()
        d["abas"][0]["blocos"].reverse()
        self.assertIn("objetivos: o glossário deve vir logo depois da legenda, antes de qualquer outro bloco.", validar_oda(d, CATALOGO))
        d = minima()
        d["abas"][0]["blocos"][0]["itens"].append({"termo": "CSP", "definicao": "Política.", "referencia": {"rotulo": "blog", "url": "https://exemplo.com/csp"}})
        self.assertIn("objetivos[0]: referência do termo 2 exige rotulo e url https de um portal curado.", validar_oda(d, CATALOGO))
        d["abas"][0]["blocos"][0]["itens"][1]["referencia"]["url"] = "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP"
        self.assertEqual(validar_oda(d, CATALOGO), [])

    def test_codigo_exige_contexto_e_faixas(self):
        editor = {"tipo": "editor", "rotulo": "arquivo", "caminho": "Program.cs", "commit": "702145a", "linhas": ["a"]}
        d = minima()
        d["abas"][1]["blocos"].append(dict(editor))
        self.assertIn("conceito[1]: editor de arquivo exige contexto, que diz o que o arquivo é e por que ele aparece.", validar_oda(d, CATALOGO))
        d = minima()
        d["abas"][4]["blocos"].append(dict(editor, contexto="Arquivo de entrada da API."))
        self.assertIn(f"diagnostico: aba mostra código e não tem a faixa {ONDE}.", validar_oda(d, CATALOGO))
        d = minima()
        d["abas"][3]["blocos"].append(dict(editor, contexto="Arquivo de entrada da API."))
        self.assertEqual(validar_oda(d, CATALOGO), [])
        d = minima()
        d["abas"][0]["blocos"][1]["titulo"] = "Outra"
        self.assertIn(f"objetivos: falta a faixa {COMO_OBTER}.", validar_oda(d, CATALOGO))
        d = minima()
        d["abas"][0]["blocos"][1]["links"] = [{"rotulo": "repo", "url": "javascript:alert(1)"}]
        self.assertIn("objetivos[1]: link de faixa exige rotulo e url https.", validar_oda(d, CATALOGO))

    def test_resumo_e_um_bloco_valido(self):
        d = minima()
        d["abas"][5]["blocos"].append({"tipo": "resumo"})
        self.assertEqual(validar_oda(d, CATALOGO), [])

    def test_linha_do_tempo_valida_referencias(self):
        bloco = {"tipo": "linha-do-tempo", "atores": [{"id": "p", "rotulo": "P"}, {"id": "f", "rotulo": "F"}],
                 "eventos": [{"id": "e1", "de": "p", "para": "f", "mensagem": "m"}, {"id": "e2", "de": "f", "para": "x", "mensagem": "m", "depende": "e9"}],
                 "falhas": [{"id": "a", "rotulo": "A", "ator": "y"}]}
        d = minima()
        d["abas"][2]["blocos"].append(bloco)
        erros = validar_oda(d, CATALOGO)
        self.assertIn("simulacao[1]: evento e2 usa ator inexistente: x.", erros)
        self.assertIn("simulacao[1]: evento e2 depende de e9, que não é evento anterior.", erros)
        self.assertIn("simulacao[1]: falha a usa ator inexistente: y.", erros)

    def test_efeito_em_lista_define_estados_para_condicoes(self):
        d = minima()
        d["abas"][3]["blocos"].append({"tipo": "passos", "itens": [{"titulo": "t", "efeito": ["a", "!b"]}]})
        d["abas"][3]["blocos"].append({"tipo": "terminal", "comandos": [{"entrada": "ls", "saida": "", "origem": "exemplo", "condicao": "b"}]})
        self.assertEqual(validar_oda(d, CATALOGO), [])

    def test_condicao_em_lista_e_efeito_invalido(self):
        d = minima()
        d["abas"][3]["blocos"].append({"tipo": "passos", "itens": [{"titulo": "t", "efeito": "a"}, {"titulo": "u", "efeito": 3}]})
        d["abas"][3]["blocos"].append({"tipo": "terminal", "comandos": [{"entrada": "ls", "saida": "", "origem": "exemplo", "condicao": ["a", "!fantasma"]}]})
        erros = validar_oda(d, CATALOGO)
        self.assertIn("laboratorio[1].passo 2: efeito deve ser texto ou lista de textos.", erros)
        self.assertIn("laboratorio[2]: condição usa estado que nenhum efeito define: fantasma.", erros)


class TestGeracao(unittest.TestCase):
    def test_preparar_atribui_ids_e_renomeia(self):
        d = minima()
        d["abas"][1]["blocos"].append({"tipo": "adr", "id": "ADR-0001", "titulo": "t", "status": "accepted", "contexto": "c", "decisao": "d", "alternativas": "a", "consequencias": "q"})
        p = preparar(copy.deepcopy(d))
        self.assertEqual(p["abas"][1]["blocos"][1]["id"], "conceito-1")
        self.assertEqual(p["abas"][1]["blocos"][1]["id_adr"], "ADR-0001")

    def test_diagrama_mantem_tipo_do_bloco_e_exige_tipo_diagrama(self):
        d = minima()
        d["abas"][1]["blocos"].append({"tipo": "diagrama", "id": "D-01", "tipo_diagrama": "Fluxo", "titulo": "t", "mermaid": "graph LR\n a --> b"})
        self.assertEqual(validar_oda(d, CATALOGO), [])
        p = preparar(copy.deepcopy(d))
        bloco = p["abas"][1]["blocos"][1]
        self.assertEqual((bloco["tipo"], bloco["id_diagrama"], bloco["tipo_diagrama"], bloco["id"]), ("diagrama", "D-01", "Fluxo", "conceito-1"))
        del d["abas"][1]["blocos"][1]["tipo_diagrama"]
        self.assertIn("conceito[1]: diagrama exige a propriedade tipo_diagrama.", validar_oda(d, CATALOGO))

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
