# Evidências das saídas executadas da ODA 20

Este arquivo registra as execuções que sustentam as saídas marcadas com origem `executado` em `oda.yml`. As execuções foram feitas em 09/10/2026, em macOS com .NET SDK 10.0.401, sobre o repositório `arkhibr/net-minimal-api` no commit `702145a`. As linhas abaixo são copiadas da saída dos comandos, com os caminhos locais removidos.

## Testes de cancelamento, sem alteração no repositório

Comando: `dotnet test tests/ProdutosAPI.Tests --filter CancelPedidoTests`

```text
Aprovado!  – Com falha:     0, Aprovado:     3, Ignorado:     0, Total:     3, Duração: 1 s - ProdutosAPI.Tests.dll (net10.0)
```

## Testes de confirmação, com a fatia criada e o handler sem registro

Primeira execução, com o teste `POST_Confirmar_DuasVezes_Retorna400` conferindo apenas o código de status:

```text
Com falha! – Com falha:     2, Aprovado:     1, Ignorado:     0, Total:     3, Duração: 765 ms - ProdutosAPI.Tests.dll (net10.0)
```

Segunda execução, com o mesmo teste conferindo também a mensagem de domínio no corpo da resposta:

```text
  Com falha ProdutosAPI.Tests.Integration.Pedidos.ConfirmarPedidoTests.POST_Confirmar_PedidoInexistente_Retorna404 [865 ms]
  Mensagem de erro:
   Expected response.StatusCode to be HttpStatusCode.NotFound {value: 404}, but found HttpStatusCode.BadRequest {value: 400}.
  Com falha ProdutosAPI.Tests.Integration.Pedidos.ConfirmarPedidoTests.POST_Confirmar_DuasVezes_Retorna400 [85 ms]
  Mensagem de erro:
   Expected corpo "" to contain "Apenas pedidos em rascunho podem ser confirmados.".
  Com falha ProdutosAPI.Tests.Integration.Pedidos.ConfirmarPedidoTests.POST_Confirmar_PedidoEmRascunho_Retorna200EConfirma [18 ms]
  Mensagem de erro:
   Expected response.StatusCode to be HttpStatusCode.OK {value: 200}, but found HttpStatusCode.BadRequest {value: 400}.
Com falha! – Com falha:     3, Aprovado:     0, Ignorado:     0, Total:     3, Duração: 967 ms - ProdutosAPI.Tests.dll (net10.0)
```

Suíte completa, com o handler sem registro (`dotnet test tests/ProdutosAPI.Tests`):

```text
  Com falha ProdutosAPI.Tests.Integration.Pedidos.ConfirmarPedidoTests.POST_Confirmar_PedidoInexistente_Retorna404 [1 s]
  Com falha ProdutosAPI.Tests.Integration.Pedidos.ConfirmarPedidoTests.POST_Confirmar_DuasVezes_Retorna400 [61 ms]
  Com falha ProdutosAPI.Tests.Integration.Pedidos.ConfirmarPedidoTests.POST_Confirmar_PedidoEmRascunho_Retorna200EConfirma [5 ms]
Com falha! – Com falha:     3, Aprovado:   143, Ignorado:     0, Total:   146, Duração: 1 s - ProdutosAPI.Tests.dll (net10.0)
```

## Testes de confirmação e suíte completa, com o handler registrado

```text
Aprovado!  – Com falha:     0, Aprovado:     3, Ignorado:     0, Total:     3, Duração: 791 ms - ProdutosAPI.Tests.dll (net10.0)
Aprovado!  – Com falha:     0, Aprovado:   146, Ignorado:     0, Total:   146, Duração: 894 ms - ProdutosAPI.Tests.dll (net10.0)
```

## Chamada sem token ao endpoint de confirmação

Um teste temporário, criado só para esta medição e depois removido, chamou `POST /api/v1/pedidos/99999/confirmar` sem o cabeçalho `Authorization` e imprimiu o código de status. A primeira execução manteve `.RequireAuthorization()` no endpoint, e a segunda retirou a linha.

```text
STATUS=401
STATUS=404
```

## Cenários do console de API

Os códigos de status dos cenários de cancelamento vêm dos testes de `tests/ProdutosAPI.Tests/Integration/Pedidos/CancelPedidoTests.cs`, executados na primeira seção deste arquivo. Os corpos de erro dos cenários 404 e 400 foram montados a partir do código e estão marcados com origem `codigo` em `oda.yml`.
