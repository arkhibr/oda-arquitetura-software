import { test, expect } from '@playwright/test';

const ODAS = ['oda-00', 'oda-01', 'oda-02', 'oda-03', 'oda-04', 'oda-20', 'oda-30'];
const ABAS = ['missao', 'conceito', 'codigo', 'simulacao', 'laboratorio', 'diagnostico', 'verificacao'];

function vigiarErros(page) {
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  return erros;
}

for (const oda of ODAS) {
  test(`${oda}: sete abas, sem bloco com erro e com pelo menos 60 interações`, async ({ page }) => {
    const erros = vigiarErros(page);
    await page.goto(`/${oda}/`);
    const abas = page.getByRole('tab');
    await expect(abas).toHaveCount(7);
    for (let i = 0; i < 7; i += 1) await abas.nth(i).click();
    await expect(page.locator('.bloco-erro')).toHaveCount(0);
    expect(await page.locator('#app').locator('button, input, select, summary').count()).toBeGreaterThanOrEqual(60);
    expect(erros).toEqual([]);
  });

  test(`${oda}: sem rolagem horizontal em 360 px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const aba of ABAS) {
      await page.goto(`/${oda}/#${aba}`);
      await expect(page.getByRole('tab')).toHaveCount(7);
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
  await expect(tela).toContainText('Tests  1 failed (1)');
  await painel.getByLabel('Passo 7 concluído').check();
  await painel.getByRole('button', { name: 'Limpar' }).click();
  await rodar();
  await expect(tela).toContainText('Tests  1 passed (1)');
});

test('oda-04: sem o sessionMonitor, o evento do 401 fica sem consumo', async ({ page }) => {
  await page.goto('/oda-04/#simulacao');
  const tempo = page.locator('#painel-simulacao .tempo').first();
  await tempo.getByLabel('O sessionMonitor não foi iniciado, como no commit 2179313').check();
  for (let i = 0; i < 6; i += 1) await tempo.getByRole('button', { name: 'Próximo evento' }).click();
  await expect(tempo.locator('.tempo__resumo')).toContainText('window (eventos DOM): 1');
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
    await expect(page.getByRole('tab')).toHaveCount(7);
    await page.getByRole('link', { name: 'Catálogo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Catálogo de ODAs' })).toBeVisible();
  }
});

test('o aluno não vê etiquetas internas de origem, só a marca de saída ilustrativa', async ({ page }) => {
  await page.goto('/oda-00/#missao');
  const missao = page.locator('#painel-missao');
  await missao.locator('.terminal__cenarios button').first().click();
  await expect(missao.locator('.terminal__tela')).toContainText('saída ilustrativa');
  for (const oda of ODAS) {
    for (const aba of ABAS) {
      await page.goto(`/${oda}/#${aba}`);
      const texto = await page.locator(`#painel-${aba}`).innerText();
      expect(texto).not.toMatch(/origem: |\bexecutado\b|\bcodigo\b|produção desta ODA|foi produzida/);
    }
  }
});
