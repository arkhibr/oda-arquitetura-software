import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarConfig, avancar, concluido } from '../../docs/assets/javascripts/oda/componentes/terminal.mjs';

test('configuração válida', () => {
  assert.deepEqual(validarConfig({ passos: [{ comando: 'npm run lint', saida: '' }] }), []);
});

test('exige passos com comando e saída', () => {
  assert.deepEqual(validarConfig({ passos: [] }), ['"passos" precisa ser uma lista não vazia.']);
  assert.ok(validarConfig({ passos: [{ saida: 'x' }] }).includes('Passo 1: "comando" ausente.'));
  assert.ok(validarConfig({ passos: [{ comando: 'ls' }] }).includes('Passo 1: "saida" precisa ser texto.'));
});

test('avança até o total e não passa dele', () => {
  assert.equal(avancar(0, 2), 1);
  assert.equal(avancar(2, 2), 2);
  assert.equal(concluido(2, 2), true);
  assert.equal(concluido(1, 2), false);
});
