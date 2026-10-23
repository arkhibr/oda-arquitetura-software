# Decisões técnicas

Cada decisão abaixo segue o formato de um registro de decisão: contexto, decisão, alternativas e consequências. O repositório não mantém ADRs próprias, então o contexto e as alternativas são **inferências** a partir do código e do histórico de commits. A decisão e as consequências são fatos verificáveis nos arquivos citados.

## D1. ODA como aplicação de página única, gerada de dados

- **Contexto.** Cada ODA reúne texto, trechos de código, terminais simulados, quizzes e diagramas, em sete etapas iguais.
- **Decisão.** O conteúdo reside em `odas/<oda>/oda.yml`, e o gerador produz um `index.html` por ODA que embute os dados em JSON e carrega o motor.
- **Alternativas.** Escrever cada ODA como página Markdown do MkDocs, ou como HTML manual.
- **Consequências.** O formato de uma ODA é verificado por código antes da publicação (`scripts/gerar_odas.py`). Em contrapartida, o autor de conteúdo precisa conhecer o esquema de blocos, e a interface não herda o tema do MkDocs, o que justifica a folha `motor/oda.css` separada.

## D2. Motor em JavaScript sem dependências e sem etapa de build

- **Contexto.** O motor é pequeno (cerca de 900 linhas nos módulos `motor/*.mjs`) e roda em navegadores atuais.
- **Decisão.** Módulos ES carregados diretamente, sem framework, bundler ou transpilador. O `package.json` não tem dependências de execução.
- **Alternativas.** React, Preact ou Web Components, com bundler.
- **Consequências.** Não há processo de build do front-end, e o arquivo lido é o arquivo servido. O custo é o código de DOM escrito à mão com o helper `h`, e a necessidade de manter dois núcleos parecidos (motor e página mestre).

## D3. Registro de blocos por tipo

- **Decisão.** Cada tipo de bloco é uma função registrada em `nucleo.mjs` com `registrarBloco(tipo, renderizar)`. O gerador mantém a tabela `OBRIGATORIOS` com o mesmo conjunto de tipos.
- **Consequências.** Acrescentar um tipo não exige alterar o laço de renderização. O preço é que o conjunto de tipos existe em dois lugares (Python e JavaScript), e nada impede a divergência além dos testes. O gerador rejeita tipos que não estão em `OBRIGATORIOS`, o que evita que um tipo escrito apenas no motor seja usado por engano.

## D4. Falha isolada por bloco

- **Decisão.** `renderizarBloco` captura qualquer exceção do renderizador e substitui o bloco por um aviso com `role="alert"`.
- **Consequências.** Um dado malformado que escapou da validação afeta um bloco, e o restante da ODA continua utilizável. O teste de navegador exige zero elementos `.bloco-erro` em cada ODA.

## D5. Nenhuma API que interpreta HTML

- **Decisão.** O motor monta o DOM por `createElement`, `textContent` e nós de texto. `textoRico` converte apenas o trecho entre crases em `<code>`. O teste `tests/js/motor-seguranca.test.mjs` falha se algum módulo usar `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval` ou `new Function`.
- **Consequências.** O conteúdo do YAML não pode injetar marcação, o que dispensa sanitização. Formatação além de código em linha (negrito, links) não é suportada nos textos dos blocos.
- **Pontos complementares.** O SVG do Mermaid é gerado com `securityLevel: 'strict'` e inserido por `DOMParser` e `importNode`. O JSON embutido na página escapa `</`.

## D6. Rastreabilidade do código estudado

- **Decisão.** O catálogo fixa um commit por repositório. Blocos `editor` com rótulo `arquivo` exigem `caminho` e `commit`, e o gerador rejeita o bloco se o commit diferir do fixado.
- **Consequências.** Atualizar a referência para um commit mais novo exige revisar todas as ODAs que citam trechos, e essa revisão fica sob controle do validador. Também é preciso atualizar `tests/test_catalogo.py::test_commits_de_referencia`, que registra os três commits esperados.

## D7. Honestidade sobre a origem da saída

- **Decisão.** Terminais, consoles de API e incidentes exigem o campo `origem`, com os valores `executado`, `codigo` ou `exemplo`. A interface marca como "saída ilustrativa" tudo que for `exemplo`.
- **Consequências.** O estudante distingue o que foi executado de verdade do que é ilustração, e o autor é obrigado a declarar essa diferença em cada saída.

## D8. Simulação determinística em vez de execução real

- **Decisão.** O terminal reconhece apenas os comandos listados no YAML, e o console de API apenas os cenários declarados. As mudanças de estado são descritas por `efeito` e `condicao`, e a linha do tempo calcula o resultado com a função pura `simular`.
- **Alternativas.** Terminal real em contêiner no navegador, ou backend de laboratório.
- **Consequências.** Não há infraestrutura para operar e o comportamento é reprodutível nos testes. O estudante não pode executar comandos fora do roteiro, e um comando novo precisa ser escrito no YAML.

## D9. Progresso apenas no navegador

- **Decisão.** O estado vai para `localStorage`, com acesso tolerante a falha (`criarArmazenamento` captura exceções de leitura e gravação).
- **Consequências.** Não há conta, servidor nem dado pessoal. O progresso não migra entre dispositivos nem navegadores, e a limpeza de dados do site apaga o histórico.

## D10. MkDocs apenas para a página mestre, ODAs fora do MkDocs

- **Decisão.** O hook do MkDocs gera a tabela do catálogo, e as ODAs são publicadas na raiz do site (`/oda-02/`), fora da árvore do MkDocs. O commit `0aa599c` retirou o prefixo `/novo/` que existia antes.
- **Consequências.** O `mkdocs.yml` só lista páginas de documentação. As ODAs existem apenas depois de `gerar_odas.py`, portanto o `mkdocs build --strict` não as enxerga, e o teste de navegador é quem cobre a abertura de cada ODA.

## D11. Portões de qualidade antes de publicar

- **Decisão.** A esteira executa testes Python, testes JavaScript, build estrito do MkDocs, geração das ODAs e testes de navegador, e só então publica.
- **Consequências.** Todo defeito estrutural de conteúdo é detectado antes do deploy. O teste `tests/test_publicacao.py` protege a própria esteira contra remoção acidental de um portão ou inversão da ordem.

## D12. Acessibilidade e movimento reduzido

- **Decisão.** As abas usam `role="tablist"`, `tab` e `tabpanel`, com navegação por setas. Regiões dinâmicas usam `aria-live`. A reprodução automática da linha do tempo respeita `prefers-reduced-motion`.
- **Consequências.** O teste de navegador também verifica a ausência de rolagem horizontal em 360 px de largura em todas as abas de todas as ODAs.
