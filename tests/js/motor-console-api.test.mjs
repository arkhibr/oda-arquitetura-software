import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classeStatus, textoRequisicao, textoResposta } from '../../motor/console-api.mjs';

test('classeStatus por faixa', () => {
  assert.equal(classeStatus(200), 'sucesso');
  assert.equal(classeStatus(301), 'redirecionamento');
  assert.equal(classeStatus(404), 'erro-cliente');
  assert.equal(classeStatus(500), 'erro-servidor');
});

test('textoRequisicao com cabeçalhos e corpo JSON', () => {
  assert.equal(
    textoRequisicao({ metodo: 'POST', url: '/api/v1/pedidos/1/cancelar', cabecalhos: { Authorization: 'Bearer <token>' }, corpo: { motivo: 'x' } }),
    'POST /api/v1/pedidos/1/cancelar HTTP/1.1\nAuthorization: Bearer <token>\n\n{\n  "motivo": "x"\n}');
});

test('textoResposta com corpo e sem corpo', () => {
  assert.equal(textoResposta({ status: 404, corpo: { error: 'Pedido não encontrado.' } }), 'HTTP/1.1 404 Not Found\n\n{\n  "error": "Pedido não encontrado."\n}');
  assert.equal(textoResposta({ status: 400, corpo: '' }), 'HTTP/1.1 400 Bad Request\n\n(corpo vazio)');
  assert.equal(textoResposta({ status: 401 }), 'HTTP/1.1 401 Unauthorized\n\n(corpo vazio)');
});
