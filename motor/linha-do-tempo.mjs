import { registrarBloco, h, textoRico } from './nucleo.mjs';

const ROTULO_STATUS = { entregue: 'Entregue', retido: 'Retida na origem', 'nao-ocorre': 'Não ocorre' };

export function simular(config, falhasAtivas) {
  const parados = new Set((config.falhas ?? []).filter((f) => falhasAtivas.has(f.id)).map((f) => f.ator));
  const status = new Map();
  const aguardando = {};
  const eventos = config.eventos.map((e) => {
    let s = 'entregue';
    if (e.depende !== undefined && status.get(e.depende) !== 'entregue') s = 'nao-ocorre';
    else if (parados.has(e.de)) s = 'nao-ocorre';
    else if (parados.has(e.para)) s = 'retido';
    status.set(e.id, s);
    if (s === 'retido') aguardando[e.de] = (aguardando[e.de] ?? 0) + 1;
    return { ...e, status: s };
  });
  return { eventos, aguardando };
}

registrarBloco('linha-do-tempo', (casca, b, ctx) => {
  const { doc, win } = ctx;
  const rotulo = Object.fromEntries(b.atores.map((a) => [a.id, a.rotulo]));
  const ativas = new Set();
  const lista = h(doc, 'ol', { class: 'tempo__eventos', 'aria-live': 'polite' });
  const resumo = h(doc, 'p', { class: 'tempo__resumo', 'aria-live': 'polite' });
  let revelados = 0;
  let temporizador = null;

  const parar = () => { if (temporizador) win.clearInterval(temporizador); temporizador = null; };
  const desenhar = () => {
    const r = simular(b, ativas);
    lista.replaceChildren(...r.eventos.slice(0, revelados).map((e, i) => h(doc, 'li', { class: `tempo__evento tempo--${e.status}` }, [
      h(doc, 'span', { class: 'tempo__marca', texto: `t${i + 1}` }),
      h(doc, 'span', { class: 'tempo__rota', texto: `${rotulo[e.de]} → ${rotulo[e.para]}` }),
      h(doc, 'span', { class: 'tempo__mensagem' }, [textoRico(doc, e.mensagem)]),
      h(doc, 'span', { class: 'tempo__status', texto: ROTULO_STATUS[e.status] }),
    ])));
    if (revelados >= r.eventos.length) {
      const pendentes = Object.entries(r.aguardando).map(([ator, n]) => `${rotulo[ator]}: ${n}`);
      resumo.textContent = pendentes.length ? `Mensagens aguardando consumo: ${pendentes.join(', ')}.` : 'Todas as mensagens foram entregues ou não chegaram a ser produzidas.';
    } else {
      resumo.textContent = '';
    }
  };
  const passo = () => {
    revelados = Math.min(revelados + 1, b.eventos.length);
    desenhar();
    if (revelados >= b.eventos.length) parar();
  };
  const reduzirMovimento = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reproduzir = () => {
    parar();
    revelados = 0;
    if (reduzirMovimento) { revelados = b.eventos.length; desenhar(); return; }
    desenhar();
    temporizador = win.setInterval(passo, 700);
  };
  const reiniciar = () => { parar(); revelados = 0; desenhar(); };

  const falhas = (b.falhas ?? []).map((f) => h(doc, 'label', { class: 'tempo__falha' }, [
    h(doc, 'input', { type: 'checkbox', onchange: (ev) => { if (ev.target.checked) ativas.add(f.id); else ativas.delete(f.id); reiniciar(); } }),
    doc.createTextNode(` ${f.rotulo}`),
  ]));
  casca.append(h(doc, 'div', { class: 'tempo' }, [
    h(doc, 'p', { class: 'tempo__titulo', texto: b.titulo ?? 'Linha do tempo' }),
    h(doc, 'ul', { class: 'tempo__atores' }, b.atores.map((a) => h(doc, 'li', { texto: a.rotulo }))),
    falhas.length ? h(doc, 'fieldset', { class: 'tempo__falhas' }, [h(doc, 'legend', { texto: 'Falhas simuladas' }), ...falhas]) : h(doc, 'span'),
    h(doc, 'div', { class: 'tempo__controles' }, [
      h(doc, 'button', { type: 'button', class: 'botao botao--primario', texto: '▶ Reproduzir', onclick: reproduzir }),
      h(doc, 'button', { type: 'button', class: 'botao', texto: 'Próximo evento', onclick: () => { parar(); passo(); } }),
      h(doc, 'button', { type: 'button', class: 'botao', texto: 'Reiniciar', onclick: reiniciar }),
    ]),
    lista,
    resumo,
  ]));
  desenhar();
});
