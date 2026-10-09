import { registrarBloco, h, textoRico } from './nucleo.mjs';

const MOTIVOS = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error' };

export function classeStatus(status) {
  if (status >= 500) return 'erro-servidor';
  if (status >= 400) return 'erro-cliente';
  if (status >= 300) return 'redirecionamento';
  return 'sucesso';
}

const corpoTexto = (corpo) => (typeof corpo === 'string' ? corpo : JSON.stringify(corpo, null, 2));

export function textoRequisicao(req) {
  const linhas = [`${req.metodo} ${req.url} HTTP/1.1`];
  for (const [chave, valor] of Object.entries(req.cabecalhos ?? {})) linhas.push(`${chave}: ${valor}`);
  if (req.corpo !== undefined && req.corpo !== null) linhas.push('', corpoTexto(req.corpo));
  return linhas.join('\n');
}

export function textoResposta(resp) {
  const vazio = resp.corpo === undefined || resp.corpo === null || resp.corpo === '';
  return [`HTTP/1.1 ${resp.status} ${MOTIVOS[resp.status] ?? ''}`.trim(), '', vazio ? '(corpo vazio)' : corpoTexto(resp.corpo)].join('\n');
}

registrarBloco('console-api', (casca, b, ctx) => {
  const { doc } = ctx;
  const requisicao = h(doc, 'pre', { class: 'api__req', texto: 'Escolha um cenário para enviar a requisição.' });
  const resposta = h(doc, 'pre', { class: 'api__resp', 'aria-live': 'polite' });
  const status = h(doc, 'span', { class: 'api__status' });
  const nota = h(doc, 'p', { class: 'api__nota' });
  const origem = h(doc, 'span', { class: 'origem' });
  const botoes = b.cenarios.map((c) => h(doc, 'button', {
    type: 'button', class: 'botao api__cenario', 'aria-pressed': 'false', texto: `▶ ${c.rotulo}`,
    onclick: (ev) => {
      for (const bt of botoes) bt.setAttribute('aria-pressed', String(bt === ev.currentTarget));
      requisicao.textContent = textoRequisicao(c.requisicao);
      resposta.textContent = textoResposta(c.resposta);
      status.textContent = String(c.resposta.status);
      status.className = `api__status api__status--${classeStatus(c.resposta.status)}`;
      origem.textContent = `origem: ${c.origem}`;
      nota.replaceChildren(c.nota ? textoRico(doc, c.nota) : doc.createTextNode(''));
    },
  }));
  casca.append(h(doc, 'div', { class: 'api' }, [
    h(doc, 'div', { class: 'api__cenarios' }, botoes),
    h(doc, 'div', { class: 'api__paineis' }, [
      h(doc, 'div', { class: 'api__painel' }, [h(doc, 'span', { class: 'editor__rotulo', texto: 'requisição' }), requisicao]),
      h(doc, 'div', { class: 'api__painel' }, [h(doc, 'div', { class: 'api__cabeca' }, [h(doc, 'span', { class: 'editor__rotulo', texto: 'resposta' }), status, origem]), resposta]),
    ]),
    nota,
  ]));
});
