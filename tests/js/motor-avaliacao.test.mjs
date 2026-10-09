import { test } from 'node:test';
import assert from 'node:assert/strict';
import { irPara, verificar, corrigir } from '../../motor/blocos-avaliacao.mjs';

test('irPara limita o índice', () => {
  assert.equal(irPara(-1, 3), 0);
  assert.equal(irPara(7, 3), 2);
});

test('verificar classificador com item sem resposta', () => {
  const r = verificar([{ categoria: 'a', explicacao: 'x' }, { categoria: 'b', explicacao: 'y' }], ['a', '']);
  assert.equal(r.acertos, 1);
  assert.equal(r.porItem[1].respondido, false);
});

test('corrigir quiz com pergunta em branco', () => {
  const p = [{ alternativas: [{ correta: true, explicacao: 'c' }, { correta: false, explicacao: 'e' }] }];
  assert.deepEqual(corrigir(p, [null]).porPergunta[0], { respondida: false, correta: false, explicacao: null });
  assert.equal(corrigir(p, [0]).acertos, 1);
});
