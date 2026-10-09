import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarArmazenamento, chaveProgresso } from '../../docs/assets/javascripts/oda/progresso.mjs';

function storageEmMemoria() {
  const dados = new Map();
  return { getItem: (k) => (dados.has(k) ? dados.get(k) : null), setItem: (k, v) => dados.set(k, String(v)) };
}

test('grava e lê valores em JSON', () => {
  const a = criarArmazenamento(storageEmMemoria);
  assert.equal(a.gravar('k', { acertos: 3 }), true);
  assert.deepEqual(a.ler('k'), { acertos: 3 });
});

test('devolve o padrão para chave ausente', () => {
  assert.equal(criarArmazenamento(storageEmMemoria).ler('nada', false), false);
});

test('funciona quando obter o storage lança exceção', () => {
  const a = criarArmazenamento(() => { throw new Error('SecurityError'); });
  assert.equal(a.gravar('k', 1), false);
  assert.equal(a.ler('k', 'padrao'), 'padrao');
});

test('funciona quando setItem e getItem lançam exceção', () => {
  const quebrado = { getItem() { throw new Error('x'); }, setItem() { throw new Error('QuotaExceeded'); } };
  const a = criarArmazenamento(() => quebrado);
  assert.equal(a.gravar('k', 1), false);
  assert.equal(a.ler('k', 0), 0);
});

test('ignora valor gravado que não é JSON', () => {
  const s = storageEmMemoria();
  s.setItem('k', '{quebrado');
  assert.equal(criarArmazenamento(() => s).ler('k', 'padrao'), 'padrao');
});

test('chaveProgresso usa caminho e item', () => {
  assert.equal(chaveProgresso('/odas/oda-02/', 'quiz'), 'oda:/odas/oda-02/:quiz');
});
