export function criarArmazenamento(obterStorage) {
  let storage = null;
  try {
    storage = obterStorage();
  } catch {
    storage = null;
  }
  return {
    ler(chave, padrao = null) {
      try {
        const valor = storage ? storage.getItem(chave) : null;
        return valor === null || valor === undefined ? padrao : JSON.parse(valor);
      } catch {
        return padrao;
      }
    },
    gravar(chave, valor) {
      try {
        if (!storage) return false;
        storage.setItem(chave, JSON.stringify(valor));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function chaveProgresso(caminho, item) {
  return `oda:${caminho}:${item}`;
}

export function ativarObjetivos(doc, armazenamento, caminho) {
  const titulo = doc.getElementById('objetivos-de-aprendizagem');
  const lista = titulo ? titulo.nextElementSibling : null;
  if (!lista) return 0;
  const caixas = [...lista.querySelectorAll('input[type="checkbox"]')];
  caixas.forEach((caixa, i) => {
    const chave = chaveProgresso(caminho, `objetivo-${i}`);
    caixa.disabled = false;
    caixa.checked = armazenamento.ler(chave, false) === true;
    caixa.addEventListener('change', () => armazenamento.gravar(chave, caixa.checked));
  });
  return caixas.length;
}
