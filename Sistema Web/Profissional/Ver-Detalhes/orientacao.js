/* ============================================================
   orientacao.js — Orientação de Conduta do paciente (Ver-Detalhes)
   Junta a avaliação da profissional, os laudos enviados (lidos pela
   IA) e o histórico, cruzados com os datasets do Auxiliar de Casos.
   API: GET/POST /api/copiloto/pacientes/:id/plano
   ============================================================ */

(function () {
  const card = document.getElementById('orientacao-card');
  if (!card) return;

  const pacienteId = localStorage.getItem('pacienteId');
  const txtAnotacoes = document.getElementById('orientacao-anotacoes');
  const laudosEl = document.getElementById('orientacao-laudos');
  const resultadoEl = document.getElementById('orientacao-resultado');
  const metaEl = document.getElementById('orientacao-meta');
  const btn = document.getElementById('btn-gerar-orientacao');
  const btnTxt = document.getElementById('btn-gerar-orientacao-txt');

  const ICONE_PROC = { INDICADO: '✅', CAUTELA: '⚠️', CONTRAINDICADO: '⛔' };
  const ROTULO_PROC = { INDICADO: 'Compatíveis', CAUTELA: 'Com cautela', CONTRAINDICADO: 'Evitar' };

  function el(tag, cls, texto) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  // Markdown mínimo e seguro (sem innerHTML): parágrafos, listas e **negrito**.
  function inline(texto) {
    const frag = document.createDocumentFragment();
    texto.split(/(\*\*[^*]+\*\*)/g).forEach((p) => {
      if (/^\*\*[^*]+\*\*$/.test(p)) frag.append(el('b', null, p.slice(2, -2)));
      else if (p) frag.append(p.replace(/^\*(.*)\*$/, '$1'));
    });
    return frag;
  }

  function textoFormatado(texto) {
    const nos = [];
    let lista = null;
    for (const bruta of texto.split(/\r?\n/)) {
      const linha = bruta.trim();
      if (!linha) { lista = null; continue; }
      const item = linha.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (item) {
        if (!lista) { lista = el('ul', 'orient-lista'); nos.push(lista); }
        const li = el('li'); li.append(inline(item[1])); lista.append(li);
      } else {
        lista = null;
        const p = el('p'); p.append(inline(linha.replace(/^#+\s*/, ''))); nos.push(p);
      }
    }
    return nos;
  }

  function formatarDataHora(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function renderizarLaudos(laudos, iaHabilitada) {
    laudosEl.replaceChildren();
    if (!laudos.length) {
      laudosEl.append(el('span', 'orient-laudo vazio', '📄 Nenhum laudo enviado — envie em "Laudos e Documentos" para ele entrar na orientação.'));
      return;
    }
    for (const l of laudos) {
      const status = l.lido ? 'lido ✅' : l.erro ? 'não foi possível ler' : iaHabilitada ? 'será lido ao gerar' : 'leitura indisponível';
      const chip = el('span', `orient-laudo${l.lido ? ' lido' : l.erro ? ' erro' : ''}`, `📄 ${l.nomeArquivo} · ${status}`);
      chip.title = l.resumo || l.erro || '';
      laudosEl.append(chip);
    }
  }

  function renderizarPlano(plano) {
    resultadoEl.replaceChildren();
    if (!plano || !plano.analise) {
      resultadoEl.append(el('p', 'orient-vazio', 'Ainda não há orientação para este paciente. Preencha sua avaliação e clique em "Gerar orientação".'));
      return;
    }
    const a = plano.analise;

    // 1. Alertas
    for (const al of a.triagem.alertas) {
      const box = el('div', `orient-alerta sev-${al.severidade.toLowerCase()}`);
      box.append(el('strong', null, `${al.severidade === 'CRITICA' ? '🔴' : '🟡'} ${al.descricao}`), el('p', null, `👉 ${al.conduta}`));
      resultadoEl.append(box);
    }

    // 2. Orientação da IA (conduta completa)
    if (plano.ia && plano.ia.resposta) {
      const ia = el('div', 'orient-ia');
      ia.append(el('span', 'orient-selo', '🤖 Orientação do Auxiliar de Casos'), ...textoFormatado(plano.ia.resposta));
      resultadoEl.append(ia);
    } else if (plano.ia && plano.ia.erro) {
      resultadoEl.append(el('p', 'orient-aviso', `IA indisponível no momento (${plano.ia.erro}). A orientação do dataset abaixo continua válida.`));
    }

    // 3. Como seguir (dataset + regras)
    if (a.proximosPassos.length) {
      const d = el('details', 'orient-bloco');
      d.open = !(plano.ia && plano.ia.resposta);
      d.append(el('summary', null, '👣 Como seguir (dataset)'));
      const ol = el('ol', 'orient-lista');
      a.proximosPassos.forEach((p) => ol.append(el('li', null, p)));
      d.append(ol);
      resultadoEl.append(d);
    }

    // 4. Procedimentos agrupados por status
    const grupos = { INDICADO: [], CAUTELA: [], CONTRAINDICADO: [] };
    a.procedimentos.filter((p) => p.id !== 'P001').forEach((p) => grupos[p.status].push(p));
    if (a.procedimentos.length > 1) {
      const d = el('details', 'orient-bloco');
      d.open = true;
      d.append(el('summary', null, '📋 Procedimentos do catálogo'));
      for (const st of ['CONTRAINDICADO', 'CAUTELA', 'INDICADO']) {
        if (!grupos[st].length) continue;
        const linha = el('div', 'orient-proc-linha');
        linha.append(el('span', 'orient-proc-rotulo', `${ICONE_PROC[st]} ${ROTULO_PROC[st]}:`));
        grupos[st].forEach((p) => {
          const chip = el('span', `orient-proc st-${st.toLowerCase()}`, `${p.nome} (${p.id})`);
          if (p.motivos.length) chip.title = p.motivos.join('\n');
          linha.append(chip);
        });
        d.append(linha);
      }
      resultadoEl.append(d);
    }

    // 5. Condições reconhecidas
    const nomes = [...a.condicoesClinicas.map((c) => `${c.nome} (CID ${c.cid10})`), ...a.quadros.map((q) => q.nome)];
    if (nomes.length) resultadoEl.append(el('p', 'orient-condicoes', `📚 Reconhecido: ${[...new Set(nomes)].join(' · ')}`));
  }

  function atualizarMeta(plano) {
    metaEl.textContent = plano && plano.gerado_em
      ? `Gerada em ${formatarDataHora(plano.gerado_em)}${plano.laudos_considerados ? ` · ${plano.laudos_considerados} laudo(s) considerado(s)` : ''}`
      : 'Auxiliar de Casos';
    btnTxt.textContent = plano && plano.gerado_em ? 'Atualizar orientação' : 'Gerar orientação';
  }

  function aplicar(dados) {
    if (!dados) return;
    const plano = dados.plano;
    if (plano && plano.anotacoes_profissional && !txtAnotacoes.value) txtAnotacoes.value = plano.anotacoes_profissional;
    renderizarLaudos(dados.laudos || [], dados.iaHabilitada);
    renderizarPlano(plano);
    atualizarMeta(plano);
  }

  async function carregar() {
    if (!pacienteId) return;
    try {
      aplicar(await obterOrientacaoPaciente(pacienteId));
    } catch (err) {
      resultadoEl.replaceChildren(el('p', 'orient-aviso', `Não foi possível carregar a orientação: ${err.message}`));
    }
  }

  async function gerar() {
    if (!pacienteId || btn.disabled) return;
    btn.disabled = true;
    const textoOriginal = btnTxt.textContent;
    btnTxt.textContent = 'Gerando… (lendo laudos e histórico)';
    resultadoEl.classList.add('carregando');
    try {
      const dados = await gerarOrientacaoPaciente(pacienteId, txtAnotacoes.value);
      aplicar(dados);
      showNotification('Orientação atualizada.');
    } catch (err) {
      btnTxt.textContent = textoOriginal;
      showNotification(err.message || 'Falha ao gerar orientação.', 'error');
    } finally {
      btn.disabled = false;
      resultadoEl.classList.remove('carregando');
    }
  }

  btn.addEventListener('click', gerar);

  // Laudo enviado ou excluído na seção de documentos → atualiza a lista de laudos da orientação.
  const inputLaudo = document.getElementById('input-laudo-upload');
  if (inputLaudo) inputLaudo.addEventListener('change', () => setTimeout(carregar, 2500));
  document.getElementById('laudos-container')?.addEventListener('click', () => setTimeout(carregar, 2500));

  carregar();
})();
