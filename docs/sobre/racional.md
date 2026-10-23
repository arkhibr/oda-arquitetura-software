# Racional

## Problema

A arquitetura de referência da Faciltech está distribuída em três repositórios: `arkhibr/frontend-react`, `arkhibr/net-minimal-api` e `arkhibr/aspire-aws`. Entender essa arquitetura exige ler código real, e a leitura isolada não ensina por que as fronteiras existem nem como elas falham. O portal oferece Objetos Digitais de Aprendizagem (ODAs) que conduzem essa leitura com exercícios, simulações e diagnóstico de falhas (`README.md` e [página mestre](../index.md)).

Cada ODA ocupa de 45 a 90 minutos, faixa imposta pela validação do catálogo (`hooks/catalogo.py:45`), e percorre sete etapas fixas: missão, conceito, leitura do código real, simulação, laboratório guiado, diagnóstico de incidentes e verificação (`scripts/gerar_odas.py:21`).

## Princípios observáveis no código

| Princípio | Como aparece no código |
| --- | --- |
| Conteúdo é dado, e o motor é genérico | Toda ODA é um `oda.yml`. O motor em `motor/` não contém texto didático, e o gerador `scripts/gerar_odas.py` o copia sem alterações para cada publicação |
| Conteúdo inválido não é publicado | O gerador valida cada ODA e aborta com código de saída 1 quando há erro (`scripts/gerar_odas.py:259`). O catálogo é validado antes de o MkDocs iniciar (`hooks/catalogo.py:125`) |
| O código estudado é fixo e rastreável | O catálogo fixa um commit por repositório, e todo trecho de arquivo citado numa ODA precisa declarar esse mesmo commit (`scripts/gerar_odas.py:55`) |
| Saída ilustrativa é identificada como tal | Todo terminal, console de API e incidente declara a origem (`executado`, `codigo` ou `exemplo`), e a origem `exemplo` exibe o selo "saída ilustrativa" (`motor/nucleo.mjs:50`) |
| O estudo não depende de servidor | O progresso fica no `localStorage` do navegador de quem estuda, e o resultado da geração é um conjunto de arquivos estáticos |
| Nenhuma dependência de execução no navegador, salvo o Mermaid | O motor usa módulos ES nativos, e a única importação externa é o Mermaid, carregado sob demanda (`motor/blocos-codigo.mjs:3`) |
| Falha de um bloco não derruba a ODA | Cada bloco é renderizado dentro de um `try/catch`, e a falha vira uma mensagem local (`motor/nucleo.mjs:40`) |

## Resultado de aprendizagem esperado

Cada ODA declara seus objetivos numa lista de verificação na aba Missão. A aba Verificação encerra com um quiz e um resumo do progresso por etapa. O estudante marca as etapas como concluídas, e o portal registra essa marca apenas no navegador dele.

## Escopo e estado de construção

O catálogo prevê 36 ODAs em sete trilhas, e 12 estão disponíveis: 00 a 09, 20 e 30. As demais constam como "Planejada" e não têm link. O campo `situacao` do catálogo controla essa diferença, e a validação impede que uma ODA marcada como disponível não tenha o arquivo `oda.yml` correspondente (`hooks/catalogo.py:61`).

!!! note "Inferência"
    A separação entre dados e motor, em vez de uma página HTML escrita à mão por ODA, indica que o projeto espera dezenas de ODAs com a mesma estrutura. A decisão reduz o custo marginal de cada ODA nova e concentra a correção de defeitos de interface num único lugar.
