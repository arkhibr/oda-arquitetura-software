# ODAs da Arquitetura de Referência

Portal de Objetos Digitais de Aprendizagem sobre os repositórios `frontend-react`, `net-minimal-api` e `aspire-aws`. A página mestre, com o catálogo das 36 ODAs, é publicada com MkDocs Material, e cada ODA disponível é uma aplicação de página única gerada a partir de um arquivo de dados.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `catalogo/odas.yml` | Catálogo das ODAs, com trilha, tempo, pré-requisitos e situação. ODAs disponíveis indicam a pasta da aplicação no campo `app` |
| `docs/index.md` | Página mestre, preenchida pelo hook `hooks/catalogo.py` |
| `odas/<oda>/oda.yml` | Conteúdo de cada ODA, organizado em sete abas de blocos |
| `odas/<oda>/evidencias.md` | Saídas executadas que sustentam as saídas marcadas como `executado` |
| `motor/` | Aplicação em JavaScript, sem dependências, que monta a ODA a partir dos dados |
| `scripts/gerar_odas.py` | Valida cada `oda.yml` e gera `site/novo/<oda>/index.html` |

## Trabalhar localmente

    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    npm ci
    .venv/bin/mkdocs build --strict
    .venv/bin/python scripts/gerar_odas.py --destino site/novo
    python3 scripts/servidor_estatico.py 8000 site

## Portões de qualidade

    .venv/bin/python -m unittest discover -s tests -v
    node --test "tests/js/*.test.mjs"
    .venv/bin/mkdocs build --strict
    .venv/bin/python scripts/gerar_odas.py --destino site/novo
    npx playwright test

## Estado da construção

| Onda | Escopo | Situação |
| --- | --- | --- |
| 1 | Página mestre com as 36 ODAs, motor das aplicações, gerador e as ODAs 02, 20 e 30 | Concluída |
| 2 | ODAs restantes das trilhas 1 a 6 | Pendente |
| 3 | ODAs da trilha 7, sobre nuvem local | Pendente |

As ODAs disponíveis são a 02 (Feature-Sliced Design e fronteiras impostas pelo ESLint), a 20 (Vertical Slice e comparativo com Clean Architecture) e a 30 (Mensageria com SQS e SNS), publicadas em `/novo/oda-02/`, `/novo/oda-20/` e `/novo/oda-30/`.
