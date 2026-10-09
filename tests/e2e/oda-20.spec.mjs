import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, info) => {
  info.erros = [];
  page.on('pageerror', (e) => info.erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') info.erros.push(m.text()); });
  await page.goto('/oda-20/');
  await expect(page.getByRole('tab')).toHaveCount(7);
});

test.afterEach(async ({}, info) => {
  expect(info.erros).toEqual([]);
});

test('percorre as sete abas sem bloco com erro', async ({ page }) => {
  const abas = page.getByRole('tab');
  for (let i = 0; i < 7; i += 1) {
    await abas.nth(i).click();
    await expect(abas.nth(i)).toHaveAttribute('aria-selected', 'true');
  }
  await expect(page.locator('.bloco-erro')).toHaveCount(0);
});

test('tem pelo menos 60 pontos de interação', async ({ page }) => {
  const total = await page.locator('#app').locator('button, input, select, summary').count();
  expect(total).toBeGreaterThanOrEqual(60);
});

test('terminal muda de saída quando o passo 7 é concluído', async ({ page }) => {
  await page.goto('/oda-20/#laboratorio');
  const painel = page.locator('#painel-laboratorio');
  const campo = painel.getByLabel('Digite um comando');
  await campo.fill('dotnet test tests/ProdutosAPI.Tests --filter ConfirmarPedidoTests');
  await campo.press('Enter');
  await expect(painel.locator('.terminal__tela')).toContainText('Com falha:     3');
  await painel.getByLabel('Passo 7 concluído').check();
  await campo.fill('dotnet test tests/ProdutosAPI.Tests --filter ConfirmarPedidoTests');
  await campo.press('Enter');
  await expect(painel.locator('.terminal__tela')).toContainText('Aprovado:     3');
});

test('console de API mostra 404 para pedido inexistente', async ({ page }) => {
  await page.goto('/oda-20/#simulacao');
  await page.locator('#painel-simulacao .api__cenario').first().click();
  await expect(page.locator('#painel-simulacao .api__status')).toHaveText('404');
});

test('sem rolagem horizontal em 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const aba of ['missao', 'conceito', 'codigo', 'simulacao', 'laboratorio', 'diagnostico', 'verificacao']) {
    await page.goto(`/oda-20/#${aba}`);
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largura).toBeLessThanOrEqual(360);
  }
});

test('tema claro é lembrado', async ({ page }) => {
  await page.getByRole('button', { name: 'Tema' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
});

test('modo Foco tem saída por Escape e por botão', async ({ page }) => {
  await page.getByRole('button', { name: 'Foco', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/modo-foco/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/modo-foco/);
  await page.getByRole('button', { name: 'Foco', exact: true }).click();
  await page.getByRole('button', { name: 'Sair do foco' }).click();
  await expect(page.locator('body')).not.toHaveClass(/modo-foco/);
});

test('resultados da busca ficam dentro da tela em 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByLabel('Buscar na ODA').fill('pedido');
  const caixa = await page.locator('.busca__resultados').boundingBox();
  expect(caixa.x).toBeGreaterThanOrEqual(0);
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(360);
});

test('aba Verificação mostra o resumo do progresso por etapa', async ({ page }) => {
  await page.locator('#painel-missao .concluir').click();
  await page.locator('#aba-verificacao').click();
  const resumo = page.locator('#painel-verificacao ul.resumo');
  await expect(resumo.locator('li', { hasText: 'Missão' })).toContainText('concluída');
  await expect(resumo.locator('li', { hasText: 'Conceito' })).toContainText('pendente');
});
