"""Hook MkDocs do catálogo de ODAs: validação, página mestre e cabeçalho das ODAs."""

from __future__ import annotations

import html as _html
from pathlib import Path
import re

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


MARCADOR = "<!-- catalogo-odas -->"
_ROTULO_SITUACAO = {"disponivel": "Disponível", "planejada": "Planejada"}
_estado: dict = {}


def formatar_horas(minutos: int) -> str:
    return f"{minutos / 60:.1f} h".replace(".", ",")


def _href(oda: dict, prefixo: str = "") -> str:
    return f"{prefixo}{oda['pagina'].removesuffix('.md')}/"


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


def renderizar_cabecalho(catalogo: dict, oda: dict) -> str:
    esc = _html.escape
    repo = catalogo["repositorios"][oda["repositorio"]]
    url = f"{repo['url']}/tree/{repo['commit']}"
    pres = []
    for ident in oda["pre_requisitos"]:
        pre = oda_por_id(catalogo, ident)
        if pre["situacao"] == "disponivel":
            pres.append(f'<a href="{esc(_href(pre, "../"))}">ODA {esc(ident)} — {esc(pre["titulo"])}</a>')
        else:
            pres.append(f"ODA {esc(ident)} (planejada)")
    return (
        '<div class="oda-cabecalho"><dl>'
        f"<dt>Trilha</dt><dd>{esc(_titulo_trilha(catalogo, oda['trilha']))}</dd>"
        f"<dt>Tempo estimado</dt><dd>{oda['minutos']} min</dd>"
        f'<dt>Repositório</dt><dd><a href="{esc(url)}">{esc(repo["url"].removeprefix("https://github.com/"))}</a>'
        f" no commit <code>{esc(repo['commit'])}</code></dd>"
        f"<dt>Pré-requisitos</dt><dd>{'<br>'.join(pres) or 'Nenhum'}</dd>"
        "</dl></div>"
    )


def on_config(config):
    raiz = Path(config["config_file_path"]).parent
    catalogo = carregar_catalogo(raiz / "catalogo" / "odas.yml")
    erros = validar_catalogo(catalogo, Path(config["docs_dir"]))
    if erros:
        raise PluginError("Catálogo de ODAs inválido:\n" + "\n".join(erros))
    _estado["catalogo"] = catalogo
    return config


def on_page_markdown(markdown, page, config, files):
    catalogo = _estado["catalogo"]
    if page.file.src_uri == "odas/index.md":
        return markdown.replace(MARCADOR, renderizar_indice(catalogo))
    ident = page.meta.get("oda")
    if ident is None:
        return markdown
    oda = oda_por_id(catalogo, str(ident))
    if oda is None:
        raise PluginError(f"{page.file.src_uri}: ODA {ident} não consta do catálogo.")
    return re.sub(r"^(# .+)$", lambda m: m.group(1) + "\n\n" + renderizar_cabecalho(catalogo, oda),
                  markdown, count=1, flags=re.MULTILINE)
