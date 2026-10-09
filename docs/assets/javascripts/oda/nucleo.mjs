const registro = new Map();

export function registrar(nome, montar) {
  registro.set(nome, montar);
}

export function componentesRegistrados() {
  return [...registro.keys()].sort();
}

export function lerConfig(texto) {
  if (texto === null || texto === undefined || texto.trim() === '') return {};
  const config = JSON.parse(texto);
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('A configuração precisa ser um objeto JSON.');
  }
  return config;
}

export function separarCodigo(texto) {
  return String(texto)
    .split('`')
    .map((parte, i) => ({ tipo: i % 2 === 1 ? 'codigo' : 'texto', texto: parte }))
    .filter((parte) => parte.texto !== '');
}

export function criarElemento(doc, tag, atributos = {}, filhos = []) {
  const el = doc.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (chave === 'texto') el.textContent = valor;
    else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
    else el.setAttribute(chave, valor === true ? '' : String(valor));
  }
  for (const filho of filhos) if (filho) el.append(filho);
  return el;
}

export function textoRico(doc, texto) {
  const fragmento = doc.createDocumentFragment();
  for (const parte of separarCodigo(texto)) {
    fragmento.append(parte.tipo === 'codigo'
      ? criarElemento(doc, 'code', { texto: parte.texto })
      : doc.createTextNode(parte.texto));
  }
  return fragmento;
}

export function montarTodos(ctx) {
  const { doc } = ctx;
  for (const el of doc.querySelectorAll('[data-oda]:not([data-oda-montado])')) {
    const nome = el.dataset.oda;
    el.dataset.odaMontado = 'sim';
    try {
      const montar = registro.get(nome);
      if (!montar) throw new Error('componente desconhecido.');
      const script = el.querySelector(':scope > script[type="application/json"]');
      const config = lerConfig(script ? script.textContent : null);
      if (script) script.remove();
      el.classList.add('oda', `oda--${nome}`);
      montar(el, config, ctx);
    } catch (erro) {
      el.replaceChildren(criarElemento(doc, 'p', {
        class: 'oda-erro',
        role: 'alert',
        texto: `O componente "${nome}" não pôde ser montado: ${erro.message}`,
      }));
    }
  }
}
