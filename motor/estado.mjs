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

function objeto(valor) {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? { ...valor } : {};
}

export function criarEstado(armazenamento, chave) {
  const salvo = objeto(armazenamento.ler(chave, null));
  let dados = { abas: objeto(salvo.abas), marcas: objeto(salvo.marcas), flags: objeto(salvo.flags) };
  const ouvintes = new Set();
  const mudar = () => {
    armazenamento.gravar(chave, dados);
    for (const fn of [...ouvintes]) fn();
  };
  return {
    abaConcluida: (id) => dados.abas[id] === true,
    concluirAba(id) { dados.abas[id] = true; mudar(); },
    marca: (id) => dados.marcas[id] === true,
    definirMarca(id, valor) { dados.marcas[id] = valor === true; mudar(); },
    flag: (nome) => dados.flags[nome] === true,
    definirFlag(nome, valor) { dados.flags[nome] = valor === true; mudar(); },
    assinar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
    reiniciar() { dados = { abas: {}, marcas: {}, flags: {} }; mudar(); },
  };
}
