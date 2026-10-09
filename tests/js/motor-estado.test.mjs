import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarArmazenamento, criarEstado } from '../../motor/estado.mjs';

function memoria() {
  const d = new Map();
  return { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, String(v)) };
}

test('estado começa vazio e persiste abas, marcas e flags', () => {
  const s = memoria();
  const e = criarEstado(criarArmazenamento(() => s), 'oda:20');
  assert.equal(e.abaConcluida('missao'), false);
  e.concluirAba('missao');
  e.definirMarca('laboratorio-3:6', true);
  e.definirFlag('handler_registrado', true);
  const outro = criarEstado(criarArmazenamento(() => s), 'oda:20');
  assert.equal(outro.abaConcluida('missao'), true);
  assert.equal(outro.marca('laboratorio-3:6'), true);
  assert.equal(outro.flag('handler_registrado'), true);
});

test('estado gravado malformado é ignorado', () => {
  const s = memoria();
  s.setItem('oda:20', '"texto solto"');
  const e = criarEstado(criarArmazenamento(() => s), 'oda:20');
  assert.equal(e.abaConcluida('missao'), false);
  s.setItem('oda:20', '{"abas": 3, "flags": null}');
  const f = criarEstado(criarArmazenamento(() => s), 'oda:20');
  f.definirFlag('x', true);
  assert.equal(f.flag('x'), true);
});

test('storage que lança exceção não interrompe o estado', () => {
  const e = criarEstado(criarArmazenamento(() => { throw new Error('SecurityError'); }), 'oda:20');
  e.concluirAba('missao');
  assert.equal(e.abaConcluida('missao'), true);
});

test('assinantes são avisados e podem cancelar', () => {
  const e = criarEstado(criarArmazenamento(memoria), 'oda:20');
  let chamadas = 0;
  const cancelar = e.assinar(() => { chamadas += 1; });
  e.definirFlag('a', true);
  cancelar();
  e.definirFlag('b', true);
  assert.equal(chamadas, 1);
});

test('reiniciar limpa tudo', () => {
  const e = criarEstado(criarArmazenamento(memoria), 'oda:20');
  e.concluirAba('missao');
  e.reiniciar();
  assert.equal(e.abaConcluida('missao'), false);
});
