import { registrarBloco, h, textoRico } from './nucleo.mjs';
import { aplicarEfeito } from './blocos-acao.mjs';

export function normalizarComando(texto) {
  return String(texto).trim().replace(/\s+/g, ' ');
}

export function condicaoSatisfeita(condicao, flag) {
  if (!condicao) return true;
  if (Array.isArray(condicao)) return condicao.every((c) => condicaoSatisfeita(c, flag));
  return condicao.startsWith('!') ? !flag(condicao.slice(1)) : flag(condicao);
}

export function disponiveis(comandos) {
  return [...new Set(comandos.map((c) => normalizarComando(c.entrada)))];
}

export function resolverComando(comandos, entrada, flag) {
  const alvo = normalizarComando(entrada);
  if (alvo === '') return { tipo: 'vazio' };
  if (alvo === 'clear' || alvo === 'limpar') return { tipo: 'limpar' };
  if (alvo === 'help' || alvo === 'ajuda') return { tipo: 'ajuda', disponiveis: disponiveis(comandos) };
  const escolhido = comandos.find((c) => normalizarComando(c.entrada) === alvo && condicaoSatisfeita(c.condicao, flag));
  if (!escolhido) return { tipo: 'desconhecido', disponiveis: disponiveis(comandos) };
  return { tipo: 'executado', saida: escolhido.saida, origem: escolhido.origem, efeito: escolhido.efeito ?? null, dica: escolhido.dica ?? null };
}

export function criarHistorico() {
  const itens = [];
  let posicao = 0;
  return {
    adicionar(comando) { if (comando && itens[itens.length - 1] !== comando) itens.push(comando); posicao = itens.length; },
    anterior() { if (posicao > 0) posicao -= 1; return itens[posicao] ?? ''; },
    proximo() { if (posicao < itens.length) posicao += 1; return itens[posicao] ?? ''; },
  };
}

registrarBloco('terminal', (casca, b, ctx) => {
  const { doc, estado } = ctx;
  const prompt = b.prompt ?? '$';
  const historico = criarHistorico();
  const tela = h(doc, 'div', { class: 'terminal__tela', role: 'log', 'aria-live': 'polite', tabindex: '0' });
  const campo = h(doc, 'input', { type: 'text', class: 'terminal__campo', 'aria-label': 'Digite um comando', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'digite um comando ou "ajuda"' });

  const escrever = (classe, texto) => tela.append(h(doc, 'div', { class: classe, texto }));
  function executar(entrada) {
    const r = resolverComando(b.comandos, entrada, (n) => estado.flag(n));
    if (r.tipo === 'vazio') return;
    historico.adicionar(normalizarComando(entrada));
    escrever('terminal__comando', `${prompt} ${normalizarComando(entrada)}`);
    if (r.tipo === 'limpar') { tela.replaceChildren(); return; }
    if (r.tipo === 'ajuda' || r.tipo === 'desconhecido') {
      if (r.tipo === 'desconhecido') escrever('terminal__erro', 'comando não reconhecido neste laboratório');
      escrever('terminal__ajuda', `Comandos disponíveis:\n  ${r.disponiveis.join('\n  ')}`);
    } else {
      escrever('terminal__saida', r.saida);
      tela.append(h(doc, 'div', { class: 'terminal__origem', texto: `origem: ${r.origem}` }));
      aplicarEfeito(r.efeito, estado.definirFlag);
      if (r.dica) tela.append(h(doc, 'div', { class: 'terminal__dica' }, [h(doc, 'strong', { texto: '💡 Dica: ' }), textoRico(doc, r.dica)]));
    }
    tela.scrollTop = tela.scrollHeight;
  }

  campo.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { executar(campo.value); campo.value = ''; }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); campo.value = historico.anterior(); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); campo.value = historico.proximo(); }
  });

  const cenarios = (b.cenarios ?? []).map((c) => h(doc, 'button', { type: 'button', class: 'botao botao--primario', texto: `▶ ${c.rotulo}`, onclick: () => executar(c.comando) }));
  casca.append(h(doc, 'div', { class: 'terminal' }, [
    h(doc, 'div', { class: 'terminal__barra' }, [
      h(doc, 'span', { class: 'terminal__pontos', 'aria-hidden': 'true' }, [h(doc, 'i'), h(doc, 'i'), h(doc, 'i')]),
      h(doc, 'span', { class: 'terminal__titulo', texto: b.titulo ?? 'terminal' }),
      h(doc, 'button', { type: 'button', class: 'botao terminal__limpar', texto: 'Limpar', onclick: () => tela.replaceChildren() }),
    ]),
    tela,
    h(doc, 'label', { class: 'terminal__linha' }, [h(doc, 'span', { class: 'terminal__prompt', texto: prompt }), campo]),
  ]));
  if (cenarios.length) casca.append(h(doc, 'div', { class: 'terminal__cenarios' }, cenarios));
});
