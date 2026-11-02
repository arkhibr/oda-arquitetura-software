import { registrarBloco, h, textoRico } from './nucleo.mjs';

const ICONES = { dica: '💡 Dica', erro: '⚠️ Erro comum', quebra: '⛔ Atenção', sucesso: '✅ Sucesso esperado', objetivo: '🎯 Por que este laboratório' };

export const CAMPOS_OBJETIVO = [['problema', 'Problema'], ['impacto', 'Por que importa'], ['mecanismo', 'Como o laboratório trata'], ['comprovacao', 'Como comprovar']];

registrarBloco('legenda', (casca, b, { doc }) => {
  casca.append(h(doc, 'p', { class: 'legenda' }, [textoRico(doc, b.texto)]));
});

registrarBloco('faixa', (casca, b, { doc }) => {
  const titulo = h(doc, 'strong', { class: 'faixa__titulo', texto: b.titulo ?? ICONES[b.estilo] });
  const corpo = b.estilo === 'objetivo'
    ? h(doc, 'dl', { class: 'faixa__objetivo' }, CAMPOS_OBJETIVO.flatMap(([campo, rotulo]) => [
      h(doc, 'dt', { texto: rotulo }), h(doc, 'dd', {}, [textoRico(doc, b[campo])])]))
    : b.estilo === 'erro'
    ? h(doc, 'dl', { class: 'faixa__erro' }, [
      h(doc, 'dt', { texto: 'Sintoma' }), h(doc, 'dd', {}, [textoRico(doc, b.sintoma)]),
      h(doc, 'dt', { texto: 'Causa' }), h(doc, 'dd', {}, [textoRico(doc, b.causa)]),
      h(doc, 'dt', { texto: 'Correção' }), h(doc, 'dd', {}, [textoRico(doc, b.correcao)])])
    : h(doc, 'span', {}, [textoRico(doc, b.texto)]);
  const links = b.links?.length
    ? h(doc, 'span', { class: 'faixa__links' }, b.links.map((l) => h(doc, 'a', { href: l.url, target: '_blank', rel: 'noopener', texto: l.rotulo })))
    : null;
  casca.append(h(doc, 'div', { class: `faixa faixa--${b.estilo}` }, [titulo, doc.createTextNode(' '), corpo, links]));
});

registrarBloco('conceito', (casca, b, { doc }) => {
  casca.append(h(doc, 'div', { class: 'conceito' }, [
    h(doc, 'h3', { texto: b.titulo }),
    h(doc, 'p', {}, [textoRico(doc, b.texto)]),
    b.analogia ? h(doc, 'p', { class: 'analogia' }, [h(doc, 'strong', { texto: 'Analogia: ' }), textoRico(doc, b.analogia)]) : null,
  ]));
});

registrarBloco('adr', (casca, b, { doc }) => {
  const campo = (rotulo, texto) => h(doc, 'div', { class: 'adr__campo' }, [h(doc, 'strong', { texto: rotulo }), h(doc, 'p', {}, [textoRico(doc, texto)])]);
  casca.append(h(doc, 'details', { class: 'adr' }, [
    h(doc, 'summary', {}, [
      h(doc, 'span', { class: 'adr__id', texto: b.id_adr ?? b.adr ?? b.titulo.split(' ')[0] }),
      doc.createTextNode(` ${b.titulo} `),
      h(doc, 'span', { class: `estado-adr estado-adr--${b.status.toLowerCase()}`, texto: b.status }),
    ]),
    campo('Contexto', b.contexto), campo('Decisão', b.decisao), campo('Alternativas', b.alternativas), campo('Consequências', b.consequencias),
  ]));
});

registrarBloco('glossario', (casca, b, { doc }) => {
  const itens = b.itens.flatMap((item) => [
    h(doc, 'dt', { class: 'glossario__termo' }, [textoRico(doc, item.termo)]),
    h(doc, 'dd', { class: 'glossario__definicao' }, [
      textoRico(doc, item.definicao),
      item.referencia ? h(doc, 'span', { class: 'glossario__referencia' }, [
        doc.createTextNode('Referência: '),
        h(doc, 'a', { href: item.referencia.url, target: '_blank', rel: 'noopener', texto: item.referencia.rotulo }),
      ]) : null,
    ]),
  ]);
  casca.append(h(doc, 'div', { class: 'glossario' }, [
    h(doc, 'h3', { class: 'glossario__titulo', texto: b.titulo ?? '📘 Conceitos usados nesta ODA' }),
    b.texto ? h(doc, 'p', { class: 'glossario__texto' }, [textoRico(doc, b.texto)]) : null,
    h(doc, 'dl', { class: 'glossario__lista' }, itens),
  ]));
});
