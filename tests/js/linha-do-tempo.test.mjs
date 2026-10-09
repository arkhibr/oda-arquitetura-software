import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarConfig, simular } from '../../docs/assets/javascripts/oda/componentes/linha-do-tempo.mjs';

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
  const r = simular(config, new Set(['produtor']));
  assert.deepEqual(r.eventos.map((e) => e.status), ['nao-ocorre', 'nao-ocorre', 'nao-ocorre']);
});

test('validação de referências', () => {
  assert.deepEqual(validarConfig(config), []);
  const c = structuredClone(config);
  c.eventos[1].para = 'x';
  c.eventos[2].depende = 'e9';
  c.falhas[0].ator = 'y';
  const erros = validarConfig(c);
  assert.ok(erros.includes('Evento e2: ator "x" não existe.'));
  assert.ok(erros.includes('Evento e3: depende de "e9", que não é um evento anterior.'));
  assert.ok(erros.includes('Falha consumidor: ator "y" não existe.'));
});
