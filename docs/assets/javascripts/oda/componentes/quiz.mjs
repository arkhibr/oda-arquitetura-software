import { registrar, criarElemento, textoRico } from '../nucleo.mjs';
import { chaveProgresso } from '../progresso.mjs';

export function validarConfig(config) {
  const perguntas = config.perguntas;
  if (!Array.isArray(perguntas) || perguntas.length === 0) return ['"perguntas" precisa ser uma lista não vazia.'];
  const erros = [];
  perguntas.forEach((p, i) => {
    const n = i + 1;
    if (typeof p.enunciado !== 'string' || !p.enunciado.trim()) erros.push(`Pergunta ${n}: "enunciado" ausente.`);
    if (!Array.isArray(p.alternativas) || p.alternativas.length < 2) {
      erros.push(`Pergunta ${n}: são necessárias ao menos duas alternativas.`);
      return;
    }
    const corretas = p.alternativas.filter((a) => a.correta === true).length;
    if (corretas !== 1) erros.push(`Pergunta ${n}: deve haver exatamente uma alternativa correta, e há ${corretas}.`);
    p.alternativas.forEach((a, j) => {
      if (typeof a.texto !== 'string' || !a.texto.trim()) erros.push(`Pergunta ${n}, alternativa ${j + 1}: "texto" ausente.`);
      if (typeof a.explicacao !== 'string' || !a.explicacao.trim()) erros.push(`Pergunta ${n}, alternativa ${j + 1}: "explicacao" ausente.`);
    });
  });
  return erros;
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

let contador = 0;

function montar(el, config, ctx) {
  const erros = validarConfig(config);
  if (erros.length) throw new Error(erros.join(' '));
  const { doc } = ctx;
  const id = `oda-quiz-${++contador}`;
  const retornos = [];
  const blocos = config.perguntas.map((p, i) => {
    const retorno = criarElemento(doc, 'p', { class: 'oda-quiz__retorno', 'aria-live': 'polite' });
    retornos.push(retorno);
    const alternativas = p.alternativas.map((a, j) => criarElemento(doc, 'label', { class: 'oda-quiz__alternativa' }, [
      criarElemento(doc, 'input', { type: 'radio', name: `${id}-p${i}`, value: String(j) }),
      doc.createTextNode(' '),
      textoRico(doc, a.texto),
    ]));
    return criarElemento(doc, 'fieldset', { class: 'oda-quiz__pergunta' }, [
      criarElemento(doc, 'legend', {}, [textoRico(doc, `${i + 1}. ${p.enunciado}`)]),
      ...alternativas,
      retorno,
    ]);
  });
  const resultado = criarElemento(doc, 'p', { class: 'oda-quiz__resultado', 'aria-live': 'polite' });
  const chave = chaveProgresso(ctx.caminho, 'quiz');
  const anterior = ctx.armazenamento.ler(chave);
  if (anterior && Number.isInteger(anterior.acertos)) {
    resultado.textContent = `Última tentativa neste navegador: ${anterior.acertos} de ${anterior.total}.`;
  }
  const corrigirRespostas = () => {
    const respostas = config.perguntas.map((_, i) => {
      const marcada = el.querySelector(`input[name="${id}-p${i}"]:checked`);
      return marcada ? Number(marcada.value) : null;
    });
    const r = corrigir(config.perguntas, respostas);
    r.porPergunta.forEach((rp, i) => {
      retornos[i].className = `oda-quiz__retorno ${rp.respondida ? (rp.correta ? 'oda-ok' : 'oda-falha') : 'oda-falha'}`;
      retornos[i].replaceChildren(rp.respondida
        ? textoRico(doc, `${rp.correta ? 'Correto.' : 'Incorreto.'} ${rp.explicacao}`)
        : doc.createTextNode('Pergunta sem resposta.'));
    });
    resultado.textContent = `Resultado: ${r.acertos} de ${r.total}.`;
    ctx.armazenamento.gravar(chave, { acertos: r.acertos, total: r.total, data: new Date().toISOString() });
  };
  const botao = criarElemento(doc, 'button', {
    type: 'button', class: 'md-button md-button--primary', texto: 'Corrigir', onclick: corrigirRespostas,
  });
  el.replaceChildren(...blocos, botao, resultado);
}

registrar('quiz', montar);
