import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simular } from '../../motor/linha-do-tempo.mjs';

const config = {
  atores: [{ id: 'p', rotulo: 'Produtor' }, { id: 't', rotulo: 'Tópico' }, { id: 'f', rotulo: 'Fila' }, { id: 'c', rotulo: 'Consumidor' }],
  eventos: [
    { id: 'e1', de: 'p', para: 't', mensagem: 'publica' },
    { id: 'e2', de: 't', para: 'f', mensagem: 'entrega', depende: 'e1' },
    { id: 'e3', de: 'f', para: 'c', mensagem: 'consome', depende: 'e2' },
  ],
  falhas: [{ id: 'consumidor', rotulo: 'Consumidor parado', ator: 'c' }, { id: 'produtor', rotulo: 'Produtor parado', ator: 'p' }],
};

test('sem falhas todos os eventos são entregues', () => {
  const r = simular(config, new Set());
  assert.deepEqual(r.eventos.map((e) => e.status), ['entregue', 'entregue', 'entregue']);
  assert.deepEqual(r.aguardando, {});
});

test('consumidor parado retém a mensagem na fila', () => {
  const r = simular(config, new Set(['consumidor']));
  assert.deepEqual(r.eventos.map((e) => e.status), ['entregue', 'entregue', 'retido']);
  assert.deepEqual(r.aguardando, { f: 1 });
});

test('produtor parado impede toda a cadeia', () => {
  assert.deepEqual(simular(config, new Set(['produtor'])).eventos.map((e) => e.status), ['nao-ocorre', 'nao-ocorre', 'nao-ocorre']);
});
