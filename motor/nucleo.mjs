const renderizadores = new Map();

export function registrarBloco(tipo, renderizar) {
  renderizadores.set(tipo, renderizar);
}

export function tiposRegistrados() {
  return [...renderizadores.keys()].sort();
}

export function separarCodigo(texto) {
  return String(texto)
    .split('`')
    .map((parte, i) => ({ tipo: i % 2 === 1 ? 'codigo' : 'texto', texto: parte }))
    .filter((parte) => parte.texto !== '');
}

export function h(doc, tag, atributos = {}, filhos = []) {
  const el = doc.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (chave === 'texto') el.textContent = valor;
    else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
    else el.setAttribute(chave, valor === true ? '' : String(valor));
  }
  for (const filho of filhos) if (filho !== null && filho !== undefined && filho !== false) el.append(filho);
  return el;
}

export function textoRico(doc, texto) {
  const fragmento = doc.createDocumentFragment();
  for (const parte of separarCodigo(texto)) {
    fragmento.append(parte.tipo === 'codigo' ? h(doc, 'code', { texto: parte.texto }) : doc.createTextNode(parte.texto));
  }
  return fragmento;
}

export function renderizarBloco(doc, bloco, ctx) {
  const casca = h(doc, 'section', { class: `bloco bloco--${bloco.tipo}`, id: bloco.id });
  try {
    const renderizar = renderizadores.get(bloco.tipo);
    if (!renderizar) throw new Error(`tipo de bloco desconhecido: ${bloco.tipo}`);
    renderizar(casca, bloco, ctx);
  } catch (erro) {
    casca.replaceChildren(h(doc, 'p', { class: 'bloco-erro', role: 'alert', texto: `O bloco "${bloco.tipo}" não pôde ser exibido: ${erro.message}` }));
  }
  return casca;
}

export function avisar(doc, texto) {
  let area = doc.querySelector('.avisos');
  if (!area) {
    area = h(doc, 'div', { class: 'avisos', role: 'status', 'aria-live': 'polite' });
    doc.body.append(area);
  }
  const aviso = h(doc, 'div', { class: 'aviso', texto });
  area.append(aviso);
  setTimeout(() => aviso.remove(), 2500);
}
