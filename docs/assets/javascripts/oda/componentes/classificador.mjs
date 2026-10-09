import { registrar, criarElemento, textoRico } from '../nucleo.mjs';

export function validarConfig(config) {
  const erros = [];
  const { categorias, itens } = config;
  if (!Array.isArray(categorias) || categorias.length < 2) return ['"categorias" precisa ter ao menos duas entradas.'];
  if (!Array.isArray(itens) || itens.length === 0) return ['"itens" precisa ser uma lista não vazia.'];
  const ids = new Set();
  for (const c of categorias) {
    if (typeof c.id !== 'string' || typeof c.rotulo !== 'string') erros.push('Toda categoria precisa de "id" e "rotulo".');
    else if (ids.has(c.id)) erros.push(`Categoria "${c.id}" repetida.`);
    ids.add(c.id);
  }
  itens.forEach((item, i) => {
    if (typeof item.texto !== 'string' || !item.texto.trim()) erros.push(`Item ${i + 1}: "texto" ausente.`);
    if (!ids.has(item.categoria)) erros.push(`Item ${i + 1}: categoria "${item.categoria}" não existe.`);
    if (typeof item.explicacao !== 'string' || !item.explicacao.trim()) erros.push(`Item ${i + 1}: "explicacao" ausente.`);
  });
  return erros;
}

export function verificar(itens, atribuicoes) {
  const porItem = itens.map((item, i) => {
    const escolhida = atribuicoes[i];
    const respondido = typeof escolhida === 'string' && escolhida !== '';
    return { respondido, correto: respondido && escolhida === item.categoria, esperado: item.categoria, explicacao: item.explicacao };
  });
  return { acertos: porItem.filter((r) => r.correto).length, total: itens.length, porItem };
}

function montar(el, config, ctx) {
  const erros = validarConfig(config);
  if (erros.length) throw new Error(erros.join(' '));
  const { doc } = ctx;
  const rotulos = Object.fromEntries(config.categorias.map((c) => [c.id, c.rotulo]));
  const seletores = [];
  const retornos = [];
  const linhas = config.itens.map((item) => {
    const seletor = criarElemento(doc, 'select', { 'aria-label': `Categoria para ${item.texto}` }, [
      criarElemento(doc, 'option', { value: '', texto: 'Escolha a categoria' }),
      ...config.categorias.map((c) => criarElemento(doc, 'option', { value: c.id, texto: c.rotulo })),
    ]);
    const retorno = criarElemento(doc, 'td', { 'aria-live': 'polite' });
    seletores.push(seletor);
    retornos.push(retorno);
    return criarElemento(doc, 'tr', {}, [
      criarElemento(doc, 'td', {}, [textoRico(doc, item.texto)]),
      criarElemento(doc, 'td', {}, [seletor]),
      retorno,
    ]);
  });
  const tabela = criarElemento(doc, 'table', { class: 'oda-classificador__tabela' }, [
    criarElemento(doc, 'thead', {}, [criarElemento(doc, 'tr', {}, [
      criarElemento(doc, 'th', { texto: 'Item' }),
      criarElemento(doc, 'th', { texto: 'Categoria' }),
      criarElemento(doc, 'th', { texto: 'Retorno' }),
    ])]),
    criarElemento(doc, 'tbody', {}, linhas),
  ]);
  const resultado = criarElemento(doc, 'p', { 'aria-live': 'polite' });
  const botao = criarElemento(doc, 'button', {
    type: 'button', class: 'md-button md-button--primary', texto: 'Verificar',
    onclick: () => {
      const r = verificar(config.itens, seletores.map((s) => s.value));
      r.porItem.forEach((ri, i) => {
        retornos[i].className = ri.correto ? 'oda-ok' : 'oda-falha';
        retornos[i].replaceChildren(ri.respondido
          ? textoRico(doc, `${ri.correto ? 'Correto.' : `Incorreto. Resposta: ${rotulos[ri.esperado]}.`} ${ri.explicacao}`)
          : doc.createTextNode('Sem resposta.'));
      });
      resultado.textContent = `Resultado: ${r.acertos} de ${r.total}.`;
    },
  });
  const filhos = config.enunciado ? [criarElemento(doc, 'p', {}, [textoRico(doc, config.enunciado)])] : [];
  el.replaceChildren(...filhos, tabela, botao, resultado);
}

registrar('classificador', montar);
