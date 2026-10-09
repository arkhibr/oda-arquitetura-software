import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarConfig, verificar } from '../../docs/assets/javascripts/oda/componentes/classificador.mjs';

const config = {
  categorias: [{ id: 'sim', rotulo: 'Permitido' }, { id: 'nao', rotulo: 'Proibido' }],
  itens: [
    { texto: 'pages → features', categoria: 'sim', explicacao: 'pages está acima de features.' },
    { texto: 'shared → features', categoria: 'nao', explicacao: 'shared não importa outras camadas.' },
  ],
};

test('configuração válida não tem erros', () => {
  assert.deepEqual(validarConfig(config), []);
});

test('item com categoria inexistente', () => {
  const c = structuredClone(config);
  c.itens[0].categoria = 'talvez';
  assert.ok(validarConfig(c).includes('Item 1: categoria "talvez" não existe.'));
});

test('categorias com identificador repetido', () => {
  const c = structuredClone(config);
  c.categorias[1].id = 'sim';
  assert.ok(validarConfig(c).includes('Categoria "sim" repetida.'));
});

test('verifica atribuições e itens sem resposta', () => {
  const r = verificar(config.itens, ['sim', null]);
  assert.equal(r.acertos, 1);
  assert.deepEqual(r.porItem[1], { respondido: false, correto: false, esperado: 'nao', explicacao: 'shared não importa outras camadas.' });
});

test('string vazia conta como sem resposta', () => {
  assert.equal(verificar(config.itens, ['', 'nao']).porItem[0].respondido, false);
});
