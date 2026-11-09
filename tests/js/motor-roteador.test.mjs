import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abaDoHash, vizinhas, progresso } from '../../motor/roteador.mjs';

const ids = ['objetivos', 'conceito', 'simulacao', 'laboratorio', 'diagnostico', 'verificacao'];

test('abaDoHash aceita âncora válida', () => {
  assert.equal(abaDoHash('#laboratorio', ids), 'laboratorio');
});

test('abaDoHash cai na primeira aba para âncora inexistente ou vazia', () => {
  assert.equal(abaDoHash('#xyz', ids), 'objetivos');
  assert.equal(abaDoHash('', ids), 'objetivos');
  assert.equal(abaDoHash(undefined, ids), 'objetivos');
});

test('vizinhas nas pontas e no meio', () => {
  assert.deepEqual(vizinhas(ids, 'objetivos'), { anterior: null, proxima: 'conceito' });
  assert.deepEqual(vizinhas(ids, 'verificacao'), { anterior: 'diagnostico', proxima: null });
  assert.deepEqual(vizinhas(ids, 'conceito'), { anterior: 'objetivos', proxima: 'simulacao' });
});

test('progresso conta abas concluídas', () => {
  assert.deepEqual(progresso(ids, (id) => id === 'objetivos' || id === 'conceito'), { feitas: 2, total: 6, percentual: 33 });
});
