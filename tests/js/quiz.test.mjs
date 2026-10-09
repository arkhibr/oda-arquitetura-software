import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarConfig, corrigir } from '../../docs/assets/javascripts/oda/componentes/quiz.mjs';

const perguntas = [
  { enunciado: 'P1', alternativas: [
    { texto: 'a', correta: true, explicacao: 'certa' },
    { texto: 'b', correta: false, explicacao: 'errada' } ] },
  { enunciado: 'P2', alternativas: [
    { texto: 'c', correta: false, explicacao: 'errada' },
    { texto: 'd', correta: true, explicacao: 'certa' } ] },
];

test('configuração válida não tem erros', () => {
  assert.deepEqual(validarConfig({ perguntas }), []);
});

test('exige lista de perguntas', () => {
  assert.deepEqual(validarConfig({}), ['"perguntas" precisa ser uma lista não vazia.']);
});

test('exige exatamente uma alternativa correta', () => {
  const p = structuredClone(perguntas);
  p[0].alternativas[1].correta = true;
  assert.ok(validarConfig({ perguntas: p }).includes('Pergunta 1: deve haver exatamente uma alternativa correta, e há 2.'));
});

test('exige explicação em cada alternativa', () => {
  const p = structuredClone(perguntas);
  delete p[1].alternativas[0].explicacao;
  assert.ok(validarConfig({ perguntas: p }).includes('Pergunta 2, alternativa 1: "explicacao" ausente.'));
});

test('corrige respostas certas e erradas', () => {
  const r = corrigir(perguntas, [0, 0]);
  assert.equal(r.acertos, 1);
  assert.equal(r.total, 2);
  assert.deepEqual(r.porPergunta[1], { respondida: true, correta: false, explicacao: 'errada' });
});

test('pergunta sem resposta não conta acerto', () => {
  const r = corrigir(perguntas, [null, 1]);
  assert.equal(r.acertos, 1);
  assert.deepEqual(r.porPergunta[0], { respondida: false, correta: false, explicacao: null });
});

test('índice fora da faixa conta como sem resposta', () => {
  assert.equal(corrigir(perguntas, [7, -1]).porPergunta[0].respondida, false);
});
