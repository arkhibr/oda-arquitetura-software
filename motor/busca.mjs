import { h } from './nucleo.mjs';

const IGNORADAS = new Set(['tipo', 'origem', 'estilo', 'efeito', 'condicao', 'id']);

export function semAcento(texto) {
  return [...String(texto)].map((c) => c.normalize('NFD')[0]).join('').toLowerCase();
}

function coletar(valor, saida) {
  if (typeof valor === 'string') saida.push(valor);
  else if (Array.isArray(valor)) valor.forEach((v) => coletar(v, saida));
  else if (valor && typeof valor === 'object') {
    for (const [chave, v] of Object.entries(valor)) if (!IGNORADAS.has(chave)) coletar(v, saida);
  }
}

export function indexar(abas) {
  return abas.flatMap((aba) => aba.blocos.map((bloco) => {
    const textos = [];
    coletar(bloco, textos);
    return { aba: aba.id, tituloAba: aba.titulo, bloco: bloco.id, texto: textos.join(' · ') };
  }));
}

export function buscar(indice, termo, limite = 8) {
  const alvo = semAcento(termo).trim();
  if (alvo.length < 2) return [];
  return indice
    .filter((e) => semAcento(e.texto).includes(alvo))
    .slice(0, limite)
    .map((e) => {
      const i = semAcento(e.texto).indexOf(alvo);
      const inicio = Math.max(0, i - 40);
      const fim = Math.min(e.texto.length, i + alvo.length + 60);
      return { ...e, trecho: `${inicio > 0 ? '…' : ''}${e.texto.slice(inicio, fim)}${fim < e.texto.length ? '…' : ''}` };
    });
}

export function montarBusca(ctx, dados) {
  const { doc, win } = ctx;
  const indice = indexar(dados.abas);
  const campo = h(doc, 'input', { type: 'search', class: 'busca__campo', placeholder: 'Buscar… (/)', 'aria-label': 'Buscar na ODA' });
  const resultados = h(doc, 'ul', { class: 'busca__resultados', hidden: true });
  const fechar = () => { resultados.hidden = true; };
  campo.addEventListener('input', () => {
    const achados = buscar(indice, campo.value);
    resultados.replaceChildren(...achados.map((r) => h(doc, 'li', {}, [h(doc, 'button', {
      type: 'button', class: 'busca__item',
      onclick: () => {
        ctx.mostrarAba(r.aba);
        const alvo = doc.getElementById(r.bloco);
        if (alvo) { alvo.scrollIntoView({ block: 'center' }); alvo.classList.add('realce'); setTimeout(() => alvo.classList.remove('realce'), 1600); }
        fechar();
      },
    }, [h(doc, 'strong', { texto: r.tituloAba }), h(doc, 'span', { texto: r.trecho })])])));
    if (campo.value.trim().length >= 2 && achados.length === 0) resultados.replaceChildren(h(doc, 'li', { class: 'busca__vazio', texto: 'Nenhum trecho encontrado.' }));
    resultados.hidden = campo.value.trim().length < 2;
  });
  campo.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { campo.value = ''; fechar(); } });
  doc.addEventListener('keydown', (ev) => {
    const digitando = ['INPUT', 'TEXTAREA', 'SELECT'].includes(doc.activeElement?.tagName);
    if (ev.key === '/' && !digitando) { ev.preventDefault(); campo.focus(); }
  });
  doc.addEventListener('click', (ev) => { if (!ctx.campoBusca.contains(ev.target)) fechar(); });
  ctx.campoBusca.replaceChildren(campo, resultados);
  return { campo, resultados, win };
}
