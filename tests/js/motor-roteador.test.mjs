import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abaDoHash, vizinhas, progresso } from '../../motor/roteador.mjs';

const ids = ['missao', 'conceito', 'codigo', 'simulacao', 'laboratorio', 'diagnostico', 'verificacao'];

test('abaDoHash aceita âncora válida', () => {
  assert.equal(abaDoHash('#laboratorio', ids), 'laboratorio');
});

test('abaDoHash cai na primeira aba para âncora inexistente ou vazia', () => {
  assert.equal(abaDoHash('#xyz', ids), 'missao');
  assert.equal(abaDoHash('', ids), 'missao');
  assert.equal(abaDoHash(undefined, ids), 'missao');
});

test('vizinhas nas pontas e no meio', () => {
  assert.deepEqual(vizinhas(ids, 'missao'), { anterior: null, proxima: 'conceito' });
  assert.deepEqual(vizinhas(ids, 'verificacao'), { anterior: 'diagnostico', proxima: null });
  assert.deepEqual(vizinhas(ids, 'codigo'), { anterior: 'conceito', proxima: 'simulacao' });
});

test('progresso conta abas concluídas', () => {
  assert.deepEqual(progresso(ids, (id) => id === 'missao' || id === 'codigo'), { feitas: 2, total: 7, percentual: 29 });
});
