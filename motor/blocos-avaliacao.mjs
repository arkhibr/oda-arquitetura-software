import { registrarBloco, h, textoRico } from './nucleo.mjs';

export function irPara(indice, total) {
  return Math.max(0, Math.min(indice, total - 1));
}

export function verificar(itens, atribuicoes) {
  const porItem = itens.map((item, i) => {
    const escolhida = atribuicoes[i];
    const respondido = typeof escolhida === 'string' && escolhida !== '';
    return { respondido, correto: respondido && escolhida === item.categoria, esperado: item.categoria, explicacao: item.explicacao };
  });
  return { acertos: porItem.filter((r) => r.correto).length, total: itens.length, porItem };
}

export function corrigir(perguntas, respostas) {
  const porPergunta = perguntas.map((p, i) => {
    const escolhida = respostas[i];
    const respondida = Number.isInteger(escolhida) && escolhida >= 0 && escolhida < p.alternativas.length;
    if (!respondida) return { respondida: false, correta: false, explicacao: null };
    const alternativa = p.alternativas[escolhida];
    return { respondida: true, correta: alternativa.correta === true, explicacao: alternativa.explicacao };
  });
  return { acertos: porPergunta.filter((r) => r.correta).length, total: perguntas.length, porPergunta };
}

let sequencia = 0;
const retorno = (doc, el, certo, texto) => {
  el.className = `retorno ${certo ? 'retorno--certo' : 'retorno--errado'}`;
  el.replaceChildren(textoRico(doc, texto));
};

registrarBloco('fluxo', (casca, b, ctx) => {
  const { doc } = ctx;
  const total = b.etapas.length;
  let atual = 0;
  const painel = h(doc, 'div', { class: 'fluxo__painel', 'aria-live': 'polite' });
  const anterior = h(doc, 'button', { type: 'button', class: 'botao', texto: '◀ Etapa anterior' });
  const proxima = h(doc, 'button', { type: 'button', class: 'botao botao--primario', texto: 'Próxima etapa ▶' });
  const etapas = b.etapas.map((e, i) => h(doc, 'button', { type: 'button', class: 'fluxo__etapa', texto: `${i + 1}. ${e.titulo}`, onclick: () => mostrar(i) }));
  function mostrar(i) {
    atual = irPara(i, total);
    const e = b.etapas[atual];
    etapas.forEach((bt, j) => bt.setAttribute('aria-current', j === atual ? 'step' : 'false'));
    painel.replaceChildren(
      h(doc, 'p', { class: 'fluxo__titulo', texto: `Etapa ${atual + 1} de ${total}: ${e.titulo}` }),
      h(doc, 'p', {}, [textoRico(doc, e.descricao)]),
      e.codigo ? ctx.renderizarBloco({ tipo: 'editor', id: `${b.id}-e${atual}`, rotulo: 'arquivo', caminho: e.codigo.arquivo, commit: e.codigo.commit, linhas: e.codigo.linhas, destaque: e.codigo.destaque }) : h(doc, 'span'),
    );
    anterior.disabled = atual === 0;
    proxima.disabled = atual === total - 1;
  }
  anterior.addEventListener('click', () => mostrar(atual - 1));
  proxima.addEventListener('click', () => mostrar(atual + 1));
  casca.append(h(doc, 'div', { class: 'fluxo' }, [
    h(doc, 'p', { class: 'fluxo__nome', texto: b.titulo }),
    h(doc, 'div', { class: 'fluxo__etapas' }, etapas), painel,
    h(doc, 'div', { class: 'fluxo__nav' }, [anterior, proxima]),
  ]));
  mostrar(0);
});

registrarBloco('classificador', (casca, b, ctx) => {
  const { doc } = ctx;
  const rotulos = Object.fromEntries(b.categorias.map((c) => [c.id, c.rotulo]));
  const seletores = [];
  const retornos = [];
  const linhas = b.itens.map((item) => {
    const sel = h(doc, 'select', { 'aria-label': `Categoria de ${item.texto}` }, [h(doc, 'option', { value: '', texto: 'Escolha…' }), ...b.categorias.map((c) => h(doc, 'option', { value: c.id, texto: c.rotulo }))]);
    const ret = h(doc, 'div', { 'aria-live': 'polite' });
    seletores.push(sel);
    retornos.push(ret);
    return h(doc, 'li', { class: 'classificador__item' }, [h(doc, 'span', {}, [textoRico(doc, item.texto)]), sel, ret]);
  });
  const resultado = h(doc, 'p', { class: 'resultado', 'aria-live': 'polite' });
  casca.append(h(doc, 'div', { class: 'classificador' }, [
    b.enunciado ? h(doc, 'p', {}, [textoRico(doc, b.enunciado)]) : h(doc, 'span'),
    h(doc, 'ul', {}, linhas),
    h(doc, 'button', { type: 'button', class: 'botao botao--primario', texto: 'Verificar', onclick: () => {
      const r = verificar(b.itens, seletores.map((s) => s.value));
      r.porItem.forEach((ri, i) => retorno(doc, retornos[i], ri.correto, ri.respondido ? `${ri.correto ? 'Correto.' : `Incorreto. Resposta: ${rotulos[ri.esperado]}.`} ${ri.explicacao}` : 'Sem resposta.'));
      resultado.textContent = `Resultado: ${r.acertos} de ${r.total}.`;
    } }),
    resultado,
  ]));
});

registrarBloco('quiz', (casca, b, ctx) => {
  const { doc, estado } = ctx;
  const id = `quiz-${++sequencia}`;
  const retornos = [];
  const perguntas = b.perguntas.map((p, i) => {
    const ret = h(doc, 'div', { 'aria-live': 'polite' });
    retornos.push(ret);
    return h(doc, 'fieldset', { class: 'quiz__pergunta' }, [
      h(doc, 'legend', {}, [textoRico(doc, `${i + 1}. ${p.enunciado}`)]),
      ...p.alternativas.map((a, j) => h(doc, 'label', { class: 'quiz__alternativa' }, [h(doc, 'input', { type: 'radio', name: `${id}-${i}`, value: String(j) }), doc.createTextNode(' '), textoRico(doc, a.texto)])),
      ret,
    ]);
  });
  const resultado = h(doc, 'p', { class: 'resultado', 'aria-live': 'polite' });
  casca.append(h(doc, 'div', { class: 'quiz' }, [...perguntas,
    h(doc, 'button', { type: 'button', class: 'botao botao--primario', texto: 'Corrigir', onclick: () => {
      const respostas = b.perguntas.map((_, i) => { const m = casca.querySelector(`input[name="${id}-${i}"]:checked`); return m ? Number(m.value) : null; });
      const r = corrigir(b.perguntas, respostas);
      r.porPergunta.forEach((rp, i) => retorno(doc, retornos[i], rp.correta, rp.respondida ? `${rp.correta ? 'Correto.' : 'Incorreto.'} ${rp.explicacao}` : 'Pergunta sem resposta.'));
      resultado.textContent = `Resultado: ${r.acertos} de ${r.total}.`;
      estado.definirMarca(`${b.id}:resultado`, r.acertos === r.total);
    } }),
    resultado]));
});

registrarBloco('incidente', (casca, b, ctx) => {
  const { doc } = ctx;
  const nome = `incidente-${++sequencia}`;
  const ret = h(doc, 'div', { 'aria-live': 'polite' });
  const correcao = h(doc, 'div', { class: 'incidente__correcao', hidden: true }, [h(doc, 'strong', { texto: '🔧 Correção: ' }), textoRico(doc, b.correcao)]);
  casca.append(h(doc, 'div', { class: 'incidente' }, [
    h(doc, 'p', { class: 'incidente__titulo', texto: `🚨 ${b.titulo}` }),
    ctx.renderizarBloco({ tipo: 'editor', id: `${b.id}-saida`, rotulo: b.rotulo_saida ?? 'saida', linhas: b.saida.split('\n'), origem: b.origem }),
    h(doc, 'fieldset', { class: 'quiz__pergunta' }, [
      h(doc, 'legend', {}, [textoRico(doc, b.pergunta)]),
      ...b.alternativas.map((a, j) => h(doc, 'label', { class: 'quiz__alternativa' }, [
        h(doc, 'input', { type: 'radio', name: nome, value: String(j), onchange: () => {
          retorno(doc, ret, a.correta === true, `${a.correta ? 'Causa correta.' : 'Não é essa a causa.'} ${a.explicacao}`);
          if (a.correta) correcao.hidden = false;
        } }), doc.createTextNode(' '), textoRico(doc, a.texto)])),
      ret,
    ]),
    correcao,
  ]));
});
