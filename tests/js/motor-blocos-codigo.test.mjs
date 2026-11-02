import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepararLinhas, rotuloEditor, linkNoGithub, temCaminhoSimples } from '../../motor/blocos-codigo.mjs';

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

test('prepararLinhas usa o número real quando há início', () => {
  const r = prepararLinhas(['a', 'b'], [95], [{ linha: 94, texto: 'x' }], 94);
  assert.deepEqual(r.map((l) => [l.numero, l.destacada, l.anotacao]), [[94, false, 1], [95, true, null]]);
});

test('linkNoGithub aponta para o trecho no commit e mostra Markdown como texto', () => {
  const url = 'https://github.com/arkhibr/net-minimal-api';
  assert.equal(linkNoGithub(url, { caminho: 'Program.cs', commit: '702145a', inicio: 94, linhas: ['a', 'b'] }),
    'https://github.com/arkhibr/net-minimal-api/blob/702145a/Program.cs#L94-L95');
  assert.equal(linkNoGithub(url, { caminho: 'docs/README.md', commit: '702145a', linhas: ['a'] }),
    'https://github.com/arkhibr/net-minimal-api/blob/702145a/docs/README.md?plain=1#L1-L1');
});

test('temCaminhoSimples recusa caminhos anotados, que não existem no commit', () => {
  assert.equal(temCaminhoSimples({ caminho: 'src/app/App.tsx' }), true);
  assert.equal(temCaminhoSimples({ caminho: 'token.py (novo, só para o teste)' }), false);
  assert.equal(temCaminhoSimples({ caminho: 'RateLimitingExtensions.cs, AuthEndpoints.cs' }), false);
});
