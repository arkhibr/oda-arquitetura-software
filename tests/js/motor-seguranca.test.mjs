import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('../../motor/', import.meta.url).pathname;
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
const arquivos = readdirSync(RAIZ).filter((n) => n.endsWith('.mjs')).map((n) => join(RAIZ, n));

test('nenhum módulo do motor usa APIs que interpretam HTML ou código', () => {
  for (const a of arquivos) {
    assert.doesNotMatch(readFileSync(a, 'utf8'), /innerHTML|outerHTML|insertAdjacentHTML|\beval\(|new Function/, a);
  }
});

test('imports são relativos, com exceção do Mermaid no bloco de diagrama', () => {
  for (const a of arquivos) {
    const fonte = readFileSync(a, 'utf8');
    for (const [, origem] of fonte.matchAll(/(?:from\s+|import\()\s*'([^']+)'/g)) {
      const permitido = origem.startsWith('./') || (origem === MERMAID && a.endsWith('blocos-codigo.mjs'));
      assert.ok(permitido, `${a}: ${origem}`);
    }
  }
});
