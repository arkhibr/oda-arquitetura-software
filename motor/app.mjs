import { h, renderizarBloco, avisar } from './nucleo.mjs';
import { criarArmazenamento, criarEstado } from './estado.mjs';
import { abaDoHash, vizinhas, progresso } from './roteador.mjs';
import { montarBusca } from './busca.mjs';
import './blocos-texto.mjs';
import './blocos-codigo.mjs';
import './blocos-acao.mjs';
import './terminal.mjs';
import './console-api.mjs';
import './blocos-avaliacao.mjs';
import './linha-do-tempo.mjs';

export function iniciar(doc, win) {
  const dados = JSON.parse(doc.getElementById('oda-dados').textContent);
  const ids = dados.abas.map((a) => a.id);
  const armazenamento = criarArmazenamento(() => win.localStorage);
  const estado = criarEstado(armazenamento, `oda-app:${dados.id}`);
  const raiz = doc.documentElement;
  raiz.dataset.tema = armazenamento.ler('oda-app:tema', 'escuro') === 'claro' ? 'claro' : 'escuro';

  const ctx = { doc, win, estado, armazenamento, abas: dados.abas, avisar: (t) => avisar(doc, t) };
  ctx.renderizarBloco = (bloco) => renderizarBloco(doc, bloco, ctx);

  const barra = h(doc, 'ol', { class: 'progresso', 'aria-label': 'Progresso por etapa' });
  const contador = h(doc, 'span', { class: 'progresso__texto' });
  const busca = h(doc, 'div', { class: 'busca' });
  const botaoFoco = h(doc, 'button', { type: 'button', class: 'botao', texto: 'Foco', 'aria-pressed': 'false' });
  const botaoTema = h(doc, 'button', { type: 'button', class: 'botao', texto: 'Tema' });
  const cabecalho = h(doc, 'header', { class: 'cabecalho' }, [
    h(doc, 'div', { class: 'cabecalho__linha' }, [
      h(doc, 'h1', { class: 'cabecalho__titulo', texto: `ODA ${dados.id} · ${dados.titulo}` }),
      h(doc, 'div', { class: 'cabecalho__acoes' }, [busca, botaoFoco, botaoTema]),
    ]),
    h(doc, 'p', { class: 'cabecalho__meta' }, [
      h(doc, 'span', { class: 'etiqueta', texto: dados.repositorio }),
      h(doc, 'span', { texto: ` @ ${dados.commit} · ${dados.minutos} min · ` }),
      contador,
    ]),
    barra,
  ]);

  const lista = h(doc, 'nav', { class: 'abas', role: 'tablist', 'aria-label': 'Etapas da ODA' });
  const principal = h(doc, 'main', { class: 'conteudo' });
  const botoesAba = new Map();
  const paineis = new Map();

  dados.abas.forEach((aba, i) => {
    const botao = h(doc, 'button', { type: 'button', role: 'tab', id: `aba-${aba.id}`, 'aria-controls': `painel-${aba.id}`, class: 'aba', onclick: () => mostrar(aba.id) }, [
      h(doc, 'span', { class: 'aba__num', texto: String(i + 1) }), doc.createTextNode(` ${aba.titulo}`)]);
    botao.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      const destino = ids[(i + (ev.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
      mostrar(destino);
      botoesAba.get(destino).focus();
    });
    lista.append(botao);
    botoesAba.set(aba.id, botao);
    barra.append(h(doc, 'li', { 'data-aba': aba.id, title: aba.titulo }));

    const { anterior, proxima } = vizinhas(ids, aba.id);
    const concluir = h(doc, 'button', { type: 'button', class: 'botao concluir', onclick: () => { estado.concluirAba(aba.id); ctx.avisar(`Etapa "${aba.titulo}" concluída`); } });
    const rodape = h(doc, 'footer', { class: 'painel__rodape' }, [
      h(doc, 'button', { type: 'button', class: 'botao anterior', texto: '◀ Anterior', disabled: anterior === null, onclick: () => anterior && mostrar(anterior, true) }),
      concluir,
      h(doc, 'button', { type: 'button', class: 'botao botao--primario proxima', texto: 'Próxima etapa ▶', disabled: proxima === null, onclick: () => proxima && mostrar(proxima, true) }),
    ]);
    const painel = h(doc, 'section', { role: 'tabpanel', id: `painel-${aba.id}`, 'aria-labelledby': `aba-${aba.id}`, class: 'painel', hidden: true }, [
      h(doc, 'h2', { class: 'painel__titulo', texto: aba.titulo }),
      ...aba.blocos.map((bloco) => ctx.renderizarBloco(bloco)),
      rodape,
    ]);
    painel.concluir = concluir;
    paineis.set(aba.id, painel);
    principal.append(painel);
  });

  function atualizarProgresso() {
    const p = progresso(ids, (id) => estado.abaConcluida(id));
    contador.textContent = `progresso ${p.feitas}/${p.total}`;
    for (const li of barra.children) li.classList.toggle('feita', estado.abaConcluida(li.dataset.aba));
    for (const [id, painel] of paineis) {
      const feita = estado.abaConcluida(id);
      painel.concluir.textContent = feita ? '✓ Etapa concluída' : 'Concluir etapa';
      painel.concluir.setAttribute('aria-pressed', String(feita));
      botoesAba.get(id).classList.toggle('aba--feita', feita);
    }
  }

  function mostrar(id, rolar = false) {
    for (const [chave, painel] of paineis) {
      const ativo = chave === id;
      painel.hidden = !ativo;
      botoesAba.get(chave).setAttribute('aria-selected', String(ativo));
      botoesAba.get(chave).tabIndex = ativo ? 0 : -1;
    }
    if (win.location.hash !== `#${id}`) win.history.replaceState(null, '', `#${id}`);
    if (rolar) win.scrollTo({ top: 0 });
  }

  botaoTema.addEventListener('click', () => {
    raiz.dataset.tema = raiz.dataset.tema === 'claro' ? 'escuro' : 'claro';
    armazenamento.gravar('oda-app:tema', raiz.dataset.tema);
  });
  const sairFoco = h(doc, 'button', { type: 'button', class: 'botao botao--primario sair-foco', texto: 'Sair do foco' });
  const definirFoco = (ativo) => {
    doc.body.classList.toggle('modo-foco', ativo);
    botaoFoco.setAttribute('aria-pressed', String(ativo));
    if (ativo) sairFoco.focus(); else botaoFoco.focus();
  };
  botaoFoco.addEventListener('click', () => definirFoco(true));
  sairFoco.addEventListener('click', () => definirFoco(false));
  doc.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && doc.body.classList.contains('modo-foco')) definirFoco(false); });
  win.addEventListener('hashchange', () => mostrar(abaDoHash(win.location.hash, ids)));

  ctx.mostrarAba = mostrar;
  ctx.campoBusca = busca;
  estado.assinar(atualizarProgresso);
  doc.getElementById('app').replaceChildren(cabecalho, lista, principal, sairFoco);
  atualizarProgresso();
  mostrar(abaDoHash(win.location.hash, ids));
  montarBusca(ctx, dados);
  return ctx;
}
