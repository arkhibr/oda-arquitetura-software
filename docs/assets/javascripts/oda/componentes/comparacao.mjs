import { registrar, criarElemento, textoRico } from '../nucleo.mjs';

const LIMITE = 400;

export function validarConfig(config) {
  const erros = [];
  for (const lado of ['esquerda', 'direita']) {
    const v = config[lado];
    if (!v || typeof v.titulo !== 'string' || !Array.isArray(v.linhas)) erros.push(`"${lado}" precisa ter "titulo" e "linhas".`);
    else if (v.linhas.length > LIMITE) erros.push(`"${lado}" tem mais de ${LIMITE} linhas.`);
  }
  return erros;
}

export function diferencas(a, b) {
  const m = a.length;
  const n = b.length;
  const t = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    }
  }
  const esquerda = [];
  const direita = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      esquerda.push({ texto: a[i++], tipo: 'igual' });
      direita.push({ texto: b[j++], tipo: 'igual' });
    } else if (t[i + 1][j] >= t[i][j + 1]) {
      esquerda.push({ texto: a[i++], tipo: 'removida' });
    } else {
      direita.push({ texto: b[j++], tipo: 'adicionada' });
    }
  }
  while (i < m) esquerda.push({ texto: a[i++], tipo: 'removida' });
  while (j < n) direita.push({ texto: b[j++], tipo: 'adicionada' });
  return { esquerda, direita };
}

function montar(el, config, ctx) {
  const erros = validarConfig(config);
  if (erros.length) throw new Error(erros.join(' '));
  const { doc } = ctx;
  const d = diferencas(config.esquerda.linhas, config.direita.linhas);
  const coluna = (titulo, linhas) => criarElemento(doc, 'div', { class: 'oda-comparacao__lado' }, [
    criarElemento(doc, 'p', { class: 'oda-comparacao__titulo', texto: titulo }),
    criarElemento(doc, 'pre', {}, linhas.map((l) => criarElemento(doc, 'span', { class: `oda-linha--${l.tipo}`, texto: `${l.texto}\n` }))),
  ]);
  const grade = criarElemento(doc, 'div', { class: 'oda-comparacao__grade oda-comparacao--destacar' }, [
    coluna(config.esquerda.titulo, d.esquerda),
    coluna(config.direita.titulo, d.direita),
  ]);
  const alternar = criarElemento(doc, 'input', { type: 'checkbox', checked: true,
    onchange: (ev) => grade.classList.toggle('oda-comparacao--destacar', ev.target.checked) });
  const controle = criarElemento(doc, 'label', {}, [alternar, doc.createTextNode(' Destacar linhas exclusivas de cada lado')]);
  const notas = (config.notas ?? []).map((nota) => criarElemento(doc, 'li', {}, [textoRico(doc, nota)]));
  el.replaceChildren(controle, grade, ...(notas.length ? [criarElemento(doc, 'ul', {}, notas)] : []));
}

registrar('comparacao', montar);
