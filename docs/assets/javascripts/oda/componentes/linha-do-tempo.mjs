import { registrar, criarElemento, textoRico } from '../nucleo.mjs';

const ROTULO_STATUS = { entregue: 'Entregue', retido: 'Retida na origem', 'nao-ocorre': 'Não ocorre' };

export function validarConfig(config) {
  const erros = [];
  if (!Array.isArray(config.atores) || config.atores.length < 2) return ['"atores" precisa ter ao menos dois atores.'];
  if (!Array.isArray(config.eventos) || config.eventos.length === 0) return ['"eventos" precisa ser uma lista não vazia.'];
  const atores = new Set(config.atores.map((a) => a.id));
  const anteriores = new Set();
  for (const e of config.eventos) {
    for (const ator of [e.de, e.para]) if (!atores.has(ator)) erros.push(`Evento ${e.id}: ator "${ator}" não existe.`);
    if (e.depende !== undefined && !anteriores.has(e.depende)) erros.push(`Evento ${e.id}: depende de "${e.depende}", que não é um evento anterior.`);
    if (typeof e.mensagem !== 'string') erros.push(`Evento ${e.id}: "mensagem" ausente.`);
    anteriores.add(e.id);
  }
  for (const f of config.falhas ?? []) if (!atores.has(f.ator)) erros.push(`Falha ${f.id}: ator "${f.ator}" não existe.`);
  return erros;
}

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

function montar(el, config, ctx) {
  const erros = validarConfig(config);
  if (erros.length) throw new Error(erros.join(' '));
  const { doc } = ctx;
  const rotulo = Object.fromEntries(config.atores.map((a) => [a.id, a.rotulo]));
  const ativas = new Set();
  const lista = criarElemento(doc, 'ol', { class: 'oda-tempo__eventos', 'aria-live': 'polite' });
  const resumo = criarElemento(doc, 'p', { class: 'oda-tempo__resumo', 'aria-live': 'polite' });
  let revelados = 0;
  let temporizador = null;

  const parar = () => { if (temporizador) clearInterval(temporizador); temporizador = null; };
  const desenhar = () => {
    const r = simular(config, ativas);
    lista.replaceChildren(...r.eventos.slice(0, revelados).map((e, i) => criarElemento(doc, 'li', { class: `oda-tempo__evento oda-tempo--${e.status}` }, [
      doc.createTextNode(`t${i + 1}: ${rotulo[e.de]} → ${rotulo[e.para]}: `),
      textoRico(doc, e.mensagem),
      doc.createTextNode(` (${ROTULO_STATUS[e.status]})`),
    ])));
    if (revelados >= r.eventos.length) {
      const pendentes = Object.entries(r.aguardando).map(([ator, n]) => `${rotulo[ator]}: ${n}`);
      resumo.textContent = pendentes.length ? `Mensagens aguardando consumo: ${pendentes.join(', ')}.` : 'Todas as mensagens foram entregues ou não chegaram a ser produzidas.';
    } else {
      resumo.textContent = '';
    }
  };
  const passo = () => {
    revelados = Math.min(revelados + 1, config.eventos.length);
    desenhar();
    if (revelados >= config.eventos.length) parar();
  };
  const reduzirMovimento = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reproduzir = () => {
    parar();
    revelados = 0;
    if (reduzirMovimento) { revelados = config.eventos.length; desenhar(); return; }
    desenhar();
    temporizador = setInterval(passo, 700);
  };
  const reiniciar = () => { parar(); revelados = 0; desenhar(); };

  const falhas = (config.falhas ?? []).map((f) => criarElemento(doc, 'label', { class: 'oda-tempo__falha' }, [
    criarElemento(doc, 'input', { type: 'checkbox', onchange: (ev) => { if (ev.target.checked) ativas.add(f.id); else ativas.delete(f.id); reiniciar(); } }),
    doc.createTextNode(` ${f.rotulo}`),
  ]));
  const botoes = [
    criarElemento(doc, 'button', { type: 'button', class: 'md-button md-button--primary', texto: 'Reproduzir', onclick: reproduzir }),
    criarElemento(doc, 'button', { type: 'button', class: 'md-button', texto: 'Próximo evento', onclick: () => { parar(); passo(); } }),
    criarElemento(doc, 'button', { type: 'button', class: 'md-button', texto: 'Reiniciar', onclick: reiniciar }),
  ];
  const elenco = criarElemento(doc, 'p', { class: 'oda-tempo__atores', texto: `Atores: ${config.atores.map((a) => a.rotulo).join(', ')}.` });
  el.replaceChildren(elenco, ...(falhas.length ? [criarElemento(doc, 'fieldset', {}, [criarElemento(doc, 'legend', { texto: 'Falhas simuladas' }), ...falhas])] : []), ...botoes, lista, resumo);
  desenhar();
}

registrar('linha-do-tempo', montar);
