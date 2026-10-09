import { test } from 'node:test';
import assert from 'node:assert/strict';
import { separarCodigo, registrarBloco, tiposRegistrados } from '../../motor/nucleo.mjs';

test('separarCodigo alterna texto e código', () => {
  assert.deepEqual(separarCodigo('rode `dotnet test` agora'), [
    { tipo: 'texto', texto: 'rode ' }, { tipo: 'codigo', texto: 'dotnet test' }, { tipo: 'texto', texto: ' agora' }]);
});

test('separarCodigo preserva marcação HTML como texto', () => {
  assert.deepEqual(separarCodigo('<script>x</script>'), [{ tipo: 'texto', texto: '<script>x</script>' }]);
});

test('registrarBloco acrescenta o tipo ao registro', () => {
  registrarBloco('teste-motor', () => {});
  assert.ok(tiposRegistrados().includes('teste-motor'));
});
