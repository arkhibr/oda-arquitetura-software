# Evidências das saídas executadas da ODA 30

Este arquivo registra as execuções que sustentam as saídas marcadas com origem `executado` em `oda.yml`. As execuções foram feitas em 09/10/2026, em macOS com .NET SDK 10.0.401 e Docker 29.5.2 pelo Colima, sobre o repositório `arkhibr/aspire-aws` no commit `50a5344`.

## Primeira execução, no commit de referência sem alteração

Comando: `dotnet test scenarios/02-SQS.Basic/ --logger "console;verbosity=detailed"`. Todos os testes falharam, e o log do Aspire registrou as linhas abaixo.

```text
2: [sys] Could not create bind mount source path: ContainerName = localstack-tccabmam, Error = mkdir /var/run/docker.sock: permission denied
System.TimeoutException : LocalStack did not become healthy within 120s.
```

## Execuções numa cópia sem a montagem do socket

Como o Colima não expõe `/var/run/docker.sock`, a linha `.WithBindMount("/var/run/docker.sock", "/var/run/docker.sock")` foi retirada de `src/AppHost/Program.cs` numa cópia do repositório. A montagem só é usada pelo LocalStack para criar contêineres de Lambda, e nenhum dos cenários abaixo usa Lambda.

```text
Aprovado!  – Com falha:     0, Aprovado:     4, Ignorado:     0, Total:     4, Duração: 1 s - 02-SQS.Basic.dll (net10.0)
Aprovado!  – Com falha:     0, Aprovado:     3, Ignorado:     0, Total:     3, Duração: 414 ms - 04-SNS.Basic.dll (net10.0)
Aprovado!  – Com falha:     0, Aprovado:     1, Ignorado:     0, Total:     1, Duração: 43 ms - 09-SNS.SQS.Fanout.dll (net10.0)
Aprovado!  – Com falha:     0, Aprovado:     1, Ignorado:     0, Total:     1, Duração: 523 ms - 10-S3.SQS.Notification.dll (net10.0)
```

## Cenário 09 com saída detalhada

Os três estados do cenário estão reproduzidos integralmente no terminal da aba Laboratório. O estado original resultou em `Mensagens recebidas: 1` para `fanout-queue-1` e `fanout-queue-2`, com 1 teste aprovado. Com a terceira fila criada, autorizada e inscrita, as três filas receberam 1 mensagem e o teste foi aprovado. Com `Queue3Url` retirada apenas do laço de assinatura da Fixture, `fanout-queue-3` recebeu 0 mensagens e o teste falhou com `Assert.Single() Failure: The collection was empty`.

## Cenário 09 com saída resumida

Comando: `dotnet test scenarios/09-SNS.SQS.Fanout/`, executado na mesma cópia nos dois estados alterados do laboratório. Com a terceira fila criada e verificada, mas fora do laço de assinatura, o teste falhou com as linhas abaixo.

```text
  Com falha Scenarios.SNS.SQS.Fanout.SnsSqsFanoutTests.Publish_ShouldDeliverMessageToBothQueues [5 s]
  Mensagem de erro:
   Assert.Single() Failure: The collection was empty
Com falha! – Com falha:     1, Aprovado:     0, Ignorado:     0, Total:     1, Duração: 5 s - 09-SNS.SQS.Fanout.dll (net10.0)
```

Com a terceira fila incluída também no laço de assinatura, o teste foi aprovado.

```text
Aprovado!  – Com falha:     0, Aprovado:     1, Ignorado:     0, Total:     1, Duração: 48 ms - 09-SNS.SQS.Fanout.dll (net10.0)
```
