import { registrar, criarElemento, textoRico } from '../nucleo.mjs';

export function validarConfig(config) {
  if (!Array.isArray(config.passos) || config.passos.length === 0) return ['"passos" precisa ser uma lista não vazia.'];
  const erros = [];
  config.passos.forEach((p, i) => {
    if (typeof p.comando !== 'string' || !p.comando.trim()) erros.push(`Passo ${i + 1}: "comando" ausente.`);
    if (typeof p.saida !== 'string') erros.push(`Passo ${i + 1}: "saida" precisa ser texto.`);
  });
  return erros;
}

export function avancar(indice, total) {
  return Math.min(indice + 1, total);
}

export function concluido(indice, total) {
  return indice >= total;
}

function montar(el, config, ctx) {
  const erros = validarConfig(config);
  if (erros.length) throw new Error(erros.join(' '));
  const { doc } = ctx;
  const prompt = config.prompt ?? '$';
  const total = config.passos.length;
  let indice = 0;
  const tela = criarElemento(doc, 'pre', { class: 'oda-terminal__tela', role: 'log', 'aria-live': 'polite', tabindex: '0' });
  const nota = criarElemento(doc, 'p', { class: 'oda-terminal__nota', 'aria-live': 'polite' });
  const executar = criarElemento(doc, 'button', { type: 'button', class: 'md-button md-button--primary' });
  const reiniciar = criarElemento(doc, 'button', { type: 'button', class: 'md-button', texto: 'Reiniciar' });

  const atualizarBotao = () => {
    const fim = concluido(indice, total);
    executar.disabled = fim;
    executar.textContent = fim ? 'Sequência concluída' : `Executar: ${config.passos[indice].comando}`;
  };
  executar.addEventListener('click', () => {
    const passo = config.passos[indice];
    tela.append(
      criarElemento(doc, 'span', { class: 'oda-terminal__comando', texto: `${prompt} ${passo.comando}\n` }),
      criarElemento(doc, 'span', { texto: passo.saida ? `${passo.saida}\n` : '' }),
    );
    nota.replaceChildren(passo.nota ? textoRico(doc, passo.nota) : doc.createTextNode(''));
    indice = avancar(indice, total);
    atualizarBotao();
    tela.scrollTop = tela.scrollHeight;
  });
  reiniciar.addEventListener('click', () => {
    indice = 0;
    tela.replaceChildren();
    nota.replaceChildren();
    atualizarBotao();
  });
  atualizarBotao();
  const filhos = config.titulo ? [criarElemento(doc, 'p', { class: 'oda-terminal__titulo', texto: config.titulo })] : [];
  el.replaceChildren(...filhos, tela, executar, reiniciar, nota);
}

registrar('terminal', montar);
