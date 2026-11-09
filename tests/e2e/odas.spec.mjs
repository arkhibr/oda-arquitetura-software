import { test, expect } from '@playwright/test';

const ODAS = ['oda-00', 'oda-01', 'oda-02', 'oda-03', 'oda-04', 'oda-05', 'oda-06', 'oda-07', 'oda-08', 'oda-09', 'oda-10', 'oda-11', 'oda-12', 'oda-13', 'oda-14', 'oda-15', 'oda-16', 'oda-17', 'oda-18', 'oda-19', 'oda-20', 'oda-21', 'oda-22', 'oda-23', 'oda-24', 'oda-25', 'oda-26', 'oda-27', 'oda-28', 'oda-29', 'oda-30', 'oda-31', 'oda-32', 'oda-33', 'oda-34', 'oda-35'];
const ABAS = ['objetivos', 'conceito', 'simulacao', 'laboratorio', 'diagnostico', 'verificacao'];

function vigiarErros(page) {
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  return erros;
}

for (const oda of ODAS) {
  test(`${oda}: seis abas, sem bloco com erro e com pelo menos 60 interações`, async ({ page }) => {
    const erros = vigiarErros(page);
    await page.goto(`/${oda}/`);
    const abas = page.getByRole('tab');
    await expect(abas).toHaveCount(6);
    for (let i = 0; i < 6; i += 1) await abas.nth(i).click();
    await expect(page.locator('.bloco-erro')).toHaveCount(0);
    expect(await page.locator('#app').locator('button, input, select, summary').count()).toBeGreaterThanOrEqual(60);
    expect(erros).toEqual([]);
  });

  test(`${oda}: sem rolagem horizontal em 360 px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const aba of ABAS) {
      await page.goto(`/${oda}/#${aba}`);
      await expect(page.getByRole('tab')).toHaveCount(6);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    }
  });
}

test('oda-02: lint acusa a violação depois do passo 3 e volta a passar no passo 6', async ({ page }) => {
  await page.goto('/oda-02/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  await campo.fill('npm run lint');
  await campo.press('Enter');
  await expect(tela).not.toContainText('boundaries/dependencies');
  await painel.getByLabel('Passo 3 concluído').check();
  await campo.fill('npm run lint');
  await campo.press('Enter');
  await expect(tela).toContainText('boundaries/dependencies');
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await painel.getByLabel('Passo 6 concluído').check();
  await campo.fill('npm run lint');
  await campo.press('Enter');
  await expect(tela).not.toContainText('boundaries/dependencies');
});

test('oda-03: o teste da densidade falha depois do passo 2 e passa depois do passo 4', async ({ page }) => {
  await page.goto('/oda-03/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async () => { await campo.fill('npx vitest run src/shared/lib/store'); await campo.press('Enter'); };
  await rodar();
  await expect(tela).toContainText('Tests  7 passed (7)');
  await painel.getByLabel('Passo 2 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  1 failed | 7 passed (8)');
  await painel.getByLabel('Passo 4 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  8 passed (8)');
});

test('oda-03: o logout limpa o ramo auth e mantém o ramo ui', async ({ page }) => {
  await page.goto('/oda-03/#simulacao');
  const painel = page.locator('#painel-simulacao');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await campo.fill(comando); await campo.press('Enter'); };
  await rodar('store.dispatch(login({ token: TOKEN }))');
  await rodar('store.dispatch(toggleSidebar())');
  await rodar('store.dispatch(logout())');
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar('store.getState().auth');
  await expect(tela).toContainText('"isAuthenticated": false');
  await rodar('store.getState().ui');
  await expect(tela).toContainText('"sidebarOpen": false');
});

test('oda-04: o teste do shell falha depois do passo 5 e passa depois do passo 7', async ({ page }) => {
  await page.goto('/oda-04/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async () => { await campo.fill('npx vitest run src/app/providers'); await campo.press('Enter'); };
  await rodar();
  await expect(tela).toContainText('No test files found');
  await painel.getByLabel('Passo 5 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  2 failed (2)');
  await painel.getByLabel('Passo 7 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  2 passed (2)');
});

test('oda-04: sem o sessionMonitor, o evento do 401 fica sem consumo', async ({ page }) => {
  await page.goto('/oda-04/#simulacao');
  const tempo = page.locator('#painel-simulacao .tempo').first();
  await tempo.getByLabel('O sessionMonitor não foi iniciado, como no commit 2179313').check();
  for (let i = 0; i < 6; i += 1) await tempo.getByRole('button', { name: 'Próximo evento' }).click();
  await expect(tempo.locator('.tempo__resumo')).toContainText('window (eventos DOM): 1');
});

test('oda-05: o teste do mínimo falha sem módulo, sem hash e com o contrato quebrado', async ({ page }) => {
  await page.goto('/oda-05/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const limpar = () => painel.getByRole('button', { name: 'Limpar' }).click();
  const rodar = async () => { await campo.fill('npx vitest run src/app/mfe/__tests__/mfeMinimo.test.ts'); await campo.press('Enter'); };
  await painel.getByLabel('Passo 2 concluído').check();
  await rodar();
  await expect(tela).toContainText('Tests  4 failed (4)');
  await painel.getByLabel('Passo 4 concluído').check();
  await limpar(); await rodar();
  await expect(tela).toContainText('Tests  1 failed | 3 passed (4)');
  await painel.getByLabel('Passo 6 concluído').check();
  await limpar(); await rodar();
  await expect(tela).toContainText('Tests  4 passed (4)');
  await painel.getByLabel('Passo 8 concluído').check();
  await limpar(); await rodar();
  await expect(tela).toContainText('não exporta unmount()');
  await painel.getByLabel('Passo 8 concluído').uncheck();
  await limpar(); await rodar();
  await expect(tela).toContainText('Tests  4 passed (4)');
});

test('oda-06: o teste do manifesto falha antes da entrada e passa depois', async ({ page }) => {
  await page.goto('/oda-06/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async () => { await campo.fill('npx vitest run src/app/mfe/__tests__/manifestoPublicado.test.ts'); await campo.press('Enter'); };
  await painel.getByLabel('Passo 2 concluído').check();
  await rodar();
  await expect(tela).toContainText('Tests  2 failed (2)');
  await painel.getByLabel('Passo 4 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  2 passed (2)');
});

test('oda-07: o teste da falha interna falha antes do boundary e passa depois', async ({ page }) => {
  await page.goto('/oda-07/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async () => { await campo.fill('(cd mfes/endereco && npx vitest run src/__tests__/falhaInterna.test.tsx)'); await campo.press('Enter'); };
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar();
  await expect(tela).toContainText('Errors  1 error');
  await painel.getByLabel('Passo 7 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  1 passed (1)');
});

test('oda-08: o hash do manifesto só acompanha o bundle depois do deploy da raiz', async ({ page }) => {
  await page.goto('/oda-08/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const limpar = () => painel.getByRole('button', { name: 'Limpar' }).click();
  const rodar = async (c) => { await campo.fill(c); await campo.press('Enter'); };
  const grep = `grep -A4 '"id": "endereco"' public/mfe-manifest.json`;
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar('(cd mfes/endereco && npm run build && npm run deploy)');
  await limpar(); await rodar(grep);
  await expect(tela).toContainText('sha256-dK2p5Vm48WkUzvjw6kZZh5eoONWmTxFA8RKXB5FO6bM=');
  await rodar('npm run deploy');
  await limpar(); await rodar(grep);
  await expect(tela).toContainText('sha256-+mvU7BTnqjJqM684m1pOBjoyutPPAy14guWBbJU/w+4=');
});

test('oda-09: o teste do tema falha sem o CSS bruto configurado e passa depois', async ({ page }) => {
  await page.goto('/oda-09/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async () => { await campo.fill('(cd mfes/endereco && npx vitest run src/theme)'); await campo.press('Enter'); };
  await painel.getByLabel('Passo 4 concluído').check();
  await painel.getByLabel('Passo 8 concluído').check();
  await rodar();
  await expect(tela).toContainText('Tests  2 failed | 2 passed (4)');
  await painel.getByLabel('Passo 10 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  4 passed (4)');
});

test('oda-10: o teste no servidor do Node falha antes da cópia da resposta e o limite barra a terceira proposta', async ({ page }) => {
  await page.goto('/oda-10/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar('(cd gateway && npx vitest run src/__tests__/servidorNode.test.ts)');
  await expect(tela).toContainText('expected 500 to be 200');
  await painel.getByLabel('Passo 7 concluído').check();
  await rodar('(cd gateway && npx vitest run src/__tests__/servidorNode.test.ts)');
  await expect(tela).toContainText('Tests  1 passed (1)');
  await painel.getByLabel('Passo 9 concluído').check();
  await painel.getByLabel('Passo 11 concluído').check();
  await rodar("for i in 1 2 3; do curl -s -w ' %{http_code}\\n' -X POST -H \"Authorization: Bearer $TOKEN\" -H 'Content-Type: application/json' -d '{\"valorLiquido\":10000,\"numeroParcelas\":24,\"linhaCredito\":205,\"dataLiberacao\":\"2026-06-30\"}' http://localhost:4000/bff/emprestimo/propostas; done");
  await expect(tela).toContainText('rate_limit_exceeded');
  await rodar('(cd gateway && npx tsc --noEmit)');
  await expect(tela).toContainText('TS2741');
});

test('oda-11: o teste do vencimento falha antes do mapeamento e a suíte acusa o teste de contrato antigo', async ({ page }) => {
  await page.goto('/oda-11/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar('(cd bffs/emprestimo && npx vitest run src/__tests__/vencimentoFinal.test.ts)');
  await expect(tela).toContainText('Tests  4 failed (4)');
  await painel.getByLabel('Passo 7 concluído').check();
  await rodar('(cd bffs/emprestimo && npx vitest run)');
  await expect(tela).toContainText('Tests  1 failed | 65 passed (66)');
  await painel.getByLabel('Passo 9 concluído').check();
  await rodar('(cd bffs/emprestimo && npx vitest run)');
  await expect(tela).toContainText('Tests  66 passed (66)');
  await rodar('curl -s -H "X-Internal-Gateway-Key: development-only-gateway-key" -H "X-Authenticated-Subject: user1" http://localhost:4001/contratos/123456-7');
  await expect(tela).toContainText('"vencimentoFinal":null');
});

test('oda-12: a renomeação passa sem o contrato e para o tsc do microfrontend com o contrato', async ({ page }) => {
  await page.goto('/oda-12/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  const renomear = "perl -pi -e 's/\\bnumero\\b/numeroDoImovel/g' bffs/endereco/src/*.ts bffs/endereco/src/__tests__/*.ts";
  await rodar(renomear);
  await rodar('(cd mfes/endereco && npx tsc --noEmit)');
  await expect(tela).toContainText('não percebe a mudança no BFF');
  await rodar('git checkout -- bffs/endereco/src/legacyBackend.ts bffs/endereco/src/validation.ts bffs/endereco/src/__tests__');
  for (const passo of [5, 7]) await painel.getByLabel(`Passo ${passo} concluído`).check();
  await rodar('(cd mfes/endereco && npx tsc --noEmit)');
  await expect(tela).toContainText("on type 'unknown'");
  await painel.getByLabel('Passo 9 concluído').check();
  await rodar(renomear);
  await rodar('(cd mfes/endereco && npx tsc --noEmit)');
  await expect(tela).toContainText('"cep" | "logradouro" | "numeroDoImovel"');
});

test('oda-13: o teste de Trusted Types falha com o MSW e passa com a política default', async ({ page }) => {
  await page.goto('/oda-13/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  const teste = 'npx playwright test tests/e2e/trustedTypes.spec.ts --project=chromium --reporter=list';
  await painel.getByLabel('Passo 3 concluído').check();
  await rodar(teste);
  await expect(tela).toContainText('ServiceWorkerContainer register|/mockServiceWorker.js');
  await painel.getByLabel('Passo 6 concluído').check();
  await rodar(teste);
  await expect(tela).toContainText('3 passed');
});

test('oda-14: o teste do config.json falha com HTML e o benchmark mostra o ganho depois da correção', async ({ page }) => {
  await page.goto('/oda-14/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 2 concluído').check();
  await rodar('npx vitest run src/shared/config');
  await expect(tela).toContainText('Tests  1 failed | 3 passed (4)');
  await rodar('npx tsc --noEmit -p tsconfig.app.json && npm run lint');
  await expect(tela).toContainText('boundaries/dependencies');
  for (const passo of [8, 10]) await painel.getByLabel(`Passo ${passo} concluído`).check();
  await rodar('npx vitest bench --run src/app/mfe --compare /tmp/bench-ordem.json');
  await expect(tela).toContainText('[3.56x]');
});

test('oda-15: o lock sincronizado libera a imagem e o healthcheck corrigido a deixa saudável', async ({ page }) => {
  await page.goto('/oda-15/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await rodar('docker build --progress=plain -t portal-web:oda15 .');
  await expect(tela).toContainText('npm error code EUSAGE');
  await painel.getByLabel('Passo 3 concluído').check();
  await rodar("docker inspect --format '{{.State.Health.Status}}' portal-oda15");
  await expect(tela).toContainText('unhealthy');
  await painel.getByLabel('Passo 7 concluído').check();
  await rodar("docker inspect --format '{{.State.Health.Status}}' portal-oda15");
  await expect(tela).not.toContainText('unhealthy');
  await expect(tela).toContainText('healthy');
});

test('oda-16: o setup falha pela referência removida e passa depois das duas correções', async ({ page }) => {
  await page.goto('/oda-16/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await rodar('bash setup.sh');
  await expect(tela).toContainText('error CS0234');
  await painel.getByLabel('Passo 4 concluído').check();
  await rodar('dotnet test');
  await expect(tela).toContainText('Aprovado:    47');
  await rodar('bash setup.sh');
  await expect(tela).toContainText('MSB3030');
  await painel.getByLabel('Passo 7 concluído').check();
  await rodar('bash setup.sh');
  await expect(tela).toContainText('Compilação com êxito.');
});

test('oda-17: a fatia nova nasce aberta e o grupo dos Pedidos aplica a autorização', async ({ page }) => {
  await page.goto('/oda-17/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  const teste = 'dotnet test tests/ProdutosAPI.Tests --filter ContarPedidosTests';
  for (const passo of [2, 4]) await painel.getByLabel(`Passo ${passo} concluído`).check();
  await rodar(teste);
  await expect(tela).toContainText('found HttpStatusCode.OK');
  await painel.getByLabel('Passo 7 concluído').check();
  await rodar(teste);
  await expect(tela).toContainText('Com falha:     0, Aprovado:     3');
});

test('oda-18: o status inexistente passa de 200 a 400 depois da validação', async ({ page }) => {
  await page.goto('/oda-18/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests --filter FiltroStatusTests');
  await expect(tela).toContainText('Com falha:     2, Aprovado:     1');
  await painel.getByLabel('Passo 7 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests --filter FiltroStatusTests');
  await expect(tela).toContainText('Com falha:     0, Aprovado:     3');
});

test('oda-19: o teste de arquitetura acusa a Infrastructure na API e passa depois da mudança', async ({ page }) => {
  await page.goto('/oda-19/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 3 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests --filter DependenciasCatalogoTests');
  await expect(tela).toContainText('to not contain "Catalogo.Infrastructure"');
  await painel.getByLabel('Passo 6 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests --filter DependenciasCatalogoTests');
  await expect(tela).toContainText('Com falha:     0, Aprovado:     4');
});

test('oda-21: o agregado aceita oito unidades com estoque cinco até a correção', async ({ page }) => {
  await page.goto('/oda-21/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  const adicionar = `curl -s -w ' %{http_code}\\n' -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"produtoId":1,"quantidade":4}' http://localhost:5000/api/v1/pedidos/1/itens`;
  await rodar(adicionar);
  await expect(tela).toContainText('"quantidade":8');
  await painel.getByLabel('Passo 3 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests --filter PedidoInvariantesTests');
  await expect(tela).toContainText('Quantidade máxima por item é 999.');
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar(adicionar);
  await expect(tela).toContainText('sem estoque suficiente');
});

test('oda-22: o JSON ilegível muda de 500 em Development para problem+json depois da correção', async ({ page }) => {
  await page.goto('/oda-22/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  const json = `curl -s -i -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"nome":' http://localhost:5000/api/v1/catalogo/produtos | tr -d '\\r' | grep -i -E '^HTTP|^content-type|^content-length|^\\{'`;
  await rodar('ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --urls http://localhost:5000');
  await rodar(json);
  await expect(tela).toContainText('500 Internal Server Error');
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar(json);
  await expect(tela).toContainText('application/problem+json');
});

test('oda-23: testes verdes e API parada até a migration do índice filtrado', async ({ page }) => {
  await page.goto('/oda-23/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  for (const passo of [3, 5, 7]) await painel.getByLabel(`Passo ${passo} concluído`).check();
  await rodar('dotnet test tests/ProdutosAPI.Tests --filter VarianteSkuTests');
  await expect(tela).toContainText('Com falha:     0, Aprovado:     3');
  await rodar('rm -f produtos-api.db && dotnet run --launch-profile http');
  await expect(tela).toContainText('PendingModelChangesWarning');
  await painel.getByLabel('Passo 9 concluído').check();
  await rodar('rm -f produtos-api.db && dotnet run --launch-profile http');
  await expect(tela).toContainText('Now listening on: http://localhost:5000');
});

test('oda-24: o login aceita trinta senhas erradas até a política particionada', async ({ page }) => {
  await page.goto('/oda-24/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  const chutes = `for i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code}\\n' -X POST -H 'Content-Type: application/json' -d '{"email":"admin@example.com","senha":"chute'$i'"}' http://127.0.0.1:5000/api/v1/auth/login; done | sort | uniq -c`;
  await rodar(chutes);
  await expect(tela).toContainText('30 401');
  await painel.getByLabel('Passo 6 concluído').check();
  await rodar(chutes);
  await expect(tela).toContainText('25 429');
});

test('oda-25: a mesma chave com outro corpo passa de 201 a 409 depois da troca do middleware', async ({ page }) => {
  await page.goto('/oda-25/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  const primeira = `post pedido-123 '{"itens":[{"produtoId":2,"quantidade":1}]}'`;
  const outro = `post pedido-123 '{"itens":[{"produtoId":3,"quantidade":5}]}'`;
  await rodar(primeira);
  await expect(tela).toContainText('Location: /api/v1/pedidos/1');
  await rodar(primeira);
  await expect(tela).not.toContainText('Location: /api/v1/pedidos/1');
  await rodar(outro);
  await expect(tela).toContainText('201 Created');
  await painel.getByLabel('Passo 6 concluído').check();
  await rodar(outro);
  await expect(tela).toContainText('409 Conflict');
});

test('oda-26: a devolução repetida com a mesma chave passa de nova devolução a 200 depois da correção do servidor', async ({ page }) => {
  await page.goto('/oda-26/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await rodar('devolver dev-1 60');
  await expect(tela).toContainText('201 Created');
  await rodar('devolver dev-1 70');
  await expect(tela).toContainText('201 Created');
  await painel.getByLabel('Passo 8 concluído').check();
  await rodar('devolver dev-1 60');
  await expect(tela).toContainText('201 Created');
  await rodar('devolver dev-1 60');
  await expect(tela).toContainText('200 OK');
  await rodar('devolver dev-1 70');
  await expect(tela).toContainText('409 Conflict');
});

test('oda-27: a mudança de modelo sem migration passa na suíte antiga e derruba a suíte com a factory nova', async ({ page }) => {
  await page.goto('/oda-27/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async (comando) => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 2 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests');
  await expect(tela).toContainText('Aprovado:   143');
  await rodar('git checkout src/Shared/Data/AppDbContext.cs');
  await painel.getByLabel('Passo 5 concluído').check();
  await painel.getByLabel('Passo 7 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests');
  await expect(tela).toContainText('Aprovado:   146');
  await painel.getByLabel('Passo 9 concluído').check();
  await rodar('dotnet test tests/ProdutosAPI.Tests');
  await expect(tela).toContainText('Com falha:    49');
});

test('oda-28: a fixture compartilhada derruba o teste de contagem até o bucket ganhar nome único', async ({ page }) => {
  await page.goto('/oda-28/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const comando = `inicio=$(date +%s); dotnet test scenarios/01-S3.Basic 2>&1 | grep -E '^  Com falha|Assert\\.|Expected:|Actual:|Aprovado!|Com falha!'; echo "$(( $(date +%s) - inicio )) s"`;
  const rodar = async () => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await rodar();
  await expect(tela).toContainText('Aprovado:     5');
  await painel.getByLabel('Passo 2 concluído').check();
  await painel.getByLabel('Passo 4 concluído').check();
  await rodar();
  await expect(tela).toContainText('Actual:   3');
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar();
  await expect(tela).toContainText('Aprovado:     6');
});

test('oda-29: o carregador passa de dez parâmetros a doze e depois decifra o SecureString', async ({ page }) => {
  await page.goto('/oda-29/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const comando = `dotnet test scenarios/05-SSM.Basic 2>&1 | grep -E '^  Com falha|Assert\\.|Expected:|Actual:|Aprovado!|Com falha!' | sed -E 's/ \\[[0-9.]+ m?s\\]//'`;
  const rodar = async () => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 3 concluído').check();
  await rodar();
  await expect(tela).toContainText('Actual:   10');
  await painel.getByLabel('Passo 4 concluído').check();
  await rodar();
  await expect(tela).toContainText('kms:alias/aws/ssm:super-secret');
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar();
  await expect(tela).toContainText('Aprovado:     4');
});

test('oda-31: a reserva que lê e grava aprova dez vendas e a condicional aprova cinco', async ({ page }) => {
  await page.goto('/oda-31/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const comando = `dotnet test scenarios/03-DynamoDB.Basic 2>&1 | grep -E '^  Com falha|Assert\\.|Expected:|Actual:|PostgresException|Aprovado!|Com falha!' | sed -E 's/ \\[[0-9.]+ m?s\\]//'`;
  const rodar = async () => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 3 concluído').check();
  await rodar();
  await expect(tela).toContainText('Actual:   10');
  await painel.getByLabel('Passo 4 concluído').check();
  await rodar();
  await expect(tela).toContainText('Aprovado:     5');
});

test('oda-34: a segunda execução do mesmo pedido passa de FAILED a duplicado com o Catch', async ({ page }) => {
  await page.goto('/oda-34/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const comando = `dotnet test scenarios/15-StepFunctions.Orchestration 2>&1 | grep -E '^  Com falha|segunda execução|Aprovado!|Com falha!|Ignorado!' | sed -E 's/ \\[[0-9.]+ m?s\\]//'`;
  const rodar = async () => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await rodar();
  await expect(tela).toContainText('Ignorado:     2');
  await painel.getByLabel('Passo 4 concluído').check();
  await rodar();
  await expect(tela).toContainText('FAILED DynamoDB.ConditionalCheckFailedException');
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar();
  await expect(tela).toContainText('Aprovado:     1');
});

test('oda-32: a mensagem inválida só chega à fila de mensagens mortas depois da RedrivePolicy', async ({ page }) => {
  await page.goto('/oda-32/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const comando = `sincronizar && docker exec aspire-linux dotnet test scenarios/08-SQS.Lambda.Consumer 2>&1 | grep -E '^  Failed |A mensagem inválida|Passed!|Failed!' | sed -E 's/ \\[[0-9 ms.]+\\]//'`;
  const rodar = async () => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await rodar();
  await expect(tela).toContainText('Passed:     1');
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar();
  await expect(tela).toContainText('TimeoutException');
  await painel.getByLabel('Passo 6 concluído').check();
  await rodar();
  await expect(tela).toContainText('Passed:     2');
});

test('oda-33: o arquivo copiado para no caminho até a notificação aceitar todos os eventos de criação', async ({ page }) => {
  await page.goto('/oda-33/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const comando = `sincronizar && docker exec aspire-linux dotnet test scenarios/12-Pipeline.S3.SQS.Lambda.DynamoDB 2>&1 | grep -E '^  Failed |nenhum item chegou|Passed!|Failed!' | sed -E 's/ \\[[0-9 ms.]+\\]//'`;
  const rodar = async () => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await painel.getByLabel('Passo 3 concluído').check();
  await rodar();
  await expect(tela).toContainText('nenhum item chegou ao DynamoDB');
  await painel.getByLabel('Passo 4 concluído').check();
  await rodar();
  await expect(tela).toContainText('Passed:     2');
});

test('oda-35: a oferta sem regra passa a chegar à fila de revisão depois da mudança no roteador', async ({ page }) => {
  await page.goto('/oda-35/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const comando = `sincronizar && docker exec aspire-linux dotnet test scenarios/16-Pipeline.Scheduler.Router 2>&1 | grep -E '^  Failed |TimeoutException|Passed!|Failed!' | sed -E 's/ \\[[0-9 ms.]+\\]//'`;
  const rodar = async () => { await painel.getByRole('button', { name: 'Limpar' }).click(); await campo.fill(comando); await campo.press('Enter'); };
  await rodar();
  await expect(tela).toContainText('Passed:     4');
  await painel.getByLabel('Passo 4 concluído').check();
  await rodar();
  await expect(tela).toContainText('TimeoutException');
  await painel.getByLabel('Passo 5 concluído').check();
  await rodar();
  await expect(tela).toContainText('Passed:     5');
});

test('oda-30: linha do tempo retém a mensagem na fila 2 quando a leitura não é executada', async ({ page }) => {
  await page.goto('/oda-30/#simulacao');
  const tempo = page.locator('#painel-simulacao .tempo').first();
  await tempo.getByLabel('A leitura da fila 2 não é executada').check();
  for (let i = 0; i < 5; i += 1) await tempo.getByRole('button', { name: 'Próximo evento' }).click();
  await expect(tempo.locator('.tempo__resumo')).toContainText('fanout-queue-2: 1');
});

test('oda-30: terminal acompanha a extensão do cenário 09', async ({ page }) => {
  await page.goto('/oda-30/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const rodar = async () => { await campo.fill('dotnet test scenarios/09-SNS.SQS.Fanout/ --logger "console;verbosity=detailed"'); await campo.press('Enter'); };
  await rodar();
  await expect(tela).not.toContainText('fanout-queue-3');
  await painel.getByLabel('Passo 5 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('fanout-queue-3');
  await expect(tela).toContainText('Aprovados: 1');
  await painel.getByLabel('Passo 7 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Assert.Single() Failure: The collection was empty');
});

test('oda-30: comando curto falha sem a assinatura e passo 7 isolado não simula a fila 3', async ({ page }) => {
  await page.goto('/oda-30/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  const limpar = () => painel.getByRole('button', { name: 'Limpar' }).click();
  await painel.getByLabel('Passo 7 concluído').check();
  await campo.fill('dotnet test scenarios/09-SNS.SQS.Fanout/ --logger "console;verbosity=detailed"');
  await campo.press('Enter');
  await expect(tela).not.toContainText('fanout-queue-3');
  await limpar();
  await painel.getByLabel('Passo 5 concluído').check();
  await campo.fill('dotnet test scenarios/09-SNS.SQS.Fanout/');
  await campo.press('Enter');
  await expect(tela).toContainText('Com falha:     1');
});

test('oda-30: desmarcar o passo de desfazer não liga estados e o checkout do terminal desmarca os passos', async ({ page }) => {
  await page.goto('/oda-30/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  const tela = painel.locator('.terminal__tela');
  await painel.getByLabel('Passo 9 concluído').check();
  await painel.getByLabel('Passo 9 concluído').uncheck();
  await campo.fill('dotnet test scenarios/09-SNS.SQS.Fanout/ --logger "console;verbosity=detailed"');
  await campo.press('Enter');
  await expect(tela).not.toContainText('fanout-queue-3');
  await painel.getByLabel('Passo 5 concluído').check();
  await campo.fill('git checkout -- scenarios');
  await campo.press('Enter');
  await expect(painel.getByLabel('Passo 5 concluído')).not.toBeChecked();
});

test('oda-02: desmarcar o passo 6 não liga a violação', async ({ page }) => {
  await page.goto('/oda-02/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  await painel.getByLabel('Passo 6 concluído').check();
  await painel.getByLabel('Passo 6 concluído').uncheck();
  await campo.fill('npm run lint');
  await campo.press('Enter');
  await expect(painel.locator('.terminal__tela')).not.toContainText('boundaries/dependencies');
});

test('página mestre leva a cada ODA disponível e cada ODA volta ao catálogo', async ({ page }) => {
  for (const oda of ODAS) {
    await page.goto('/');
    await page.locator(`a[href="${oda}/"]`).click();
    await expect(page.getByRole('tab')).toHaveCount(6);
    await page.getByRole('link', { name: 'Catálogo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Catálogo de ODAs' })).toBeVisible();
  }
});

test('o aluno não vê etiquetas internas de origem, só a marca de saída ilustrativa', async ({ page }) => {
  await page.goto('/oda-00/#objetivos');
  const objetivos = page.locator('#painel-objetivos');
  await objetivos.locator('.terminal__cenarios button').first().click();
  await expect(objetivos.locator('.terminal__tela')).toContainText('saída ilustrativa');
  for (const oda of ODAS) {
    for (const aba of ABAS) {
      await page.goto(`/${oda}/#${aba}`);
      const texto = await page.locator(`#painel-${aba}`).innerText();
      expect(texto).not.toMatch(/origem: |\bexecutado\b|\bcodigo\b|produção desta ODA|foi produzida/);
    }
  }
});


test('guia de autoria: acesso pela seção Sobre e componentes renderizados', async ({ page }) => {
  const erros = vigiarErros(page);
  // O GitHub Pages publica o site em um subcaminho; na raiz, um "../" excedente passaria despercebido.
  for (const [pagina, esperado] of [['sobre/', '/base/oda-criar/'], ['sobre/estender/', '/base/oda-criar/']]) {
    await page.goto('/' + pagina);
    const href = await page.getByRole('link', { name: 'ODA Como criar uma ODA' }).getAttribute('href');
    expect(new URL(href, 'https://exemplo.test/base/' + pagina).pathname).toBe(esperado);
  }
  await page.goto('/sobre/');
  await page.getByRole('link', { name: 'ODA Como criar uma ODA' }).click();
  await expect(page).toHaveURL(/\/oda-criar\//);
  await expect(page.getByRole('tab')).toHaveCount(6);
  for (const aba of ABAS) {
    await page.getByRole('tab', { name: new RegExp(aba === 'objetivos' ? 'Objetivos' : aba === 'conceito' ? 'Conceito e código' : aba === 'simulacao' ? 'Simulações' : aba === 'laboratorio' ? 'Crie sua ODA' : aba === 'diagnostico' ? 'Diagnóstico' : 'Verificação') }).click();
    await expect(page.locator('.bloco-erro')).toHaveCount(0);
  }
  expect(erros).toEqual([]);
});

test('editor: anotação flutuante abre e fecha pelo marcador', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/oda-20/#conceito');
  const editor = page.locator('.editor').filter({ has: page.locator('.editor__marcador') }).first();
  const marcador = editor.locator('.editor__marcador').first();
  const antes = await editor.boundingBox();
  await marcador.click();
  const explicacao = page.locator('.editor__explicacao:popover-open');
  await expect(explicacao).toBeVisible();
  await expect(marcador).toHaveAttribute('aria-expanded', 'true');
  const caixa = await explicacao.boundingBox();
  const depois = await editor.boundingBox();
  expect(depois.height).toBe(antes.height);
  expect(caixa.x).toBeGreaterThanOrEqual(0);
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(360);
  await marcador.click();
  await expect(explicacao).toHaveCount(0);
  await expect(marcador).toHaveAttribute('aria-expanded', 'false');
  await marcador.click();
  await page.keyboard.press('Escape');
  await expect(explicacao).toHaveCount(0);
  await expect(marcador).toHaveAttribute('aria-expanded', 'false');
});
