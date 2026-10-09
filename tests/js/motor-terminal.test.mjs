import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarComando, condicaoSatisfeita, resolverComando, disponiveis, criarHistorico } from '../../motor/terminal.mjs';

const comandos = [
  { entrada: 'dotnet test --filter ConfirmarPedidoTests', condicao: 'handler_registrado', saida: 'Aprovado: 3', origem: 'executado' },
  { entrada: 'dotnet test --filter ConfirmarPedidoTests', saida: 'Com falha: 3', origem: 'executado', dica: 'O handler foi registrado?' },
  { entrada: 'git checkout 702145a', saida: 'HEAD is now at 702145a', origem: 'exemplo', efeito: 'no_commit' },
];

test('normalizarComando apara e reduz espaços', () => {
  assert.equal(normalizarComando('  dotnet   test  '), 'dotnet test');
});

test('condição negada e positiva', () => {
  const flag = (n) => n === 'a';
  assert.equal(condicaoSatisfeita('a', flag), true);
  assert.equal(condicaoSatisfeita('!a', flag), false);
  assert.equal(condicaoSatisfeita(undefined, flag), true);
});

test('primeira entrada com condição satisfeita vence', () => {
  assert.equal(resolverComando(comandos, 'dotnet test --filter ConfirmarPedidoTests', () => false).saida, 'Com falha: 3');
  assert.equal(resolverComando(comandos, 'dotnet  test --filter ConfirmarPedidoTests ', () => true).saida, 'Aprovado: 3');
});

test('efeito e dica são devolvidos', () => {
  const r = resolverComando(comandos, 'git checkout 702145a', () => false);
  assert.equal(r.efeito, 'no_commit');
  assert.equal(resolverComando(comandos, 'dotnet test --filter ConfirmarPedidoTests', () => false).dica, 'O handler foi registrado?');
});

test('maiúsculas diferentes são outro comando', () => {
  assert.equal(resolverComando(comandos, 'Git checkout 702145a', () => false).tipo, 'desconhecido');
});

test('comandos internos e vazio', () => {
  assert.equal(resolverComando(comandos, '   ', () => false).tipo, 'vazio');
  assert.equal(resolverComando(comandos, 'clear', () => false).tipo, 'limpar');
  assert.deepEqual(resolverComando(comandos, 'ajuda', () => false).disponiveis, ['dotnet test --filter ConfirmarPedidoTests', 'git checkout 702145a']);
});

test('disponiveis sem repetição', () => {
  assert.equal(disponiveis(comandos).length, 2);
});

test('histórico navega para trás e para frente', () => {
  const hst = criarHistorico();
  hst.adicionar('a'); hst.adicionar('b'); hst.adicionar('b');
  assert.equal(hst.anterior(), 'b');
  assert.equal(hst.anterior(), 'a');
  assert.equal(hst.anterior(), 'a');
  assert.equal(hst.proximo(), 'b');
  assert.equal(hst.proximo(), '');
});

test('condição em lista exige todos os estados', () => {
  const flag = (n) => n === 'a';
  assert.equal(condicaoSatisfeita(['a', 'b'], flag), false);
  assert.equal(condicaoSatisfeita(['a', '!b'], flag), true);
});
