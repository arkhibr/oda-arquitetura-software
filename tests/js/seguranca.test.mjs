import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('../../docs/assets/javascripts/oda/', import.meta.url).pathname;

function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : p.endsWith('.mjs') ? [p] : [];
  });
}

test('nenhum módulo usa innerHTML, outerHTML, insertAdjacentHTML ou eval', () => {
  for (const arquivo of arquivos(RAIZ)) {
    const fonte = readFileSync(arquivo, 'utf8');
    assert.doesNotMatch(fonte, /innerHTML|outerHTML|insertAdjacentHTML|\beval\(|new Function/, arquivo);
  }
});

test('nenhum módulo importa código externo', () => {
  for (const arquivo of arquivos(RAIZ)) {
    const fonte = readFileSync(arquivo, 'utf8');
    for (const [, origem] of fonte.matchAll(/from\s+'([^']+)'/g)) {
      assert.ok(origem.startsWith('./') || origem.startsWith('../'), `${arquivo}: ${origem}`);
    }
  }
});
