import { test, expect } from '@playwright/test';

const ODAS = ['oda-02', 'oda-20', 'oda-30'];
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
    await page.goto(`/novo/${oda}/`);
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
      await page.goto(`/novo/${oda}/#${aba}`);
      await expect(page.getByRole('tab')).toHaveCount(7);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    }
  });
}

test('oda-02: lint acusa a violação depois do passo 3 e volta a passar no passo 6', async ({ page }) => {
  await page.goto('/novo/oda-02/#laboratorio');
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

test('oda-30: linha do tempo retém a mensagem na fila 2 quando a leitura não é executada', async ({ page }) => {
  await page.goto('/novo/oda-30/#simulacao');
  const tempo = page.locator('#painel-simulacao .tempo').first();
  await tempo.getByLabel('A leitura da fila 2 não é executada').check();
  for (let i = 0; i < 5; i += 1) await tempo.getByRole('button', { name: 'Próximo evento' }).click();
  await expect(tempo.locator('.tempo__resumo')).toContainText('fanout-queue-2: 1');
});

test('oda-30: terminal acompanha a extensão do cenário 09', async ({ page }) => {
  await page.goto('/novo/oda-30/#laboratorio');
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
