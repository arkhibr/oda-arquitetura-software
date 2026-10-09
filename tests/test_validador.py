"""Testes do validador das páginas de ODA."""

from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

from hooks.catalogo import carregar_catalogo  # noqa: E402
from validate_odas import validar_pagina  # noqa: E402

CATALOGO = carregar_catalogo(ROOT / "catalogo" / "odas.yml")
COMPONENTES = {"quiz", "classificador", "terminal"}

PAGINA_VALIDA = '''---
oda: "02"
---
# ODA 02 — Feature-Sliced Design e fronteiras impostas pelo ESLint

## Objetivos de aprendizagem

- [ ] Explicar a hierarquia de camadas.
- [ ] Classificar imports entre camadas.
- [ ] Executar o lint e interpretar o erro.

## Conceito

Texto.

## No código

Arquivo: `eslint.config.ts` (commit `2179313`)

```ts
const x = 1
```

## Simulador

<div data-oda="classificador">
<script type="application/json">{"categorias": [], "itens": []}</script>
</div>

## Laboratório

Passos.

## Erros comuns

Erros.

## Decisão arquitetural

ADR-007.

## Verificação

<div data-oda="quiz">
<script type="application/json">{"perguntas": []}</script>
</div>

## Referências

Links.
'''


class TestValidador(unittest.TestCase):
    def validar(self, texto):
        with tempfile.TemporaryDirectory() as tmp:
            caminho = Path(tmp) / "oda-02-fsd-fronteiras.md"
            caminho.write_text(texto, encoding="utf-8")
            return validar_pagina(caminho, CATALOGO, COMPONENTES)

    def test_pagina_valida(self):
        self.assertEqual(self.validar(PAGINA_VALIDA), [])

    def test_secao_fora_de_ordem(self):
        texto = PAGINA_VALIDA.replace("## Conceito", "## Conceitos")
        self.assertTrue(any("Seções esperadas" in e for e in self.validar(texto)))

    def test_titulo_diferente_do_catalogo(self):
        texto = PAGINA_VALIDA.replace("e fronteiras impostas pelo ESLint", "e ESLint")
        self.assertTrue(any("título" in e for e in self.validar(texto)))

    def test_objetivo_sem_verbo_de_bloom(self):
        texto = PAGINA_VALIDA.replace("- [ ] Explicar a hierarquia", "- [ ] Saber a hierarquia")
        self.assertIn("Objetivo sem verbo da taxonomia de Bloom: Saber a hierarquia de camadas.", self.validar(texto))

    def test_quantidade_de_objetivos(self):
        texto = PAGINA_VALIDA.replace("- [ ] Executar o lint e interpretar o erro.\n", "")
        self.assertIn("A seção de objetivos deve ter de 3 a 5 itens, e tem 2.", self.validar(texto))

    def test_codigo_sem_arquivo(self):
        texto = PAGINA_VALIDA.replace("Arquivo: `eslint.config.ts` (commit `2179313`)", "Veja:")
        self.assertIn("Bloco de código 1 em 'No código' sem a linha 'Arquivo: `...` (commit `...`)'.", self.validar(texto))

    def test_commit_divergente(self):
        texto = PAGINA_VALIDA.replace("(commit `2179313`)", "(commit `aaaaaaa`)")
        self.assertIn("Bloco de código 1 cita o commit aaaaaaa, e o catálogo fixa 2179313.", self.validar(texto))

    def test_json_invalido(self):
        texto = PAGINA_VALIDA.replace('{"perguntas": []}', '{"perguntas": ]}')
        self.assertTrue(any("JSON inválido no componente quiz" in e for e in self.validar(texto)))

    def test_json_que_nao_e_objeto(self):
        texto = PAGINA_VALIDA.replace('{"perguntas": []}', '[1]')
        self.assertIn("Configuração do componente quiz precisa ser um objeto JSON.", self.validar(texto))

    def test_componente_desconhecido(self):
        texto = PAGINA_VALIDA.replace('data-oda="classificador"', 'data-oda="roleta"')
        self.assertIn("Componente desconhecido: roleta.", self.validar(texto))

    def test_verificacao_sem_quiz(self):
        texto = PAGINA_VALIDA.replace('data-oda="quiz"', 'data-oda="terminal"')
        self.assertIn("A seção 'Verificação' precisa de um componente quiz.", self.validar(texto))

    def test_json_invalido_com_aspas_simples_na_tag(self):
        texto = PAGINA_VALIDA.replace('<script type="application/json">{"perguntas": []}', "<script type='application/json'>{\"perguntas\": ]}")
        self.assertTrue(any("JSON inválido no componente quiz" in e for e in self.validar(texto)))

    def test_json_invalido_com_atributo_extra_na_tag(self):
        texto = PAGINA_VALIDA.replace('<script type="application/json">{"perguntas": []}', '<script id="cfg" type="application/json">{"perguntas": ]}')
        self.assertTrue(any("JSON inválido no componente quiz" in e for e in self.validar(texto)))

    def test_componente_sem_bloco_de_configuracao(self):
        texto = PAGINA_VALIDA.replace('<script type="application/json">{"categorias": [], "itens": []}</script>\n', "")
        self.assertIn("Componente classificador sem bloco de configuração JSON.", self.validar(texto))

    def test_marcador_dentro_de_bloco_de_codigo_e_ignorado(self):
        texto = PAGINA_VALIDA.replace("const x = 1", '<div data-oda="roleta"></div>')
        self.assertEqual(self.validar(texto), [])

    def test_marcador_editorial(self):
        self.assertIn("Marcador editorial pendente: TODO.", self.validar(PAGINA_VALIDA.replace("Passos.", "TODO passos.")))

    def test_titulo_dentro_de_codigo_nao_conta_como_secao(self):
        texto = PAGINA_VALIDA.replace("const x = 1", "## Conceito")
        self.assertEqual(self.validar(texto), [])


if __name__ == "__main__":
    unittest.main()
