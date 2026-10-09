import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerConfig, separarCodigo, registrar, componentesRegistrados } from '../../docs/assets/javascripts/oda/nucleo.mjs';

test('lerConfig devolve objeto vazio para texto ausente ou em branco', () => {
  assert.deepEqual(lerConfig(null), {});
  assert.deepEqual(lerConfig('  \n'), {});
});

test('lerConfig interpreta objeto JSON', () => {
  assert.deepEqual(lerConfig('{"a": [1, 2]}'), { a: [1, 2] });
});

test('lerConfig rejeita JSON inválido', () => {
  assert.throws(() => lerConfig('{"a": }'), SyntaxError);
});

test('lerConfig rejeita JSON que não é objeto', () => {
  assert.throws(() => lerConfig('[1, 2]'), /precisa ser um objeto JSON/);
  assert.throws(() => lerConfig('null'), /precisa ser um objeto JSON/);
});

test('separarCodigo alterna texto e código pelas crases', () => {
  assert.deepEqual(separarCodigo('rode `npm run lint` agora'), [
    { tipo: 'texto', texto: 'rode ' },
    { tipo: 'codigo', texto: 'npm run lint' },
    { tipo: 'texto', texto: ' agora' },
  ]);
});

test('separarCodigo preserva marcação HTML como texto literal', () => {
  assert.deepEqual(separarCodigo('<script>x</script>'), [{ tipo: 'texto', texto: '<script>x</script>' }]);
});

test('registrar acrescenta o componente ao registro', () => {
  registrar('teste-nucleo', () => {});
  assert.ok(componentesRegistrados().includes('teste-nucleo'));
});
