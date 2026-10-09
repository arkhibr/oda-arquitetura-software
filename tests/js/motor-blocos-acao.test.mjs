import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarEfeito, inverterEfeito, profundidade } from '../../motor/blocos-acao.mjs';

test('aplicarEfeito liga e desliga flags', () => {
  const flags = {};
  const definir = (n, v) => { flags[n] = v; };
  aplicarEfeito('handler_registrado', definir);
  assert.equal(flags.handler_registrado, true);
  aplicarEfeito('!handler_registrado', definir);
  assert.equal(flags.handler_registrado, false);
  aplicarEfeito(null, definir);
  assert.deepEqual(Object.keys(flags), ['handler_registrado']);
});

test('inverterEfeito desliga o que o passo ligou e ignora passos de reversão', () => {
  assert.equal(inverterEfeito('x'), '!x');
  assert.equal(inverterEfeito('!x'), null);
  assert.equal(inverterEfeito(null), null);
});

test('profundidade de caminhos de pasta e arquivo', () => {
  assert.equal(profundidade('src/'), 0);
  assert.equal(profundidade('src/Pedidos/'), 1);
  assert.equal(profundidade('src/Pedidos/CancelPedido/CancelPedidoEndpoint.cs'), 3);
});

test('aplicarEfeito e inverterEfeito aceitam lista de estados', () => {
  const flags = { a: true, b: true };
  aplicarEfeito(['!a', '!b'], (n, v) => { flags[n] = v; });
  assert.deepEqual(flags, { a: false, b: false });
  assert.deepEqual(inverterEfeito(['x', '!y']), ['!x']);
});
