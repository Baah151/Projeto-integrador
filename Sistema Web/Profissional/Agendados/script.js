function gerenciarMenuMobile() {
  const openBtn = document.getElementById('open-menu-btn');
  const closeBtn = document.getElementById('close-menu-btn');
  const sidebar = document.getElementById('mobile-sidebar');
  const backdrop = document.getElementById('menu-backdrop');
  if (!openBtn || !sidebar || !backdrop) return;
  openBtn.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('active'); });
  const fechar = () => { sidebar.classList.remove('open'); backdrop.classList.remove('active'); };
  if (closeBtn) closeBtn.addEventListener('click', fechar);
  backdrop.addEventListener('click', fechar);
}

let agendamentosLista = [];
let agendamentoSelecionado = null;

function formatarDataBR(dataString) {
  if (!dataString) return '--/--/----';
  const p = String(dataString).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function renderizarTabela(lista) {
  const wrapper = document.getElementById('appointments-table-wrapper');
  const empty = document.getElementById('appointments-empty');
  const tbody = document.getElementById('appointments-rows');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!lista || lista.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }

  if (wrapper) wrapper.style.display = 'block';
  if (empty) empty.style.display = 'none';

  lista.forEach(a => {
    const temDoc = Number(a.num_documentos) > 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${a.nome_paciente || '--'}</strong>
        ${temDoc ? `<span class="badge-doc-novo" title="Novo documento encaminhado">
          <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle;">attach_file</span>
          Novo doc.
        </span>` : ''}
      </td>
      <td>${formatarDataBR(a.data_consulta)}</td>
      <td>${a.horario ? a.horario.substring(0,5) : '--'}</td>
      <td>Consulta</td>
      <td style="text-align:right;padding-right:25px;">
        <button class="btn-gerenciar" data-id="${a.id_agendamento}">Gerenciar</button>
      </td>
    `;
    tr.querySelector('.btn-gerenciar').addEventListener('click', () => abrirModalGerenciar(a));
    tbody.appendChild(tr);
  });
}

function formatarBytes(bytes) {
  if (!bytes) return '';
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

async function downloadDocumento(docMeta) {
  try {
    const doc = await apiRequest('GET', `/documentos/${docMeta.id_documento}/download`);
    if (!doc || !doc.conteudo_base64) { showNotification('Arquivo sem conteúdo.', 'error'); return; }
    const link = document.createElement('a');
    link.href = `data:${doc.tipo_arquivo || 'application/octet-stream'};base64,${doc.conteudo_base64}`;
    link.download = doc.nome_arquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    showNotification('Erro ao baixar arquivo.', 'error');
  }
}

async function carregarDocsAgendamento(agendamentoId, pacienteId) {
  const container = document.getElementById('docs-agendamento-lista');
  if (!container) return;
  container.innerHTML = '<small style="color:#9CA3AF;">Carregando...</small>';
  try {
    const docs = await apiRequest('GET', `/documentos/agendamento/${agendamentoId}?pacienteId=${pacienteId}`) || [];
    if (docs.length === 0) {
      container.innerHTML = '<small style="color:#9CA3AF;">Nenhum documento enviado pelo paciente.</small>';
      return;
    }
    container.innerHTML = '';
    docs.forEach(d => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6;';
      item.innerHTML = `
        <span style="font-size:0.82rem;color:#374151;">📎 <strong>${d.nome_arquivo}</strong> <small style="color:#9CA3AF;">${formatarBytes(d.tamanho_bytes)}</small></span>
        <button style="background:#10B981;color:white;border:none;padding:4px 12px;border-radius:8px;font-size:0.75rem;cursor:pointer;font-weight:600;">Download</button>
      `;
      item.querySelector('button').addEventListener('click', () => downloadDocumento(d));
      container.appendChild(item);
    });
  } catch {
    container.innerHTML = '<small style="color:#ef4444;">Erro ao carregar documentos.</small>';
  }
}

function abrirModalGerenciar(agendamento) {
  agendamentoSelecionado = agendamento;
  const info = document.getElementById('modificar-info-paciente');
  if (info) info.textContent = `${agendamento.nome_paciente || '--'} — ${formatarDataBR(agendamento.data_consulta)} às ${agendamento.horario ? agendamento.horario.substring(0,5) : '--'}`;

  const obsContainer = document.getElementById('obs-paciente-container');
  const obsTexto = document.getElementById('obs-paciente-texto');
  if (agendamento.observacoes) {
    if (obsContainer) obsContainer.style.display = 'block';
    if (obsTexto) obsTexto.textContent = agendamento.observacoes;
  } else {
    if (obsContainer) obsContainer.style.display = 'none';
  }

  if (agendamento.id_agendamento && agendamento.id_paciente) {
    carregarDocsAgendamento(agendamento.id_agendamento, agendamento.id_paciente);
  }

  document.getElementById('modal-modificar').classList.add('active');
}

async function carregarAgendamentos() {
  try {
    agendamentosLista = await listarAgendamentos({ status: 'Confirmado' });
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar agendamentos.', 'error');
    agendamentosLista = [];
  }
}

// ── Utilitários de período ────────────────────────────────────────
function toISO(d) { return d.toISOString().substring(0, 10); }

function calcularPeriodo(periodo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (periodo === 'hoje') {
    return { inicio: toISO(hoje), fim: toISO(hoje) };
  }
  if (periodo === 'semana') {
    const dom = new Date(hoje);
    dom.setDate(hoje.getDate() - hoje.getDay());
    const sab = new Date(dom);
    sab.setDate(dom.getDate() + 6);
    return { inicio: toISO(dom), fim: toISO(sab) };
  }
  if (periodo === 'mes') {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return { inicio: toISO(ini), fim: toISO(fim) };
  }
  if (periodo === 'trimestre') {
    const mesAtual = hoje.getMonth(); // 0–11
    const inicioTrimestre = Math.floor(mesAtual / 3) * 3; // 0, 3, 6 ou 9
    const ini = new Date(hoje.getFullYear(), inicioTrimestre, 1);
    const fim = new Date(hoje.getFullYear(), inicioTrimestre + 3, 0); // dia 0 do mês seguinte = último dia do trimestre
    return { inicio: toISO(ini), fim: toISO(fim) };
  }
  if (periodo === 'ano') {
    const ini = new Date(hoje.getFullYear(), 0, 1);
    const fim = new Date(hoje.getFullYear(), 11, 31);
    return { inicio: toISO(ini), fim: toISO(fim) };
  }
  return { inicio: null, fim: null };
}

function aplicarFiltroRange(inicio, fim) {
  const filtered = agendamentosLista.filter(a => {
    const data = a.data_consulta ? String(a.data_consulta).substring(0, 10) : null;
    if (!data) return false;
    if (inicio && data < inicio) return false;
    if (fim && data > fim) return false;
    return true;
  });

  renderizarTabela(filtered);

  // Atualizar contador
  const countTexto = document.getElementById('filtro-count-texto');
  if (countTexto) {
    countTexto.textContent = `${filtered.length} consulta${filtered.length !== 1 ? 's' : ''} em aberto`;
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;
  gerenciarMenuMobile();

  const dropdownBody = document.getElementById('dropdown-body');
  if (dropdownBody) dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center;color:#9ca3af;">Nenhuma notificação.</div>';

  const bell = document.getElementById('bell-button');
  const notiDropdown = document.getElementById('noti-dropdown');
  if (bell && notiDropdown) {
    bell.addEventListener('click', (e) => { e.stopPropagation(); notiDropdown.classList.toggle('show'); });
    document.addEventListener('click', () => notiDropdown.classList.remove('show'));
  }

  const inputInicio = document.getElementById('filter-inicio');
  const inputFim = document.getElementById('filter-fim');

  // Pills rápidos
  document.querySelectorAll('.filtro-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filtro-pill').forEach(p => p.classList.remove('filtro-pill-ativo'));
      pill.classList.add('filtro-pill-ativo');

      const { inicio, fim } = calcularPeriodo(pill.dataset.periodo);
      if (inputInicio) inputInicio.value = inicio || '';
      if (inputFim) inputFim.value = fim || '';
      aplicarFiltroRange(inicio, fim);
    });
  });

  // Inputs manuais desativam pills
  function onRangeManual() {
    document.querySelectorAll('.filtro-pill').forEach(p => p.classList.remove('filtro-pill-ativo'));
    aplicarFiltroRange(inputInicio?.value || null, inputFim?.value || null);
  }
  inputInicio?.addEventListener('change', onRangeManual);
  inputFim?.addEventListener('change', onRangeManual);

  await carregarAgendamentos();

  // Aplicar "Este mês" como padrão ao carregar
  const periodoInicial = calcularPeriodo('mes');
  if (inputInicio) inputInicio.value = periodoInicial.inicio;
  if (inputFim) inputFim.value = periodoInicial.fim;
  aplicarFiltroRange(periodoInicial.inicio, periodoInicial.fim);

  // Modal principal
  const modalModificar = document.getElementById('modal-modificar');
  document.getElementById('close-modal-modificar')?.addEventListener('click', () => modalModificar.classList.remove('active'));

  // --- FINALIZAR → navega para página Registrar-Sessao ---
  document.getElementById('btn-trigger-finalizar')?.addEventListener('click', () => {
    if (!agendamentoSelecionado) return;
    localStorage.setItem('sessao_agendamento', JSON.stringify(agendamentoSelecionado));
    window.location.href = '../Registrar-Sessao/index.html';
  });

  // --- CANCELAR ---
  const modalCancelar = document.getElementById('modal-sub-cancelar');
  document.getElementById('btn-trigger-cancelar')?.addEventListener('click', () => {
    modalModificar.classList.remove('active');
    document.getElementById('cancelar-motivo').value = '';
    modalCancelar.classList.add('active');
  });
  document.getElementById('btn-voltar-cancelar')?.addEventListener('click', () => { modalCancelar.classList.remove('active'); modalModificar.classList.add('active'); });

  document.getElementById('btn-concluir-cancelar-agenda')?.addEventListener('click', async () => {
    if (!agendamentoSelecionado) return;
    const btn = document.getElementById('btn-concluir-cancelar-agenda');
    btn.disabled = true;
    try {
      await cancelarAgendamento(agendamentoSelecionado.id_agendamento);
      showNotification('Agendamento cancelado.');
      modalCancelar.classList.remove('active');
      agendamentosLista = agendamentosLista.filter(a => a.id_agendamento !== agendamentoSelecionado.id_agendamento);
      renderizarTabela(agendamentosLista);
    } catch (err) {
      showNotification(err.message || 'Erro ao cancelar.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
});
