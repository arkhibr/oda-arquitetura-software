"""Hook MkDocs do catálogo de ODAs: validação, página mestre e cabeçalho das ODAs."""

from __future__ import annotations

from pathlib import Path

import yaml

SITUACOES = ("disponivel", "planejada")
CAMPOS = ("id", "titulo", "trilha", "repositorio", "fontes", "minutos",
          "pre_requisitos", "objetivo", "situacao")


def carregar_catalogo(caminho: Path) -> dict:
    with open(caminho, encoding="utf-8") as arquivo:
        return yaml.safe_load(arquivo)


def oda_por_id(catalogo: dict, id_oda: str) -> dict | None:
    return next((o for o in catalogo["odas"] if o["id"] == id_oda), None)


def validar_catalogo(catalogo: dict, docs_dir: Path | None = None) -> list[str]:
    erros: list[str] = []
    trilhas = {t["numero"] for t in catalogo.get("trilhas", [])}
    repositorios = catalogo.get("repositorios", {})
    vistos: set[str] = set()
    ids = {o.get("id") for o in catalogo.get("odas", [])}
    for oda in catalogo.get("odas", []):
        ident = oda.get("id", "?")
        rotulo = f"ODA {ident}"
        ausentes = [c for c in CAMPOS if c not in oda]
        erros += [f"{rotulo}: campo {c} ausente." for c in ausentes]
        if ausentes:
            continue
        if ident in vistos:
            erros.append(f"{rotulo}: identificador duplicado.")
        vistos.add(ident)
        if oda["trilha"] not in trilhas:
            erros.append(f"{rotulo}: trilha {oda['trilha']} não existe.")
        if oda["repositorio"] not in repositorios:
            erros.append(f"{rotulo}: repositório {oda['repositorio']} não existe.")
        if not 45 <= oda["minutos"] <= 90:
            erros.append(f"{rotulo}: minutos deve estar entre 45 e 90.")
        for pre in oda["pre_requisitos"]:
            if pre not in ids:
                erros.append(f"{rotulo}: pré-requisito {pre} não existe.")
            elif pre >= ident:
                erros.append(f"{rotulo}: pré-requisito {pre} precisa ter identificador menor.")
        situacao = oda["situacao"]
        if situacao not in SITUACOES:
            erros.append(f"{rotulo}: situação {situacao} inválida.")
        elif situacao == "disponivel" and not oda.get("pagina"):
            erros.append(f"{rotulo}: situação disponivel exige o campo pagina.")
        elif situacao == "planejada" and oda.get("pagina"):
            erros.append(f"{rotulo}: situação planejada não admite o campo pagina.")
        elif situacao == "disponivel" and docs_dir is not None:
            if not (docs_dir / "odas" / oda["pagina"]).exists():
                erros.append(f"{rotulo}: página odas/{oda['pagina']} não encontrada.")
    return erros
