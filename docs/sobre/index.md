# Sobre o portal

Esta seção documenta o código-fonte do portal de ODAs: o motivo de cada escolha de projeto, a pilha tecnológica, os componentes e o caminho para estender a aplicação. O público é composto por pessoas que vão manter o repositório, escrever novas ODAs ou alterar o motor que as executa.

O portal tem duas partes que compartilham o mesmo repositório e a mesma publicação. A página mestre, com o catálogo das 36 ODAs, é um site MkDocs Material. Cada ODA disponível (hoje 12) é uma aplicação de página única, gerada a partir de um arquivo `oda.yml` e executada por um motor em JavaScript sem dependências.

## Aprenda a criar uma ODA

A <a href="../../oda-criar/">ODA Como criar uma ODA</a> apresenta o fluxo de autoria e exemplos interativos de todos os componentes disponíveis, acompanhados de suas configurações YAML.

## Mapa da seção

| Página | Pergunta que responde |
| --- | --- |
| [Racional](racional.md) | Qual problema o portal resolve e quais princípios orientam o projeto? |
| [Pilha tecnológica](pilha.md) | Quais linguagens, ferramentas e versões sustentam o portal, e para que serve cada uma? |
| [Arquitetura e componentes](arquitetura.md) | Como o repositório se organiza e como os dados chegam ao navegador? |
| [Decisões técnicas](decisoes.md) | Por que o código é como é, e quais alternativas foram deixadas de lado? |
| [Compreender o código](compreender.md) | Por onde começar a leitura e como executar, testar e depurar localmente? |
| [Estender a aplicação](estender.md) | Como criar uma ODA, um tipo de bloco, um componente do portal ou uma página? |

## Ordem de leitura sugerida

1. Quem vai escrever conteúdo lê [Racional](racional.md), [Arquitetura e componentes](arquitetura.md) e a seção de nova ODA em [Estender a aplicação](estender.md).
2. Quem vai alterar o motor lê [Arquitetura e componentes](arquitetura.md), [Decisões técnicas](decisoes.md) e a seção de novo tipo de bloco em [Estender a aplicação](estender.md).
3. Quem vai operar a publicação lê [Pilha tecnológica](pilha.md) e a seção de portões de qualidade em [Compreender o código](compreender.md).

## Origem das informações

Cada afirmação desta seção foi conferida no repositório, e as páginas citam o arquivo correspondente. Quando um trecho descreve intenção e não comportamento, ele traz a indicação "inferência", porque o repositório registra o que o código faz e não registra o motivo de cada escolha.
