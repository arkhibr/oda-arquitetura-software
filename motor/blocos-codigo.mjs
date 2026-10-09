import { registrarBloco, h, textoRico } from './nucleo.mjs';

const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';

export function prepararLinhas(linhas, destaque = [], anotacoes = [], inicio = 1) {
  const marcadas = new Set(destaque);
  const porLinha = new Map(anotacoes.map((a, i) => [a.linha, i + 1]));
  return linhas.map((texto, i) => {
    const numero = inicio + i;
    return { numero, texto, destacada: marcadas.has(numero), anotacao: porLinha.get(numero) ?? null };
  });
}

export function rotuloEditor(b) {
  return b.rotulo === 'arquivo' ? `arquivo · ${b.caminho} @ ${b.commit}` : b.rotulo;
}

async function copiar(ctx, texto) {
  try {
    await ctx.win.navigator.clipboard.writeText(texto);
    ctx.avisar('Copiado para a área de transferência');
  } catch {
    ctx.avisar('Não foi possível copiar neste navegador');
  }
}

registrarBloco('editor', (casca, b, ctx) => {
  const { doc } = ctx;
  const explicacao = h(doc, 'div', { class: 'editor__explicacao', 'aria-live': 'polite', hidden: true });
  const linhas = prepararLinhas(b.linhas, b.destaque, b.anotacoes, b.inicio ?? 1).map((l) => h(doc, 'span', { class: `editor__linha${l.destacada ? ' editor__linha--destaque' : ''}` }, [
    h(doc, 'span', { class: 'editor__num', 'aria-hidden': 'true', texto: String(l.numero) }),
    h(doc, 'span', { class: 'editor__codigo', texto: l.texto }),
    l.anotacao ? h(doc, 'button', {
      type: 'button', class: 'editor__marcador', texto: String(l.anotacao), 'aria-label': `Explicação ${l.anotacao}`,
      onclick: () => {
        const a = b.anotacoes[l.anotacao - 1];
        explicacao.replaceChildren(h(doc, 'strong', { texto: `${l.anotacao} · linha ${a.linha}: ` }), textoRico(doc, a.texto));
        explicacao.hidden = false;
      },
    }) : null,
  ]));
  casca.append(h(doc, 'div', { class: `editor editor--${b.rotulo}${b.numeros === false ? ' editor--sem-numeros' : ''}` }, [
    h(doc, 'div', { class: 'editor__barra' }, [
      h(doc, 'span', { class: 'editor__rotulo', texto: rotuloEditor(b) }),
      b.origem ? h(doc, 'span', { class: 'origem', texto: b.origem }) : null,
      h(doc, 'button', { type: 'button', class: 'botao editor__copiar', texto: '📋 Copiar', onclick: () => copiar(ctx, b.linhas.join('\n')) }),
    ]),
    h(doc, 'pre', { class: 'editor__corpo', tabindex: '0' }, linhas),
    explicacao,
  ]));
});

registrarBloco('diagrama', (casca, b, ctx) => {
  const { doc } = ctx;
  let zoom = 1;
  const area = h(doc, 'div', { class: 'diagrama__area' });
  const codigo = h(doc, 'pre', { class: 'diagrama__codigo', hidden: true, texto: b.mermaid });
  const aplicarZoom = () => { area.style.transform = `scale(${zoom})`; };
  const quadro = h(doc, 'div', { class: 'diagrama' }, [
    h(doc, 'div', { class: 'diagrama__barra' }, [
      h(doc, 'span', { class: 'diagrama__id', texto: `${b.id_diagrama} · ${b.tipo_diagrama}` }),
      h(doc, 'button', { type: 'button', class: 'botao', texto: 'Código', onclick: () => { codigo.hidden = !codigo.hidden; } }),
      h(doc, 'button', { type: 'button', class: 'botao', texto: '− Zoom', onclick: () => { zoom = Math.max(0.5, zoom - 0.2); aplicarZoom(); } }),
      h(doc, 'button', { type: 'button', class: 'botao', texto: '+ Zoom', onclick: () => { zoom = Math.min(2.4, zoom + 0.2); aplicarZoom(); } }),
      h(doc, 'button', { type: 'button', class: 'botao', texto: 'Tela cheia', onclick: () => quadro.requestFullscreen?.().catch(() => {}) }),
    ]),
    h(doc, 'div', { class: 'diagrama__janela' }, [area]),
    codigo,
  ]);
  casca.append(h(doc, 'p', { class: 'diagrama__titulo', texto: b.titulo }), quadro);
  import(MERMAID).then(async ({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, theme: doc.documentElement.dataset.tema === 'claro' ? 'default' : 'dark', securityLevel: 'strict' });
    const { svg } = await mermaid.render(`mmd-${b.id}`, b.mermaid);
    const svgDoc = new ctx.win.DOMParser().parseFromString(svg, 'image/svg+xml');
    area.replaceChildren(doc.importNode(svgDoc.documentElement, true));
  }).catch(() => {
    area.replaceChildren(h(doc, 'p', { class: 'bloco-erro', texto: 'O diagrama não pôde ser carregado. O código-fonte está disponível no botão Código.' }));
  });
});
