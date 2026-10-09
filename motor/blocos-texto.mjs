import { registrarBloco, h, textoRico } from './nucleo.mjs';

const ICONES = { dica: '💡 Dica', erro: '⚠️ Erro comum', quebra: '⛔ Atenção', sucesso: '✅ Sucesso esperado' };

registrarBloco('legenda', (casca, b, { doc }) => {
  casca.append(h(doc, 'p', { class: 'legenda' }, [textoRico(doc, b.texto)]));
});

registrarBloco('faixa', (casca, b, { doc }) => {
  const titulo = h(doc, 'strong', { class: 'faixa__titulo', texto: b.titulo ?? ICONES[b.estilo] });
  const corpo = b.estilo === 'erro'
    ? h(doc, 'dl', { class: 'faixa__erro' }, [
      h(doc, 'dt', { texto: 'Sintoma' }), h(doc, 'dd', {}, [textoRico(doc, b.sintoma)]),
      h(doc, 'dt', { texto: 'Causa' }), h(doc, 'dd', {}, [textoRico(doc, b.causa)]),
      h(doc, 'dt', { texto: 'Correção' }), h(doc, 'dd', {}, [textoRico(doc, b.correcao)])])
    : h(doc, 'span', {}, [textoRico(doc, b.texto)]);
  casca.append(h(doc, 'div', { class: `faixa faixa--${b.estilo}` }, [titulo, doc.createTextNode(' '), corpo]));
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
