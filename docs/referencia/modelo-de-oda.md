# Como escrever uma ODA

Este guia descreve a estrutura obrigatória de uma página de ODA, as regras conferidas pelo validador e o uso de cada componente interativo. Cada componente aparece com o Markdown que o declara e, logo abaixo, em funcionamento.

## Estrutura da página

Toda página de ODA fica em `docs/odas/`, começa com o front matter `oda: "NN"` e tem como primeira linha de conteúdo o título `# ODA NN — <título do catálogo>`. O hook do catálogo insere o cabeçalho logo abaixo do título, com trilha, tempo estimado, repositório, commit de referência e pré-requisitos, e por isso esses dados não são escritos à mão.

As seções de segundo nível são obrigatórias e aparecem exatamente nesta ordem:

| Seção | Conteúdo |
| --- | --- |
| Objetivos de aprendizagem | De 3 a 5 objetivos em lista de tarefas (`- [ ] `), cada um iniciado por verbo da taxonomia de Bloom |
| Conceito | Teoria, com diagrama Mermaid quando houver fluxo ou estrutura |
| No código | Trechos reais, cada um precedido pela linha que identifica arquivo e commit |
| Simulador | Um ou mais componentes interativos |
| Laboratório | Passos com comando, alteração, resultado esperado e abas por sistema operacional quando os comandos diferirem |
| Erros comuns | Sintoma, causa e correção de cada erro observado |
| Decisão arquitetural | ADR de origem em cartão, com contexto, decisão, alternativas e consequências |
| Verificação | Um componente `quiz` com explicação em cada alternativa |
| Referências | ADRs, documentação oficial e literatura |

Os verbos aceitos nos objetivos são Identificar, Reconhecer, Descrever, Explicar, Interpretar, Classificar, Distinguir, Diferenciar, Comparar, Aplicar, Executar, Implementar, Usar, Analisar, Diagnosticar, Rastrear, Avaliar, Justificar, Decidir, Criar, Projetar, Estender e Modificar.

## Trechos de código

Cada bloco de código da seção "No código" é precedido por uma linha no formato abaixo, com o commit de referência do repositório registrado no catálogo. O validador recusa a página quando a linha falta ou quando o commit diverge do catálogo.

```markdown
Arquivo: `src/app/mfe/manifest.ts` (commit `2179313`)
```

Laboratório cuja execução não pôde ser confirmada recebe a admonição `!!! warning "Laboratório não verificado"`, seguida do motivo.

## Componentes

Cada componente é declarado por um elemento `div` com o atributo `data-oda` e configurado por um bloco JSON logo dentro dele. Texto entre crases na configuração é exibido como código. Uma configuração inválida produz uma mensagem de erro no lugar do componente, sem afetar os demais componentes da página.

### Quiz

```html
<div data-oda="quiz">
<script type="application/json">
{"perguntas": [{"enunciado": "Qual camada do FSD não importa nenhuma outra camada?",
  "alternativas": [
    {"texto": "`shared`", "correta": true, "explicacao": "A camada `shared` é a base da hierarquia e não depende de nenhuma camada."},
    {"texto": "`pages`", "correta": false, "explicacao": "A camada `pages` importa de `widgets`, `features`, `entities` e `shared`."}]}]}
</script>
</div>
```

<div data-oda="quiz">
<script type="application/json">
{"perguntas": [{"enunciado": "Qual camada do FSD não importa nenhuma outra camada?",
  "alternativas": [
    {"texto": "`shared`", "correta": true, "explicacao": "A camada `shared` é a base da hierarquia e não depende de nenhuma camada."},
    {"texto": "`pages`", "correta": false, "explicacao": "A camada `pages` importa de `widgets`, `features`, `entities` e `shared`."}]}]}
</script>
</div>

### Classificador

```html
<div data-oda="classificador">
<script type="application/json">
{"enunciado": "Associe cada arquivo à sua camada.",
 "categorias": [{"id": "dominio", "rotulo": "Domínio"}, {"id": "infra", "rotulo": "Infraestrutura"}],
 "itens": [
  {"texto": "`Pedido.cs`", "categoria": "dominio", "explicacao": "O agregado concentra as regras de negócio."},
  {"texto": "`PedidoCommandRepository.cs`", "categoria": "infra", "explicacao": "O repositório acessa o banco de dados."}]}
</script>
</div>
```

<div data-oda="classificador">
<script type="application/json">
{"enunciado": "Associe cada arquivo à sua camada.",
 "categorias": [{"id": "dominio", "rotulo": "Domínio"}, {"id": "infra", "rotulo": "Infraestrutura"}],
 "itens": [
  {"texto": "`Pedido.cs`", "categoria": "dominio", "explicacao": "O agregado concentra as regras de negócio."},
  {"texto": "`PedidoCommandRepository.cs`", "categoria": "infra", "explicacao": "O repositório acessa o banco de dados."}]}
</script>
</div>

### Terminal

```html
<div data-oda="terminal">
<script type="application/json">
{"titulo": "Verificação do ambiente",
 "passos": [
  {"comando": "node --version", "saida": "v24.16.0", "nota": "A versão do Node precisa ser 24 ou superior."},
  {"comando": "python3 --version", "saida": "Python 3.13.14"}]}
</script>
</div>
```

<div data-oda="terminal">
<script type="application/json">
{"titulo": "Verificação do ambiente",
 "passos": [
  {"comando": "node --version", "saida": "v24.16.0", "nota": "A versão do Node precisa ser 24 ou superior."},
  {"comando": "python3 --version", "saida": "Python 3.13.14"}]}
</script>
</div>

### Passo a passo

```html
<div data-oda="passo-a-passo">
<script type="application/json">
{"etapas": [
  {"titulo": "Entrada", "descricao": "O endpoint recebe a requisição e monta o comando.",
   "codigo": {"arquivo": "Endpoint.cs", "linhas": ["var cmd = new Comando(id);", "var r = await handler.HandleAsync(cmd);"], "destaque": [1]}},
  {"titulo": "Regra", "descricao": "O handler aplica a regra de negócio no agregado.",
   "codigo": {"arquivo": "Endpoint.cs", "linhas": ["var cmd = new Comando(id);", "var r = await handler.HandleAsync(cmd);"], "destaque": [2]}}]}
</script>
</div>
```

<div data-oda="passo-a-passo">
<script type="application/json">
{"etapas": [
  {"titulo": "Entrada", "descricao": "O endpoint recebe a requisição e monta o comando.",
   "codigo": {"arquivo": "Endpoint.cs", "linhas": ["var cmd = new Comando(id);", "var r = await handler.HandleAsync(cmd);"], "destaque": [1]}},
  {"titulo": "Regra", "descricao": "O handler aplica a regra de negócio no agregado.",
   "codigo": {"arquivo": "Endpoint.cs", "linhas": ["var cmd = new Comando(id);", "var r = await handler.HandleAsync(cmd);"], "destaque": [2]}}]}
</script>
</div>

### Comparação

```html
<div data-oda="comparacao">
<script type="application/json">
{"esquerda": {"titulo": "Organização por camada", "linhas": ["Domain/Produto.cs", "Application/ProdutoService.cs", "Api/ProdutoEndpoints.cs"]},
 "direita": {"titulo": "Organização por caso de uso", "linhas": ["Domain/Produto.cs", "CriarProduto/CriarProdutoEndpoint.cs"]},
 "notas": ["A linha comum aos dois lados aparece sem destaque."]}
</script>
</div>
```

<div data-oda="comparacao">
<script type="application/json">
{"esquerda": {"titulo": "Organização por camada", "linhas": ["Domain/Produto.cs", "Application/ProdutoService.cs", "Api/ProdutoEndpoints.cs"]},
 "direita": {"titulo": "Organização por caso de uso", "linhas": ["Domain/Produto.cs", "CriarProduto/CriarProdutoEndpoint.cs"]},
 "notas": ["A linha comum aos dois lados aparece sem destaque."]}
</script>
</div>

### Linha do tempo

```html
<div data-oda="linha-do-tempo">
<script type="application/json">
{"atores": [{"id": "p", "rotulo": "Produtor"}, {"id": "f", "rotulo": "Fila"}, {"id": "c", "rotulo": "Consumidor"}],
 "eventos": [
  {"id": "e1", "de": "p", "para": "f", "mensagem": "envia o pedido 42"},
  {"id": "e2", "de": "f", "para": "c", "mensagem": "entrega o pedido 42", "depende": "e1"}],
 "falhas": [{"id": "consumidor-parado", "rotulo": "Consumidor parado", "ator": "c"}]}
</script>
</div>
```

<div data-oda="linha-do-tempo">
<script type="application/json">
{"atores": [{"id": "p", "rotulo": "Produtor"}, {"id": "f", "rotulo": "Fila"}, {"id": "c", "rotulo": "Consumidor"}],
 "eventos": [
  {"id": "e1", "de": "p", "para": "f", "mensagem": "envia o pedido 42"},
  {"id": "e2", "de": "f", "para": "c", "mensagem": "entrega o pedido 42", "depende": "e1"}],
 "falhas": [{"id": "consumidor-parado", "rotulo": "Consumidor parado", "ator": "c"}]}
</script>
</div>

Na linha do tempo, um evento cujo destino está parado fica retido no ator de origem, e um evento que depende de outro não entregue deixa de ocorrer.

## Progresso do aluno

Os objetivos marcados e o resultado do último quiz ficam gravados no `localStorage` do navegador, associados ao endereço da página. O progresso não é enviado a nenhum servidor e não é sincronizado entre navegadores ou dispositivos. Em janela privada ou com armazenamento bloqueado, a página funciona normalmente e o progresso não é gravado.

## Publicação de uma nova ODA

1. Criar a página em `docs/odas/oda-NN-<tema>.md` com a estrutura descrita acima.
2. No arquivo `catalogo/odas.yml`, alterar a situação da ODA para `disponivel` e acrescentar o campo `pagina` com o nome do arquivo.
3. Acrescentar a página à seção `ODAs` do `nav` em `mkdocs.yml`.
4. Executar os quatro portões descritos no `README.md`, que precisam terminar sem falhas antes do commit.
