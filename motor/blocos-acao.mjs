import { registrarBloco, h, textoRico } from './nucleo.mjs';

export function aplicarEfeito(efeito, definirFlag) {
  if (!efeito) return;
  if (efeito.startsWith('!')) definirFlag(efeito.slice(1), false);
  else definirFlag(efeito, true);
}

export function inverterEfeito(efeito) {
  if (!efeito) return null;
  return efeito.startsWith('!') ? efeito.slice(1) : `!${efeito}`;
}

export function profundidade(caminho) {
  return caminho.replace(/\/$/, '').split('/').length - 1;
}

function caixa(ctx, chave, rotulo, aoMudar) {
  const { doc, estado } = ctx;
  const entrada = h(doc, 'input', { type: 'checkbox', 'aria-label': rotulo });
  entrada.checked = estado.marca(chave);
  entrada.addEventListener('change', () => { estado.definirMarca(chave, entrada.checked); if (aoMudar) aoMudar(entrada.checked); });
  return entrada;
}

registrarBloco('checklist', (casca, b, ctx) => {
  const { doc } = ctx;
  casca.append(h(doc, 'div', { class: 'checklist' }, [
    h(doc, 'strong', { class: 'checklist__titulo', texto: b.titulo }),
    h(doc, 'ul', {}, b.itens.map((item, i) => h(doc, 'li', {}, [
      h(doc, 'label', {}, [caixa(ctx, `${b.id}:${i}`, item), doc.createTextNode(' '), textoRico(doc, item)])]))),
  ]));
});

registrarBloco('passos', (casca, b, ctx) => {
  const { doc } = ctx;
  casca.append(h(doc, 'ol', { class: 'passos' }, b.itens.map((p, i) => h(doc, 'li', { class: 'passo' }, [
    h(doc, 'div', { class: 'passo__cabeca' }, [
      h(doc, 'span', { class: 'passo__num', texto: String(i + 1) }),
      h(doc, 'strong', { class: 'passo__titulo' }, [textoRico(doc, p.titulo)]),
      h(doc, 'label', { class: 'passo__feito' }, [
        caixa(ctx, `${b.id}:${i}`, `Passo ${i + 1} concluído`, (marcado) => aplicarEfeito(marcado ? p.efeito : inverterEfeito(p.efeito), ctx.estado.definirFlag)),
        doc.createTextNode(' feito'),
      ]),
    ]),
    p.texto ? h(doc, 'p', { class: 'passo__texto' }, [textoRico(doc, p.texto)]) : null,
    p.menu ? h(doc, 'p', { class: 'passo__menu' }, [h(doc, 'span', { texto: 'Menu: ' }), h(doc, 'code', { texto: p.menu })]) : null,
    p.teclas ? h(doc, 'p', { class: 'passo__teclas' }, [h(doc, 'span', { texto: 'Atalho: ' }), ...p.teclas.map((t) => h(doc, 'kbd', { texto: t }))]) : null,
    p.editor ? ctx.renderizarBloco({ ...p.editor, tipo: 'editor', id: `${b.id}-p${i}` }) : null,
    p.sucesso ? ctx.renderizarBloco({ tipo: 'faixa', estilo: 'sucesso', texto: p.sucesso, id: `${b.id}-s${i}` }) : null,
  ]))));
});

registrarBloco('arvores', (casca, b, ctx) => {
  const { doc } = ctx;
  const coluna = (lado) => {
    const painel = h(doc, 'p', { class: 'arvore__descricao', 'aria-live': 'polite', texto: 'Selecione uma pasta ou arquivo.' });
    const botoes = lado.nos.map((no) => h(doc, 'button', {
      type: 'button', class: `arvore__no${no.caminho.endsWith('/') ? ' arvore__no--pasta' : ''}`,
      style: `padding-left: ${0.6 + profundidade(no.caminho) * 1.1}em`,
      texto: `${no.caminho.endsWith('/') ? '📁' : '📄'} ${no.caminho.replace(/\/$/, '').split('/').pop()}`,
      onclick: (ev) => {
        for (const bt of botoes) bt.setAttribute('aria-pressed', String(bt === ev.currentTarget));
        painel.replaceChildren(h(doc, 'code', { texto: no.caminho }), doc.createTextNode(' '), textoRico(doc, no.descricao));
      },
    }));
    return h(doc, 'div', { class: 'arvore' }, [h(doc, 'strong', { class: 'arvore__titulo', texto: lado.titulo }), h(doc, 'div', { class: 'arvore__lista' }, botoes), painel]);
  };
  casca.append(h(doc, 'div', { class: 'arvores' }, [coluna(b.esquerda), coluna(b.direita)]));
});

registrarBloco('comparativo', (casca, b, ctx) => {
  const { doc } = ctx;
  const linhas = b.linhas.map((l) => {
    const tr = h(doc, 'tr', {}, [
      h(doc, 'th', { scope: 'row' }, [h(doc, 'button', { type: 'button', class: 'comparativo__dimensao', 'aria-pressed': 'false', texto: l.dimensao,
        onclick: (ev) => { const ativo = ev.currentTarget.getAttribute('aria-pressed') !== 'true'; ev.currentTarget.setAttribute('aria-pressed', String(ativo)); tr.classList.toggle('comparativo__linha--ativa', ativo); } })]),
      ...l.valores.map((v) => h(doc, 'td', {}, [textoRico(doc, v)])),
    ]);
    return tr;
  });
  casca.append(h(doc, 'div', { class: 'comparativo' }, [h(doc, 'table', {}, [
    h(doc, 'thead', {}, [h(doc, 'tr', {}, [h(doc, 'th', { texto: 'Dimensão' }), ...b.colunas.map((c) => h(doc, 'th', { texto: c }))])]),
    h(doc, 'tbody', {}, linhas),
  ])]));
});
