# Estender a aplicação

Cada receita abaixo lista os arquivos que mudam, na ordem em que convém alterá-los, e os testes que passam a proteger a mudança.

## Criar uma nova ODA

Esta é a extensão mais frequente, e não exige alterar código. Para praticar com exemplos interativos de todos os componentes, acesse a <a href="../../oda-criar/">ODA Como criar uma ODA</a>.

1. **Registre a ODA no catálogo**, em `catalogo/odas.yml`, sob `odas:`:

        - id: "10"
          titulo: "Título da ODA"
          trilha: 3
          repositorio: frontend-react
          fontes: ["ADR-010", "caminho/do/arquivo.ts"]
          minutos: 60
          pre_requisitos: ["05"]
          objetivo: "Uma frase com o que a pessoa passa a saber fazer."
          situacao: disponivel
          app: oda-10

    Regras aplicadas pela validação: todos os campos obrigatórios presentes, `minutos` entre 45 e 90, `trilha` e `repositorio` existentes, pré-requisitos com identificador menor que o da ODA, e `app` obrigatório se (e somente se) a situação for `disponivel`. O valor de `app` é `oda-<id>`, convenção conferida por `tests/test_catalogo.py`.

2. **Crie `odas/oda-10/oda.yml`** com `id` entre aspas simples, `titulo` idêntico ao do catálogo e as sete abas, nesta ordem: `missao`, `conceito`, `codigo`, `simulacao`, `laboratorio`, `diagnostico`, `verificacao`. Cada aba tem `id`, `titulo` e `blocos`. A ODA 02 serve de modelo.
3. **Use um commit fixo.** Todo bloco `editor` com `rotulo: arquivo` e toda etapa de `fluxo` com `codigo` precisam citar o commit do repositório registrado no catálogo.
4. **Gere e valide.**

        .venv/bin/python scripts/gerar_odas.py --destino site

    O comando lista todos os erros de uma vez e não produz saída parcial.
5. **Inclua a ODA nos testes de navegador**, acrescentando `'oda-10'` à constante `ODAS` em `tests/e2e/odas.spec.mjs`.
6. **Execute os portões** descritos em [Compreender o código](compreender.md). Se a nova ODA for a primeira ou a única de uma trilha, confira os totais em `tests/test_pagina_mestre.py`, que verifica por exemplo `2 ODAs · 1,8 h` para a Trilha 1.

A página mestre passa a exibir o link automaticamente, porque o hook gera a tabela a partir do catálogo. O arquivo `tests/test_conteudo.py` também varre todas as ODAs e rejeita, por exemplo, termos de bastidor de produção e comandos `cd` soltos, que alteram o diretório do terminal da pessoa que estuda.

### Esquema dos tipos de bloco

Propriedades marcadas com `*` são obrigatórias, e a validação as exige.

| Tipo | Propriedades | Observações |
| --- | --- | --- |
| `legenda` | `texto*` | No máximo três frases |
| `faixa` | `estilo*` (`dica`, `erro`, `quebra`, `sucesso`), `texto`, `titulo` | Estilo `erro` troca `texto` por `sintoma`, `causa` e `correcao`, todos obrigatórios |
| `conceito` | `titulo*`, `texto*`, `analogia` | |
| `adr` | `id*`, `titulo*`, `status*`, `contexto*`, `decisao*`, `alternativas*`, `consequencias*` | Exibido como bloco recolhível |
| `checklist` | `titulo*`, `itens*` | Marcas persistem no navegador |
| `editor` | `rotulo*` (`terminal`, `arquivo`, `saida`, `log`), `linhas*` (lista de textos), `inicio`, `destaque`, `anotacoes`, `caminho` e `commit` (para `arquivo`), `origem` (para `saida` e `log`) | Uma anotação por linha e dentro do trecho exibido |
| `passos` | `itens*` com `titulo*`, `texto`, `menu`, `teclas`, `editor`, `sucesso`, `efeito` | `efeito` liga ou desliga estados |
| `arvores` | `esquerda*`, `direita*`, cada uma com `titulo` e `nos` (`caminho*`, `descricao*`) | Caminho terminado em `/` indica pasta |
| `comparativo` | `colunas*`, `linhas*` com `dimensao` e `valores` | |
| `diagrama` | `id*`, `tipo_diagrama*`, `titulo*`, `mermaid*` | Texto-fonte Mermaid |
| `fluxo` | `titulo*`, `etapas*` com `titulo*`, `descricao*`, `codigo` (`arquivo`, `commit`, `linhas`, `destaque`, `inicio`) | |
| `terminal` | `comandos*` com `entrada*`, `saida*`, `origem*`, `condicao`, `efeito`, `dica`; `cenarios` com `rotulo` e `comando`; `prompt`; `titulo` | Todo `comando` de cenário precisa existir em `comandos`, e toda `condicao` precisa de um `efeito` que a defina |
| `console-api` | `cenarios*` com `rotulo*`, `requisicao*` (`metodo*`, `url`, `cabecalhos`, `corpo`), `resposta*` (`status*`, `corpo`), `origem*`, `nota` | |
| `linha-do-tempo` | `atores*` (`id`, `rotulo`), `eventos*` (`id`, `de`, `para`, `mensagem`, `depende`), `falhas` (`id`, `rotulo`, `ator`), `titulo` | `depende` só aponta para evento anterior |
| `classificador` | `categorias*` (`id`, `rotulo`), `itens*` (`texto`, `categoria`, `explicacao`), `enunciado` | |
| `incidente` | `titulo*`, `saida*`, `origem*`, `pergunta*`, `alternativas*` (`texto`, `correta`, `explicacao`), `correcao*` | Exatamente uma alternativa correta |
| `quiz` | `perguntas*` com `enunciado` e `alternativas` | Exatamente uma alternativa correta por pergunta |
| `resumo` | nenhuma | Lista o progresso por etapa |

!!! warning "A fonte da verdade é o código"
    Esta tabela foi montada a partir de `OBRIGATORIOS` e `_bloco` em `scripts/gerar_odas.py` e dos renderizadores em `motor/`. Em caso de divergência, vale o código, e a tabela deve ser corrigida.

Texto de blocos aceita apenas trechos de código entre crases. Marcação HTML ou Markdown além disso aparece literalmente, por decisão de segurança ([D5](decisoes.md)).

## Criar um novo tipo de bloco

Use esta receita quando nenhum tipo existente expressar uma interação nova. Os arquivos mudam nesta ordem:

1. **Esquema no gerador.** Em `scripts/gerar_odas.py`, acrescente o tipo em `OBRIGATORIOS` com as propriedades exigidas e, se houver regras de coerência, uma ramificação em `_bloco`. Escreva antes o teste correspondente em `tests/test_gerador.py`.
2. **Renderizador.** Em um módulo de `motor/` (existente, se for afim, ou novo), chame `registrarBloco`:

        import { registrarBloco, h, textoRico } from './nucleo.mjs';

        registrarBloco('meu-bloco', (casca, b, ctx) => {
          const { doc, estado } = ctx;
          casca.append(h(doc, 'p', {}, [textoRico(doc, b.texto)]));
        });

    Monte o DOM por `h`, `textoRico` e `textContent`. O teste de segurança recusa `innerHTML` e equivalentes.
3. **Importação.** Se criou um módulo novo, acrescente `import './meu-modulo.mjs';` em `motor/app.mjs`. Sem essa linha, o tipo não é registrado e o bloco exibe "tipo de bloco desconhecido".
4. **Lógica testável.** Extraia a lógica para funções puras exportadas e teste-as em `tests/js/motor-<modulo>.test.mjs`, no estilo dos testes existentes. O arquivo `tests/js/motor-seguranca.test.mjs` vale automaticamente para qualquer `.mjs` novo em `motor/`.
5. **Estilo.** Acrescente as classes em `motor/oda.css`, usando as variáveis de tema para funcionar nos temas escuro e claro.
6. **Estado persistente.** Para guardar escolhas, use `estado.definirMarca(chave, valor)` ou `estado.definirFlag(nome, valor)` com chaves prefixadas por `b.id`, e `estado.assinar(fn)` para reagir a mudanças.
7. **Busca.** Nenhuma ação é necessária: `indexar` coleta todo texto de qualquer bloco. Chaves que não devem ser indexadas entram em `IGNORADAS` em `motor/busca.mjs`.
8. **Uso real.** Use o bloco em uma ODA e inclua essa ODA em `tests/e2e/odas.spec.mjs`, que verifica ausência de `.bloco-erro`.

## Criar um componente interativo da página mestre

Componentes da página mestre são elementos `<div data-oda="nome">`, montados por `docs/assets/javascripts/oda/nucleo.mjs`.

1. Crie `docs/assets/javascripts/oda/componentes/meu-componente.mjs`:

        import { registrar, criarElemento } from '../nucleo.mjs';

        function montar(el, config, ctx) {
          el.replaceChildren(criarElemento(ctx.doc, 'p', { texto: 'Olá' }));
        }

        registrar('meu-componente', montar);

2. Importe o arquivo em `docs/assets/javascripts/oda/index.mjs`, como já é feito com `filtro-catalogo.mjs`.
3. Use-o em uma página Markdown, com configuração opcional em JSON:

        <div data-oda="meu-componente">
        <script type="application/json">{"chave": "valor"}</script>
        </div>

    A extensão `md_in_html` está habilitada em `mkdocs.yml`. Se a montagem falhar, o componente exibe a mensagem de erro no lugar do conteúdo, sem interromper a página.
4. Teste a lógica pura em `tests/js/`, como `filtro-catalogo.test.mjs`.

## Criar uma página nesta documentação

1. Crie o arquivo em `docs/`, por exemplo `docs/sobre/nova-pagina.md`.
2. Inclua-o no `nav` de `mkdocs.yml`, sob `Sobre`.
3. Execute `.venv/bin/mkdocs build --strict`. Links relativos entre páginas Markdown quebrados interrompem o build.

Diagramas Mermaid usam blocos de código com a linguagem `mermaid`, configurados em `pymdownx.superfences`. O hook do catálogo só atua sobre `index.md`, então as demais páginas não sofrem substituição.

## Atualizar o código de referência (novo commit)

1. Altere o `commit` do repositório em `catalogo/odas.yml`.
2. Atualize `tests/test_catalogo.py::test_commits_de_referencia`.
3. Execute o gerador. Cada trecho de arquivo com o commit antigo gera um erro, e a lista indica a ODA, a aba e o bloco.
4. Revise o conteúdo de cada ODA afetada, porque o número das linhas, os trechos e as saídas de comando podem ter mudado. Em seguida, atualize o commit nos blocos.

## Alterar a publicação

A esteira está em `.github/workflows/publicar.yml`. O teste `tests/test_publicacao.py` exige que os portões `python -m unittest discover -s tests`, `node --test "tests/js/*.test.mjs"` e `mkdocs build --strict` existam, que `scripts/gerar_odas.py --destino site` apareça em linha própria depois do build do MkDocs, e que `npx playwright test` esteja presente. Ao alterar a esteira, mantenha essas condições ou atualize o teste na mesma mudança.

## Limitações conhecidas

- O conjunto de tipos de bloco é definido em dois lugares, `OBRIGATORIOS` (Python) e os `registrarBloco` (JavaScript), sem verificação cruzada automática.
- Os dois núcleos JavaScript (`motor/nucleo.mjs` e `docs/assets/javascripts/oda/nucleo.mjs`) repetem funções auxiliares.
- O progresso não sincroniza entre dispositivos.
- O Mermaid depende de rede para ser carregado.
- A seção "Estado da construção" do `README.md` lista três ODAs, e o catálogo atual tem 12 disponíveis.
