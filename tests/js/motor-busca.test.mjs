import { test } from 'node:test';
import assert from 'node:assert/strict';
import { semAcento, indexar, buscar } from '../../motor/busca.mjs';

const abas = [
  { id: 'missao', titulo: 'Missão', blocos: [{ id: 'missao-0', tipo: 'legenda', texto: 'Validação do ambiente' }] },
  { id: 'laboratorio', titulo: 'Laboratório', blocos: [{ id: 'laboratorio-0', tipo: 'faixa', estilo: 'erro', sintoma: '400 com corpo vazio', causa: 'handler sem AddScoped', correcao: 'registrar' }] },
];

test('semAcento preserva o comprimento', () => {
  assert.equal(semAcento('Validação'), 'validacao');
  assert.equal(semAcento('Validação').length, 'Validação'.length);
});

test('busca ignora acentos e maiúsculas', () => {
  const r = buscar(indexar(abas), 'validacao');
  assert.equal(r.length, 1);
  assert.equal(r[0].bloco, 'missao-0');
});

test('busca encontra texto em campos aninhados e não em chaves técnicas', () => {
  const indice = indexar(abas);
  assert.equal(buscar(indice, 'AddScoped')[0].aba, 'laboratorio');
  assert.deepEqual(buscar(indice, 'faixa'), []);
});

test('termo curto não busca', () => {
  assert.deepEqual(buscar(indexar(abas), 'a'), []);
});
