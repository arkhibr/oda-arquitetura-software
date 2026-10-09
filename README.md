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
