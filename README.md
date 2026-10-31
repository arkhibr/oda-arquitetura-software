# ODAs da Arquitetura de Referência

Portal de Objetos Digitais de Aprendizagem sobre os repositórios `frontend-react`, `net-minimal-api` e `aspire-aws`. A página mestre, com o catálogo das 36 ODAs, é publicada com MkDocs Material, e cada ODA disponível é uma aplicação de página única gerada a partir de um arquivo de dados.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `catalogo/odas.yml` | Catálogo das ODAs, com trilha, tempo, pré-requisitos e situação. ODAs disponíveis indicam a pasta da aplicação no campo `app` |
| `docs/index.md` | Página mestre, preenchida pelo hook `hooks/catalogo.py` |
| `odas/<oda>/oda.yml` | Conteúdo de cada ODA, organizado em sete abas de blocos |
| `motor/` | Aplicação em JavaScript, sem dependências, que monta a ODA a partir dos dados |
| `scripts/gerar_odas.py` | Valida cada `oda.yml` e gera `site/<oda>/index.html` |
| `guia-autoria/oda.yml` | ODA de autoria, acessível pela seção Sobre e publicada em `/oda-criar/` |
| `docs/sobre/` | Seção "Sobre" do portal: racional, pilha, arquitetura, decisões e guia para compreender e estender o código |

## Trabalhar localmente

    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    npm ci
    .venv/bin/mkdocs build --strict
    .venv/bin/python scripts/gerar_odas.py --destino site
    python3 scripts/servidor_estatico.py 8000 site

## Portões de qualidade

    .venv/bin/python -m unittest discover -s tests -v
    node --test "tests/js/*.test.mjs"
    .venv/bin/mkdocs build --strict
    .venv/bin/python scripts/gerar_odas.py --destino site
    npx playwright test

## Estado da construção

| Onda | Escopo | Situação |
| --- | --- | --- |
| 1 | Página mestre com as 36 ODAs, motor das aplicações, gerador e as ODAs 02, 20 e 30 | Concluída |
| 2 | ODAs restantes das trilhas 1 a 6 | Em andamento |
| 3 | ODAs da trilha 7, sobre nuvem local | Pendente |

As ODAs disponíveis são as que constam de `catalogo/odas.yml` com `situacao: disponivel`, cada uma publicada em `/oda-<id>/`.
