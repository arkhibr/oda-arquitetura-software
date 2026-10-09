import { registrar, criarElemento, textoRico } from '../nucleo.mjs';

export function validarConfig(config) {
  if (!Array.isArray(config.etapas) || config.etapas.length === 0) return ['"etapas" precisa ser uma lista não vazia.'];
  const erros = [];
  config.etapas.forEach((e, i) => {
    const n = i + 1;
    if (typeof e.titulo !== 'string' || !e.titulo.trim()) erros.push(`Etapa ${n}: "titulo" ausente.`);
    if (typeof e.descricao !== 'string' || !e.descricao.trim()) erros.push(`Etapa ${n}: "descricao" ausente.`);
    if (e.codigo) {
      if (!Array.isArray(e.codigo.linhas)) erros.push(`Etapa ${n}: "codigo.linhas" precisa ser uma lista.`);
      else for (const linha of e.codigo.destaque ?? []) {
        if (!Number.isInteger(linha) || linha < 1 || linha > e.codigo.linhas.length) {
          erros.push(`Etapa ${n}: linha destacada ${linha} não existe no código.`);
        }
      }
    }
  });
  return erros;
}

export function irPara(indice, total) {
  return Math.max(0, Math.min(indice, total - 1));
}

function montar(el, config, ctx) {
  const erros = validarConfig(config);
  if (erros.length) throw new Error(erros.join(' '));
  const { doc } = ctx;
  const total = config.etapas.length;
  let atual = 0;
  const lista = criarElemento(doc, 'ol', { class: 'oda-passos__lista' });
  const painel = criarElemento(doc, 'div', { class: 'oda-passos__painel', 'aria-live': 'polite' });
  const anterior = criarElemento(doc, 'button', { type: 'button', class: 'md-button', texto: 'Etapa anterior' });
  const proxima = criarElemento(doc, 'button', { type: 'button', class: 'md-button md-button--primary', texto: 'Próxima etapa' });
  const botoesEtapa = config.etapas.map((e, i) => {
    const botao = criarElemento(doc, 'button', { type: 'button', class: 'oda-passos__etapa', texto: e.titulo, onclick: () => mostrar(i) });
    lista.append(criarElemento(doc, 'li', {}, [botao]));
    return botao;
  });

  function mostrar(indice) {
    atual = irPara(indice, total);
    const etapa = config.etapas[atual];
    botoesEtapa.forEach((b, i) => b.setAttribute('aria-current', i === atual ? 'step' : 'false'));
    const filhos = [
      criarElemento(doc, 'p', { class: 'oda-passos__titulo', texto: `Etapa ${atual + 1} de ${total}: ${etapa.titulo}` }),
      criarElemento(doc, 'p', {}, [textoRico(doc, etapa.descricao)]),
    ];
    if (etapa.codigo) {
      const destaque = new Set(etapa.codigo.destaque ?? []);
      if (etapa.codigo.arquivo) filhos.push(criarElemento(doc, 'p', { class: 'oda-passos__arquivo' }, [criarElemento(doc, 'code', { texto: etapa.codigo.arquivo })]));
      filhos.push(criarElemento(doc, 'pre', { class: 'oda-passos__codigo' }, etapa.codigo.linhas.map((linha, i) =>
        criarElemento(doc, 'span', { class: destaque.has(i + 1) ? 'oda-destaque' : null, texto: `${linha}\n` }))));
    }
    painel.replaceChildren(...filhos);
    anterior.disabled = atual === 0;
    proxima.disabled = atual === total - 1;
  }

  anterior.addEventListener('click', () => mostrar(atual - 1));
  proxima.addEventListener('click', () => mostrar(atual + 1));
  el.replaceChildren(lista, painel, anterior, proxima);
  mostrar(0);
}

registrar('passo-a-passo', montar);
