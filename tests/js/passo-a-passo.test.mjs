import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarConfig, irPara } from '../../docs/assets/javascripts/oda/componentes/passo-a-passo.mjs';

const etapa = { titulo: 'T', descricao: 'D', codigo: { linhas: ['a', 'b', 'c'], destaque: [2] } };

test('configuração válida', () => {
  assert.deepEqual(validarConfig({ etapas: [etapa] }), []);
});

test('destaque fora das linhas do código', () => {
  const e = structuredClone(etapa);
  e.codigo.destaque = [4];
  assert.ok(validarConfig({ etapas: [e] }).includes('Etapa 1: linha destacada 4 não existe no código.'));
});

test('exige título e descrição', () => {
  assert.ok(validarConfig({ etapas: [{ descricao: 'D' }] }).includes('Etapa 1: "titulo" ausente.'));
});

test('irPara limita o índice', () => {
  assert.equal(irPara(-1, 3), 0);
  assert.equal(irPara(5, 3), 2);
  assert.equal(irPara(1, 3), 1);
});
