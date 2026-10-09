"""Testes do texto exibido ao aluno nas ODAs."""

from pathlib import Path
import re
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]
# Campos que reproduzem código, comandos ou saídas, cujo texto não é redação da ODA.
LITERAIS = {"saida", "linhas", "mermaid", "entrada", "comando", "corpo", "cabecalhos", "url"}
BASTIDOR = re.compile(r"\b(foi produzida|foram produzidas|foi obtid[ao]|foram obtid[ao]s|execução real|o aluno)\b", re.IGNORECASE)


def textos(no, campo=None):
    if isinstance(no, dict):
        for chave, valor in no.items():
            if chave not in LITERAIS:
                yield from textos(valor, chave)
    elif isinstance(no, list):
        for item in no:
            yield from textos(item, campo)
    elif isinstance(no, str):
        yield campo, no


class TestTextoDoAluno(unittest.TestCase):
    def test_sem_narrativa_de_producao(self):
        achados = []
        for arquivo in sorted((ROOT / "odas").glob("*/oda.yml")):
            for campo, texto in textos(yaml.safe_load(arquivo.read_text(encoding="utf-8"))):
                if BASTIDOR.search(texto):
                    achados.append(f"{arquivo.parent.name}.{campo}: {texto[:120]}")
        self.assertEqual(achados, [])


if __name__ == "__main__":
    unittest.main()
