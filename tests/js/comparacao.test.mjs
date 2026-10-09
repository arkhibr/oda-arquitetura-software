import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarConfig, diferencas } from '../../docs/assets/javascripts/oda/componentes/comparacao.mjs';

test('linhas iguais ficam iguais nos dois lados', () => {
  const r = diferencas(['a', 'b'], ['a', 'b']);
  assert.deepEqual(r.esquerda.map((l) => l.tipo), ['igual', 'igual']);
  assert.deepEqual(r.direita.map((l) => l.tipo), ['igual', 'igual']);
});

test('marca removidas e adicionadas preservando a ordem', () => {
  const r = diferencas(['a', 'x', 'c'], ['a', 'c', 'y']);
  assert.deepEqual(r.esquerda, [
    { texto: 'a', tipo: 'igual' }, { texto: 'x', tipo: 'removida' }, { texto: 'c', tipo: 'igual' }]);
  assert.deepEqual(r.direita, [
    { texto: 'a', tipo: 'igual' }, { texto: 'c', tipo: 'igual' }, { texto: 'y', tipo: 'adicionada' }]);
});

test('lado vazio', () => {
  assert.deepEqual(diferencas([], ['z']).direita, [{ texto: 'z', tipo: 'adicionada' }]);
});

test('validação exige os dois lados e limita o tamanho', () => {
  assert.ok(validarConfig({ esquerda: { titulo: 'A', linhas: [] } }).includes('"direita" precisa ter "titulo" e "linhas".'));
  const muitas = Array.from({ length: 401 }, (_, i) => String(i));
  assert.ok(validarConfig({ esquerda: { titulo: 'A', linhas: muitas }, direita: { titulo: 'B', linhas: [] } })
    .includes('"esquerda" tem mais de 400 linhas.'));
});
