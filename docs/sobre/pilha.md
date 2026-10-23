# Pilha tecnológica

## Visão geral

| Camada | Tecnologia | Versão fixada | Função | Origem |
| --- | --- | --- | --- | --- |
| Site e página mestre | MkDocs Material | 9.7.6 | Gera a página mestre e as páginas desta seção | `requirements.txt` |
| Hook de build | Python (PyYAML, `mkdocs.exceptions`) | Python 3.13 na esteira | Valida o catálogo e renderiza a tabela de ODAs | `hooks/catalogo.py` |
| Gerador de ODAs | Python 3 | 3.13 na esteira | Valida cada `oda.yml` e gera `site/<oda>/index.html` | `scripts/gerar_odas.py` |
| Motor das ODAs | JavaScript (módulos ES nativos) | Node 24 na esteira, para testes | Monta a interface a partir dos dados embutidos na página | `motor/*.mjs` |
| Diagramas | Mermaid | 11.4.1, via CDN jsDelivr | Renderiza blocos do tipo `diagrama` | `motor/blocos-codigo.mjs:3` |
| Testes de unidade (Python) | `unittest` | da biblioteca padrão | Catálogo, gerador, página mestre, conteúdo e publicação | `tests/test_*.py` |
| Testes de unidade (JavaScript) | `node --test` | do Node | Funções puras do motor e do portal | `tests/js/*.test.mjs` |
| Testes de navegador | Playwright | 1.60.0, Chromium | Abre cada ODA e verifica abas, erros e largura | `tests/e2e/`, `package.json` |
| Publicação | GitHub Actions e GitHub Pages | `actions/*@v4` e `@v5` | Executa os portões e publica o diretório `site` | `.github/workflows/publicar.yml` |

## O que não existe

O repositório não usa bundler, transpilador, framework de interface, gerenciador de estado nem biblioteca de componentes. O `package.json` declara apenas o Playwright como dependência de desenvolvimento. O motor é carregado como módulos ES pelo próprio navegador, por isso o código que o desenvolvedor lê é o código que o navegador executa.

## Papel de cada linguagem

- **Python** cuida de tudo que acontece antes da publicação: ler YAML, validar e escrever arquivos. Nenhum código Python é executado no navegador.
- **JavaScript** cuida de tudo que acontece depois da publicação: montar a interface, simular terminais e consoles, corrigir quizzes e gravar progresso.
- **YAML** descreve o catálogo (`catalogo/odas.yml`) e o conteúdo de cada ODA (`odas/<oda>/oda.yml`).
- **CSS** está em dois arquivos independentes: `motor/oda.css` estiliza as ODAs, e `docs/assets/stylesheets/oda.css` estiliza os componentes da página mestre usando as variáveis do tema Material.

## Dependências externas em tempo de execução

A única chamada de rede feita por uma ODA é a importação do Mermaid em `jsdelivr.net`. Quando o carregamento falha, o bloco exibe a mensagem "O diagrama não pôde ser carregado" e oferece o código-fonte do diagrama pelo botão Código (`motor/blocos-codigo.mjs:77`). O teste `tests/js/motor-seguranca.test.mjs` impede que qualquer outro módulo importe origens externas.

## Ambiente local

    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    npm ci

O Python precisa do `mkdocs-material` (que traz PyYAML). O Node precisa apenas do Playwright, e somente para os testes de navegador. A execução dos testes de unidade JavaScript não exige `npm ci`.
