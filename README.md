# ODAs da Arquitetura de Referência

Portal de Objetos Digitais de Aprendizagem sobre os repositórios `frontend-react`, `net-minimal-api` e `aspire-aws`, publicado com MkDocs Material.

## Trabalhar localmente

    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    .venv/bin/mkdocs serve

## Portões de qualidade

    .venv/bin/python -m unittest discover -s tests -v
    node --test "tests/js/*.test.mjs"
    .venv/bin/python scripts/validate_odas.py
    .venv/bin/mkdocs build --strict

## Estado da construção

| Onda | Escopo | Situação |
| --- | --- | --- |
| 1 | Portal, página mestre com as 36 ODAs, componentes interativos, validador e as ODAs piloto 02, 20 e 30 | Concluída |
| 2 | ODAs restantes das trilhas 1 a 6 | Pendente |
| 3 | ODAs da trilha 7, sobre nuvem local | Pendente |

As ODAs disponíveis são a 02 (Feature-Sliced Design e fronteiras impostas pelo ESLint), a 20 (Vertical Slice e comparativo com Clean Architecture) e a 30 (Mensageria com SQS e SNS). O catálogo completo fica em `catalogo/odas.yml`, e o guia de autoria em `docs/referencia/modelo-de-oda.md`.
