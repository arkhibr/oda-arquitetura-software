# Compreender o código

## Execução local

    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    npm ci
    .venv/bin/mkdocs build --strict
    .venv/bin/python scripts/gerar_odas.py --destino site
    python3 scripts/servidor_estatico.py 8000 site

Em seguida, a página mestre abre em `http://127.0.0.1:8000/` e cada ODA em `http://127.0.0.1:8000/oda-02/`, por exemplo. O servidor de desenvolvimento do MkDocs (`mkdocs serve`) serve apenas a página mestre e esta seção, porque as ODAs são geradas pelo script e não pelo MkDocs.

## Portões de qualidade

| Comando | O que verifica | Arquivos |
| --- | --- | --- |
| `.venv/bin/python -m unittest discover -s tests -v` | Catálogo, gerador, página mestre, conteúdo das ODAs, configuração do projeto e esteira | `tests/test_*.py` |
| `node --test "tests/js/*.test.mjs"` | Funções puras do motor e dos componentes da página mestre, e as regras de segurança do motor | `tests/js/*.test.mjs` |
| `.venv/bin/mkdocs build --strict` | Validação do catálogo pelo hook e links quebrados nas páginas do MkDocs | `mkdocs.yml`, `docs/` |
| `.venv/bin/python scripts/gerar_odas.py --destino site` | Validação de cada `oda.yml` e geração das ODAs | `scripts/gerar_odas.py` |
| `npx playwright test` | Abre cada ODA no Chromium: sete abas, nenhum bloco com erro, ao menos 60 elementos interativos e ausência de rolagem horizontal em 360 px | `tests/e2e/` |

O servidor usado pelo Playwright é iniciado pela própria configuração (`playwright.config.mjs`) na porta 8799, sobre o diretório `site/`. O teste de navegador exige que `mkdocs build` e `gerar_odas.py` tenham sido executados antes.

## Roteiro de leitura do código

A ordem abaixo segue o caminho do dado, do arquivo de conteúdo até a tela.

1. **`catalogo/odas.yml`** define o que existe. Leia os três repositórios com seus commits, as sete trilhas e duas ODAs completas.
2. **`odas/oda-02/oda.yml`** mostra um conteúdo completo. Percorra as sete abas e observe quais tipos de bloco aparecem em cada uma.
3. **`scripts/gerar_odas.py`**: leia primeiro `ABAS` e `OBRIGATORIOS`, depois `_bloco` (as regras de validação por tipo), `preparar` e `html_da_oda`.
4. **`motor/app.mjs`**: a função `iniciar` mostra a montagem da página inteira. Os blocos são produzidos por `ctx.renderizarBloco`.
5. **`motor/nucleo.mjs`** reúne as três peças que todos os módulos usam: `registrarBloco`, `h` e `textoRico`.
6. **Um módulo de bloco simples**, como `motor/blocos-texto.mjs`, e depois um com estado, como `motor/terminal.mjs`.
7. **`motor/estado.mjs`** explica como o progresso e os efeitos dos passos são guardados.
8. **`hooks/catalogo.py`** e **`docs/assets/javascripts/oda/`** completam a página mestre.

## Convenções do código

- **Idioma.** Identificadores, mensagens, comentários e conteúdo estão em português. Termos técnicos consagrados (commit, hook, endpoint) permanecem em inglês.
- **Módulos JavaScript.** Funções puras e testáveis são exportadas (`verificar`, `corrigir`, `simular`, `resolverComando`, `aplicarEfeito`). A montagem de DOM fica dentro do callback passado a `registrarBloco`, que recebe `(casca, bloco, ctx)`.
- **Objeto `ctx`.** Contém `doc`, `win`, `estado`, `armazenamento`, `abas`, `avisar` e `renderizarBloco`. Os módulos recebem `doc` e `win` por parâmetro em vez de usar globais, o que permite testar a lógica sem navegador.
- **Validação em Python.** Cada função devolve uma lista de mensagens de erro com o prefixo `aba[posição]: ...`. A lista vazia significa sucesso, e o gerador acumula todos os erros antes de abortar.
- **Estilo.** O motor usa variáveis CSS (`--fundo`, `--texto`, `--destaque`) definidas por tema em `motor/oda.css` (`escuro` e `claro`). Classes seguem o padrão BEM simplificado, como `editor__linha--destaque`.

## Diagnóstico de problemas comuns

| Sintoma | Causa provável | Verificação |
| --- | --- | --- |
| `mkdocs build` falha com "Catálogo de ODAs inválido" | Campo ausente, pré-requisito posterior ou faixa de tempo fora de 45 a 90 | A mensagem lista cada erro por ODA. Corrija `catalogo/odas.yml` |
| `gerar_odas.py` imprime erros e não gera nada | Falha de validação em algum `oda.yml`. O gerador não copia o motor quando há erro | Leia a lista `odas/<oda>/oda.yml: aba[n]: ...` |
| ODA abre com "Carregando a ODA…" e nada mais | Erro de JavaScript na inicialização, ou página aberta por `file://` | Abra o console do navegador e use o servidor estático em vez de `file://`, pois módulos ES exigem HTTP |
| Bloco exibe "O bloco … não pôde ser exibido" | Exceção no renderizador, geralmente por dado fora do esquema que a validação não cobre | A mensagem traz o erro original. Compare com a tabela de propriedades em [Estender a aplicação](estender.md) |
| Diagrama não aparece | O CDN do Mermaid está inacessível ou a sintaxe do diagrama é inválida | O botão Código mostra o texto-fonte, e o console do navegador mostra o erro do Mermaid |
| Comando do terminal responde "não reconhecido" | A `condicao` do comando depende de um estado que ainda não foi ligado por `efeito` | Confira a ordem dos passos e os efeitos. Para zerar, limpe `oda-app:<id>` no `localStorage` |
| Página mestre perde o filtro após navegar | Componente não foi montado novamente | `index.mjs` assina `document$` do Material, e a falha costuma estar no registro do componente |
