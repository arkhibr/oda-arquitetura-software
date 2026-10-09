#!/usr/bin/env python3
"""Valida a estrutura das páginas de ODA e a coerência com o catálogo."""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from hooks.catalogo import carregar_catalogo, oda_por_id, validar_catalogo  # noqa: E402

SECOES = (
    "Objetivos de aprendizagem", "Conceito", "No código", "Simulador", "Laboratório",
    "Erros comuns", "Decisão arquitetural", "Verificação", "Referências",
)
VERBOS_BLOOM = {
    "Identificar", "Reconhecer", "Descrever", "Explicar", "Interpretar", "Classificar", "Distinguir",
    "Diferenciar", "Comparar", "Aplicar", "Executar", "Implementar", "Usar", "Analisar", "Diagnosticar",
    "Rastrear", "Avaliar", "Justificar", "Decidir", "Criar", "Projetar", "Estender", "Modificar",
}
MARCADORES = ("TODO", "TBD", "PLACEHOLDER", "PREENCHER")
ARQUIVO_RE = re.compile(r"^Arquivo: `[^`]+` \(commit `([0-9a-f]{7})`\)$")
COMPONENTE_RE = re.compile(
    r'<div[^>]*data-oda="([^"]+)"[^>]*>\s*(?:<script type="application/json">(.*?)</script>)?', re.DOTALL)


def _front_matter(texto: str) -> tuple[dict, str]:
    if not texto.startswith("---\n"):
        return {}, texto
    fim = texto.index("\n---\n", 4)
    return yaml.safe_load(texto[4:fim]) or {}, texto[fim + 5:]


def _secoes(corpo: str) -> tuple[list[str], dict[str, list[str]], str | None]:
    titulos: list[str] = []
    conteudo: dict[str, list[str]] = {}
    h1 = None
    atual = None
    em_cerca = False
    for linha in corpo.splitlines():
        if linha.lstrip().startswith("```"):
            em_cerca = not em_cerca
        if not em_cerca and linha.startswith("# ") and h1 is None:
            h1 = linha[2:].strip()
            continue
        if not em_cerca and linha.startswith("## "):
            atual = linha[3:].strip()
            titulos.append(atual)
            conteudo[atual] = []
            continue
        if atual is not None:
            conteudo[atual].append(linha)
    return titulos, conteudo, h1


def _validar_codigo(linhas: list[str], commit: str) -> list[str]:
    erros = []
    anterior = ""
    em_cerca = False
    bloco = 0
    for linha in linhas:
        if linha.lstrip().startswith("```"):
            if not em_cerca:
                bloco += 1
                achado = ARQUIVO_RE.match(anterior.strip())
                if not achado:
                    erros.append(f"Bloco de código {bloco} em 'No código' sem a linha 'Arquivo: `...` (commit `...`)'.")
                elif achado.group(1) != commit:
                    erros.append(f"Bloco de código {bloco} cita o commit {achado.group(1)}, e o catálogo fixa {commit}.")
            em_cerca = not em_cerca
            continue
        if not em_cerca and linha.strip():
            anterior = linha
    return erros


def validar_pagina(caminho: Path, catalogo: dict, componentes: set[str]) -> list[str]:
    texto = caminho.read_text(encoding="utf-8")
    meta, corpo = _front_matter(texto)
    ident = str(meta.get("oda", ""))
    oda = oda_por_id(catalogo, ident)
    if oda is None:
        return [f"Front matter sem 'oda' válido do catálogo: {ident or 'ausente'}."]
    erros: list[str] = []
    titulos, conteudo, h1 = _secoes(corpo)
    esperado_h1 = f"ODA {ident} — {oda['titulo']}"
    if h1 != esperado_h1:
        erros.append(f"O título deve ser '# {esperado_h1}'.")
    if tuple(titulos) != SECOES:
        erros.append(f"Seções esperadas {list(SECOES)}, encontradas {titulos}.")
    objetivos = [l[6:].strip() for l in conteudo.get("Objetivos de aprendizagem", []) if l.startswith("- [ ] ")]
    if not 3 <= len(objetivos) <= 5:
        erros.append(f"A seção de objetivos deve ter de 3 a 5 itens, e tem {len(objetivos)}.")
    for objetivo in objetivos:
        if objetivo.split(" ", 1)[0] not in VERBOS_BLOOM:
            erros.append(f"Objetivo sem verbo da taxonomia de Bloom: {objetivo}")
    commit = catalogo["repositorios"][oda["repositorio"]]["commit"]
    erros += _validar_codigo(conteudo.get("No código", []), commit)
    if "data-oda=" not in "\n".join(conteudo.get("Simulador", [])):
        erros.append("A seção 'Simulador' precisa de ao menos um componente.")
    if 'data-oda="quiz"' not in "\n".join(conteudo.get("Verificação", [])):
        erros.append("A seção 'Verificação' precisa de um componente quiz.")
    if "ADR-" not in "\n".join(conteudo.get("Decisão arquitetural", [])):
        erros.append("A seção 'Decisão arquitetural' precisa citar uma ADR.")
    for nome, bruto in COMPONENTE_RE.findall(corpo):
        if nome not in componentes:
            erros.append(f"Componente desconhecido: {nome}.")
        if bruto.strip():
            try:
                config = json.loads(bruto)
            except json.JSONDecodeError as falha:
                erros.append(f"JSON inválido no componente {nome}: {falha}.")
                continue
            if not isinstance(config, dict):
                erros.append(f"Configuração do componente {nome} precisa ser um objeto JSON.")
    for marcador in MARCADORES:
        if re.search(rf"\b{marcador}\b", corpo):
            erros.append(f"Marcador editorial pendente: {marcador}.")
    return erros


def validar_tudo(raiz: Path) -> list[str]:
    catalogo = carregar_catalogo(raiz / "catalogo" / "odas.yml")
    erros = [f"catálogo: {e}" for e in validar_catalogo(catalogo, raiz / "docs")]
    componentes = {p.stem for p in (raiz / "docs/assets/javascripts/oda/componentes").glob("*.mjs")}
    paginas = {o["pagina"] for o in catalogo["odas"] if o.get("pagina")}
    for caminho in sorted((raiz / "docs" / "odas").glob("oda-*.md")):
        if caminho.name not in paginas:
            erros.append(f"{caminho.name}: página fora do catálogo.")
        erros += [f"{caminho.name}: {e}" for e in validar_pagina(caminho, catalogo, componentes)]
    return erros


def main() -> int:
    erros = validar_tudo(ROOT)
    for erro in erros:
        print(erro)
    print(f"{len(erros)} erro(s).")
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
