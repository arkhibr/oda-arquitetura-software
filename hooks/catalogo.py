"""Hook MkDocs do catálogo de ODAs: validação, página mestre e cabeçalho das ODAs."""

from __future__ import annotations

import html as _html
from pathlib import Path

from mkdocs.exceptions import PluginError
import yaml

SITUACOES = ("disponivel", "planejada")
CAMPOS = ("id", "titulo", "trilha", "repositorio", "fontes", "minutos",
          "pre_requisitos", "objetivo", "situacao")


def carregar_catalogo(caminho: Path) -> dict:
    with open(caminho, encoding="utf-8") as arquivo:
        return yaml.safe_load(arquivo)


def oda_por_id(catalogo: dict, id_oda: str) -> dict | None:
    return next((o for o in catalogo["odas"] if o["id"] == id_oda), None)


def validar_catalogo(catalogo: dict, raiz: Path | None = None) -> list[str]:
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
        elif situacao == "disponivel" and not oda.get("app"):
            erros.append(f"{rotulo}: situação disponivel exige o campo app.")
        elif situacao == "planejada" and oda.get("app"):
            erros.append(f"{rotulo}: situação planejada não admite o campo app.")
        elif situacao == "disponivel" and raiz is not None:
            if not (raiz / "odas" / oda["app"] / "oda.yml").exists():
                erros.append(f"{rotulo}: aplicação odas/{oda['app']}/oda.yml não encontrada.")
    return erros


MARCADOR = "<!-- catalogo-odas -->"
_ROTULO_SITUACAO = {"disponivel": "Disponível", "planejada": "Planejada"}
_estado: dict = {}


def formatar_horas(minutos: int) -> str:
    return f"{minutos / 60:.1f} h".replace(".", ",")


def _href(oda: dict) -> str:
    return f"novo/{oda['app']}/"


def _titulo_trilha(catalogo: dict, numero: int) -> str:
    titulo = next(t["titulo"] for t in catalogo["trilhas"] if t["numero"] == numero)
    return f"Trilha {numero} — {titulo}"


def renderizar_indice(catalogo: dict) -> str:
    esc = _html.escape
    odas = catalogo["odas"]
    total_min = sum(o["minutos"] for o in odas)
    partes = [
        f"O catálogo prevê {len(odas)} ODAs, com {formatar_horas(total_min)} de estudo estimado.",
        "",
        '<div data-oda="filtro-catalogo"></div>',
        "",
    ]
    for trilha in catalogo["trilhas"]:
        da_trilha = [o for o in odas if o["trilha"] == trilha["numero"]]
        minutos = sum(o["minutos"] for o in da_trilha)
        partes += [
            "",
            f"## {_titulo_trilha(catalogo, trilha['numero'])}",
            "",
            f"{len(da_trilha)} ODAs · {formatar_horas(minutos)}",
            "",
            '<div class="oda-catalogo__tabela"><table>',
            "<thead><tr><th>ODA</th><th>Título e objetivo</th><th>Repositório</th>"
            "<th>Tempo</th><th>Pré-requisitos</th><th>Situação</th></tr></thead>",
            "<tbody>",
        ]
        for oda in da_trilha:
            titulo = esc(oda["titulo"])
            if oda["situacao"] == "disponivel":
                titulo = f'<a href="{esc(_href(oda))}">{titulo}</a>'
            pre = ", ".join(oda["pre_requisitos"]) or "—"
            partes.append(
                f'<tr data-repositorio="{esc(oda["repositorio"])}" data-situacao="{esc(oda["situacao"])}">'
                f"<td>{esc(oda['id'])}</td>"
                f"<td>{titulo}<br><small>{esc(oda['objetivo'])}</small></td>"
                f"<td><code>{esc(oda['repositorio'])}</code></td>"
                f"<td>{oda['minutos']} min</td>"
                f"<td>{esc(pre)}</td>"
                f"<td>{_ROTULO_SITUACAO[oda['situacao']]}</td></tr>"
            )
        partes += ["</tbody>", "</table></div>"]
    return "\n".join(partes) + "\n"


def on_config(config):
    raiz = Path(config["config_file_path"]).parent
    catalogo = carregar_catalogo(raiz / "catalogo" / "odas.yml")
    erros = validar_catalogo(catalogo, raiz)
    if erros:
        raise PluginError("Catálogo de ODAs inválido:\n" + "\n".join(erros))
    _estado["catalogo"] = catalogo
    return config


def on_page_markdown(markdown, page, config, files):
    if page.file.src_uri == "index.md":
        return markdown.replace(MARCADOR, renderizar_indice(_estado["catalogo"]))
    return markdown
