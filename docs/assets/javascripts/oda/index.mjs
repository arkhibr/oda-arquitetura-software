import { montarTodos } from './nucleo.mjs';
import './componentes/quiz.mjs';
import './componentes/classificador.mjs';
import './componentes/terminal.mjs';
import './componentes/passo-a-passo.mjs';
import './componentes/comparacao.mjs';
import './componentes/linha-do-tempo.mjs';
import './componentes/filtro-catalogo.mjs';
import { ativarObjetivos, criarArmazenamento } from './progresso.mjs';

const armazenamento = criarArmazenamento(() => window.localStorage);

function iniciar() {
  const ctx = { doc: document, armazenamento, caminho: window.location.pathname };
  ativarObjetivos(document, armazenamento, ctx.caminho);
  montarTodos(ctx);
}

if (window.document$ && typeof window.document$.subscribe === 'function') {
  window.document$.subscribe(iniciar);
} else if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
