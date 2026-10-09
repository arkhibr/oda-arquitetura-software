# Evidências das saídas executadas da ODA 02

Este arquivo registra as execuções que sustentam as saídas marcadas com origem `executado` em `oda.yml`. As execuções foram feitas em 09/10/2026, em macOS com Node 24.16.0, sobre o repositório `arkhibr/frontend-react` no commit `2179313`, numa cópia do clone com as dependências já instaladas, cujo caminho local aparece abreviado como `.../frontend-react` nas saídas abaixo.

## Lint no estado original

Comando: `npm run lint`, com código de saída 0.

```text
> frontend-react@0.0.0 lint
> eslint src/
```

## Lint com a importação de features em shared

Alteração: duas linhas acrescentadas após as importações de `src/shared/api/httpClient.ts`, a primeira com `import { loginRequest } from '@/features/auth/loginRequest'` e a segunda com `export const violacaoDeFronteira = loginRequest`. Comando: `npm run lint`, com código de saída 1.

```text
> frontend-react@0.0.0 lint
> eslint src/


.../frontend-react/src/shared/api/httpClient.ts
  4:30  error  Dependencies to elements of type "features" are not allowed in elements of type "shared". Denied by rule at index 0  boundaries/dependencies

✖ 1 problem (1 error, 0 warnings)
```

A mesma saída, na mesma linha e coluna, foi obtida com o caminho relativo `'../../features/auth/loginRequest'` no lugar do alias.

## Lint com uma pasta fora dos elementos declarados

Alteração: criação de `src/processes/fluxo.ts` com o conteúdo abaixo. Comando: `npm run lint`, com código de saída 0.

```ts
import { loginRequest } from '@/features/auth/loginRequest'
import LoginPage from '@/pages/login'
export const fluxo = [loginRequest, LoginPage]
```

```text
> frontend-react@0.0.0 lint
> eslint src/
```

Depois de cada alteração, o arquivo foi restaurado com `git checkout -- src` e a pasta criada foi apagada, e o lint voltou a terminar com código de saída 0.
