import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrar, opcoes } from '../../docs/assets/javascripts/oda/componentes/filtro-catalogo.mjs';

const linhas = [
  { repositorio: 'frontend-react', situacao: 'disponivel' },
  { repositorio: 'net-minimal-api', situacao: 'planejada' },
  { repositorio: 'frontend-react', situacao: 'planejada' },
];

test('filtro vazio mostra todas as linhas', () => {
  assert.deepEqual(filtrar(linhas, { repositorio: '', situacao: '' }), [true, true, true]);
});

test('filtra por repositório e situação combinados', () => {
  assert.deepEqual(filtrar(linhas, { repositorio: 'frontend-react', situacao: 'planejada' }), [false, false, true]);
});

test('filtro sem resultado devolve tudo falso', () => {
  assert.deepEqual(filtrar(linhas, { repositorio: 'aspire-aws', situacao: '' }), [false, false, false]);
});

test('opções únicas e ordenadas', () => {
  assert.deepEqual(opcoes(linhas), ['frontend-react', 'net-minimal-api']);
});
