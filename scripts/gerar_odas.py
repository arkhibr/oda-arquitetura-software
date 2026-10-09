#!/usr/bin/env python3
"""Gera as ODAs no formato de aplicação a partir de odas/*/oda.yml."""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
import re
import shutil
import sys

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from hooks.catalogo import carregar_catalogo, oda_por_id  # noqa: E402

ABAS = ("missao", "conceito", "codigo", "simulacao", "laboratorio", "diagnostico", "verificacao")
OBRIGATORIOS = {
    "legenda": ("texto",), "faixa": ("estilo",), "checklist": ("titulo", "itens"), "editor": ("rotulo", "linhas"),
    "passos": ("itens",), "conceito": ("titulo", "texto"),
    "adr": ("id", "titulo", "status", "contexto", "decisao", "alternativas", "consequencias"),
    "arvores": ("esquerda", "direita"), "comparativo": ("colunas", "linhas"), "diagrama": ("id", "tipo", "titulo", "mermaid"),
    "fluxo": ("titulo", "etapas"), "console-api": ("cenarios",), "classificador": ("categorias", "itens"),
    "terminal": ("comandos",), "incidente": ("titulo", "saida", "origem", "pergunta", "alternativas", "correcao"),
    "quiz": ("perguntas",),
}
ESTILOS = {"dica", "erro", "quebra", "sucesso"}
ROTULOS = {"terminal", "arquivo", "saida", "log"}
ORIGENS = {"executado", "codigo", "exemplo"}
FRASE = re.compile(r"[.!?](\s|$)")


def _editor(bloco: dict, commit: str, rotulo: str) -> list[str]:
    erros = []
    if bloco.get("rotulo") not in ROTULOS:
        erros.append(f"{rotulo}: rótulo de editor inválido: {bloco.get('rotulo')}.")
    if bloco.get("rotulo") == "arquivo":
        if not bloco.get("caminho") or not bloco.get("commit"):
            erros.append(f"{rotulo}: editor de arquivo exige caminho e commit.")
        elif bloco["commit"] != commit:
            erros.append(f"{rotulo}: editor de arquivo cita o commit {bloco['commit']}, e o catálogo fixa {commit}.")
    if bloco.get("rotulo") in {"saida", "log"} and bloco.get("origem") not in ORIGENS:
        erros.append(f"{rotulo}: saída exige origem executado, codigo ou exemplo.")
    return erros


def _uma_correta(alternativas) -> bool:
    return isinstance(alternativas, list) and sum(1 for a in alternativas if a.get("correta") is True) == 1


def _bloco(bloco: dict, commit: str, rotulo: str) -> list[str]:
    tipo = bloco.get("tipo")
    if tipo not in OBRIGATORIOS:
        return [f"{rotulo}: tipo de bloco desconhecido: {tipo}."]
    erros = [f"{rotulo}: {tipo} exige a propriedade {p}." for p in OBRIGATORIOS[tipo] if p not in bloco]
    if erros:
        return erros
    if tipo == "legenda" and len(FRASE.findall(bloco["texto"])) > 3:
        erros.append(f"{rotulo}: legenda passa de três frases.")
    if tipo == "faixa":
        if bloco["estilo"] not in ESTILOS:
            erros.append(f"{rotulo}: estilo de faixa inválido: {bloco['estilo']}.")
        elif bloco["estilo"] == "erro" and not all(k in bloco for k in ("sintoma", "causa", "correcao")):
            erros.append(f"{rotulo}: faixa de erro exige sintoma, causa e correcao.")
        elif bloco["estilo"] != "erro" and "texto" not in bloco:
            erros.append(f"{rotulo}: faixa exige texto.")
    if tipo == "editor":
        erros += _editor(bloco, commit, rotulo)
    if tipo == "passos":
        for i, passo in enumerate(bloco["itens"], 1):
            if "titulo" not in passo:
                erros.append(f"{rotulo}.passo {i}: passo exige titulo.")
            if "editor" in passo:
                erros += _editor(passo["editor"], commit, f"{rotulo}.passo {i}")
    if tipo == "terminal":
        for i, c in enumerate(bloco["comandos"], 1):
            if not c.get("entrada") or not isinstance(c.get("saida"), str):
                erros.append(f"{rotulo}: comando {i} exige entrada e saida.")
            if c.get("origem") not in ORIGENS:
                erros.append(f"{rotulo}: comando {i} com origem inválida: {c.get('origem')}.")
    if tipo == "console-api":
        for i, c in enumerate(bloco["cenarios"], 1):
            if not c.get("rotulo") or "metodo" not in c.get("requisicao", {}) or "status" not in c.get("resposta", {}):
                erros.append(f"{rotulo}: cenário {i} exige rotulo, requisicao.metodo e resposta.status.")
            if c.get("origem") not in ORIGENS:
                erros.append(f"{rotulo}: cenário {i} com origem inválida: {c.get('origem')}.")
    if tipo == "fluxo":
        for i, e in enumerate(bloco["etapas"], 1):
            if "codigo" in e and e["codigo"].get("commit") != commit:
                erros.append(f"{rotulo}: etapa {i} cita commit diferente do catálogo.")
    if tipo == "incidente":
        if bloco["origem"] not in ORIGENS:
            erros.append(f"{rotulo}: incidente com origem inválida: {bloco['origem']}.")
        if not _uma_correta(bloco["alternativas"]):
            erros.append(f"{rotulo}: incidente deve ter exatamente uma alternativa correta.")
    if tipo == "quiz":
        for i, p in enumerate(bloco["perguntas"], 1):
            if not _uma_correta(p.get("alternativas")):
                erros.append(f"{rotulo}: pergunta {i} deve ter exatamente uma alternativa correta.")
    return erros


def validar_oda(dados: dict, catalogo: dict) -> list[str]:
    oda = oda_por_id(catalogo, str(dados.get("id")))
    if oda is None:
        return [f"ODA {dados.get('id')} não consta do catálogo."]
    erros = []
    if dados.get("titulo") != oda["titulo"]:
        erros.append(f"Título difere do catálogo: {oda['titulo']}.")
    abas = dados.get("abas", [])
    if tuple(a.get("id") for a in abas) != ABAS:
        erros.append(f"As abas devem ser, nesta ordem: {', '.join(ABAS)}.")
    commit = catalogo["repositorios"][oda["repositorio"]]["commit"]
    for aba in abas:
        if not aba.get("titulo"):
            erros.append(f"{aba.get('id')}: aba sem titulo.")
        for i, bloco in enumerate(aba.get("blocos", [])):
            erros += _bloco(bloco, commit, f"{aba.get('id')}[{i}]")
    return erros


def preparar(dados: dict) -> dict:
    for aba in dados["abas"]:
        for i, bloco in enumerate(aba["blocos"]):
            if bloco["tipo"] == "adr":
                bloco["id_adr"] = bloco.pop("id")
            if bloco["tipo"] == "diagrama":
                bloco["id_diagrama"] = bloco.pop("id")
                bloco["tipo_diagrama"] = bloco.pop("tipo")
                bloco["tipo"] = "diagrama"
            bloco["id"] = f"{aba['id']}-{i}"
    return dados


def html_da_oda(dados: dict) -> str:
    carga = json.dumps(dados, ensure_ascii=False).replace("</", "<\\/")
    titulo = html.escape(f"ODA {dados['id']} — {dados['titulo']}")
    return f"""<!doctype html>
<html lang="pt-BR" data-tema="escuro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<link rel="stylesheet" href="../motor/oda.css">
</head>
<body>
<div id="app"><p>Carregando a ODA…</p></div>
<noscript><p>Esta ODA precisa de JavaScript habilitado.</p></noscript>
<script id="oda-dados" type="application/json">{carga}</script>
<script type="module">import {{ iniciar }} from '../motor/app.mjs'; iniciar(document, window);</script>
</body>
</html>
"""


def gerar(raiz: Path, destino: Path) -> list[str]:
    catalogo = carregar_catalogo(raiz / "catalogo" / "odas.yml")
    erros: list[str] = []
    for arquivo in sorted((raiz / "odas").glob("*/oda.yml")):
        dados = yaml.safe_load(arquivo.read_text(encoding="utf-8"))
        problemas = validar_oda(dados, catalogo)
        if problemas:
            erros += [f"{arquivo.relative_to(raiz)}: {p}" for p in problemas]
            continue
        oda = oda_por_id(catalogo, str(dados["id"]))
        dados.update(repositorio=oda["repositorio"], commit=catalogo["repositorios"][oda["repositorio"]]["commit"], minutos=oda["minutos"])
        pasta = destino / arquivo.parent.name
        pasta.mkdir(parents=True, exist_ok=True)
        (pasta / "index.html").write_text(html_da_oda(preparar(dados)), encoding="utf-8")
    if not erros:
        shutil.copytree(raiz / "motor", destino / "motor", dirs_exist_ok=True)
    return erros


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--destino", default="site/novo")
    destino = ROOT / parser.parse_args().destino
    erros = gerar(ROOT, destino)
    for erro in erros:
        print(erro)
    print(f"{len(erros)} erro(s).")
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
