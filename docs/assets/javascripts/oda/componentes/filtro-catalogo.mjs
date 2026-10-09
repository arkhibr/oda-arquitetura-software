import { registrar, criarElemento } from '../nucleo.mjs';

export function validarConfig() {
  return [];
}

export function filtrar(linhas, filtro) {
  return linhas.map((l) => (filtro.repositorio === '' || l.repositorio === filtro.repositorio)
    && (filtro.situacao === '' || l.situacao === filtro.situacao));
}

export function opcoes(linhas) {
  return [...new Set(linhas.map((l) => l.repositorio))].sort();
}

function montar(el, _config, ctx) {
  const { doc } = ctx;
  const linhasDom = [...doc.querySelectorAll('tr[data-repositorio][data-situacao]')];
  const dados = linhasDom.map((tr) => ({ repositorio: tr.dataset.repositorio, situacao: tr.dataset.situacao }));
  const repositorio = criarElemento(doc, 'select', { 'aria-label': 'Filtrar por repositório' }, [
    criarElemento(doc, 'option', { value: '', texto: 'Todos os repositórios' }),
    ...opcoes(dados).map((r) => criarElemento(doc, 'option', { value: r, texto: r })),
  ]);
  const situacao = criarElemento(doc, 'select', { 'aria-label': 'Filtrar por situação' }, [
    criarElemento(doc, 'option', { value: '', texto: 'Todas as situações' }),
    criarElemento(doc, 'option', { value: 'disponivel', texto: 'Disponível' }),
    criarElemento(doc, 'option', { value: 'planejada', texto: 'Planejada' }),
  ]);
  const contagem = criarElemento(doc, 'p', { 'aria-live': 'polite' });
  const aplicar = () => {
    const visiveis = filtrar(dados, { repositorio: repositorio.value, situacao: situacao.value });
    linhasDom.forEach((tr, i) => { tr.hidden = !visiveis[i]; });
    const n = visiveis.filter(Boolean).length;
    contagem.textContent = n === 0 ? 'Nenhuma ODA atende ao filtro selecionado.' : `${n} de ${dados.length} ODAs exibidas.`;
  };
  repositorio.addEventListener('change', aplicar);
  situacao.addEventListener('change', aplicar);
  el.replaceChildren(repositorio, doc.createTextNode(' '), situacao, contagem);
  aplicar();
}

registrar('filtro-catalogo', montar);
