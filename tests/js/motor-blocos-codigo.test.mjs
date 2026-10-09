import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepararLinhas, rotuloEditor } from '../../motor/blocos-codigo.mjs';

test('prepararLinhas numera, destaca e associa anotações', () => {
  const r = prepararLinhas(['a', 'b', 'c'], [2], [{ linha: 3, texto: 'x' }, { linha: 1, texto: 'y' }]);
  assert.deepEqual(r, [
    { numero: 1, texto: 'a', destacada: false, anotacao: 2 },
    { numero: 2, texto: 'b', destacada: true, anotacao: null },
    { numero: 3, texto: 'c', destacada: false, anotacao: 1 },
  ]);
});

test('rotuloEditor por tipo', () => {
  assert.equal(rotuloEditor({ rotulo: 'terminal' }), 'terminal');
  assert.equal(rotuloEditor({ rotulo: 'arquivo', caminho: 'Program.cs', commit: '702145a' }), 'arquivo · Program.cs @ 702145a');
});
