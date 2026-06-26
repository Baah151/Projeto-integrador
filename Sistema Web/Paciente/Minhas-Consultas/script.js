let consultasPaciente = [];
let sessoesPaciente = [];
let consultaPendenteSelecionada = null;

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

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const p = String(dataISO).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatarHorario(h) {
  return h ? String(h).substring(0, 5) : '';
}

function statusLabel(status) {
  const map = {
    'Agendado':  'Aguardando aprovação',
    'Pendente':  'Aguardando ajuste',
    'Confirmado': 'Confirmado',
    'Finalizado': 'Finalizado',
    'Cancelado':  'Cancelado',
  };
  return map[status] || status;
}

function statusClass(status) {
  const map = {
    'Agendado':  'aguardando',
    'Pendente':  'pendente-ajuste',
    'Confirmado': 'confirmado',
    'Finalizado': 'finalizado',
    'Cancelado':  'cancelado',
  };
  return map[status] || '';
}

function getSessaoDaConsulta(agendamentoId) {
  return sessoesPaciente.find(s => s.id_agendamento == agendamentoId) || null;
}

function abrirModalPendente(consulta) {
  consultaPendenteSelecionada = consulta;
  const modal = document.getElementById('modal-pendente');
  const motivoEl = document.getElementById('pendente-motivo-texto');
  const dataEl = document.getElementById('pendente-data-info');
  const obsInput = document.getElementById('pendente-obs-input');
  const fileInput = document.getElementById('pendente-file-input');
  const fileText = document.getElementById('pendente-file-text');
  const fileErro = document.getElementById('pendente-file-erro');

  if (motivoEl) motivoEl.textContent = consulta.motivo_pendencia || 'A profissional solicitou informações adicionais.';
  if (dataEl) dataEl.textContent = `Agendamento: ${formatarDataBR(consulta.data_consulta)} às ${formatarHorario(consulta.horario)}`;
  if (obsInput) obsInput.value = '';
  if (fileInput) fileInput.value = '';
  if (fileText) fileText.textContent = 'Clique para selecionar um arquivo';
  if (fileErro) fileErro.style.display = 'none';
  if (modal) modal.style.display = 'flex';
}

function fecharModalPendente() {
  const modal = document.getElementById('modal-pendente');
  if (modal) modal.style.display = 'none';
  consultaPendenteSelecionada = null;
}

function carregarNotificacoes() {
  const bellButton = document.getElementById('bell-button');
  const notiDropdown = document.getElementById('noti-dropdown');
  const dropdownBody = document.getElementById('dropdown-body');
  const notiBadge = document.getElementById('noti-badge');
  const menuBadge = document.getElementById('consultas-notif-badge');

  if (!bellButton || !notiDropdown || !dropdownBody) return;

  bellButton.addEventListener('click', function (e) {
    e.stopPropagation();
    notiDropdown.classList.toggle('show');
  });
  document.addEventListener('click', () => notiDropdown.classList.remove('show'));

  dropdownBody.innerHTML = '';
  let count = 0;

  consultasPaciente.forEach(c => {
    if (c.status === 'Agendado' || c.status === 'Confirmado' || c.status === 'Pendente') {
      count++;
      const item = document.createElement('div');
      item.classList.add('dropdown-item');
      if (c.status === 'Pendente') {
        item.innerHTML = `Seu agendamento para <strong>${formatarDataBR(c.data_consulta)}</strong> requer <strong>informações adicionais</strong>. Clique para responder.`;
        item.style.borderLeft = '3px solid #D97706';
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          notiDropdown.classList.remove('show');
          abrirModalPendente(c);
        });
      } else if (c.status === 'Agendado') {
        item.innerHTML = `Sua solicitação para <strong>${formatarDataBR(c.data_consulta)}</strong> às <strong>${formatarHorario(c.horario)}</strong> está <strong>aguardando aprovação</strong>.`;
      } else {
        item.innerHTML = `Seu agendamento para <strong>${formatarDataBR(c.data_consulta)}</strong> às <strong>${formatarHorario(c.horario)}</strong> foi <strong>confirmado!</strong>`;
      }
      dropdownBody.appendChild(item);
    }
  });

  if (count > 0) {
    if (notiBadge) { notiBadge.textContent = count; notiBadge.style.display = 'block'; }
    if (menuBadge) { menuBadge.textContent = count; menuBadge.style.display = 'flex'; }
  } else {
    if (notiBadge) notiBadge.style.display = 'none';
    if (menuBadge) menuBadge.style.display = 'none';
    dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center;color:#9ca3af;">Nenhuma notificação recente.</div>';
  }
}

function renderizarSessaoDetalhes(sessao) {
  if (!sessao) return '';
  const partes = [];

  if (sessao.prescricao_texto) {
    partes.push(`
      <div class="sessao-detalhe-bloco">
        <span class="sd-label">Prescrição / Orientações Clínicas</span>
        <p class="sd-texto">${sessao.prescricao_texto.replace(/\n/g, '<br>')}</p>
      </div>`);
  }
  if (sessao.medicamentos) {
    partes.push(`
      <div class="sessao-detalhe-bloco">
        <span class="sd-label">Medicamentos</span>
        <p class="sd-texto">${sessao.medicamentos.replace(/\n/g, '<br>')}</p>
      </div>`);
  }
  if (sessao.orientacoes_paciente) {
    partes.push(`
      <div class="sessao-detalhe-bloco">
        <span class="sd-label">Orientações para você</span>
        <p class="sd-texto">${sessao.orientacoes_paciente.replace(/\n/g, '<br>')}</p>
      </div>`);
  }
  if (sessao.proxima_sessao_data) {
    partes.push(`
      <div class="sessao-detalhe-bloco proxima-sessao-info">
        <span class="sd-label">Próxima Sessão Sugerida</span>
        <p class="sd-texto"><strong>${formatarDataBR(sessao.proxima_sessao_data)}</strong>${sessao.proxima_sessao_hora ? ` às ${formatarHorario(sessao.proxima_sessao_hora)}` : ''}</p>
      </div>`);
  }

  if (partes.length === 0) return '';
  return `<div class="sessao-detalhes-container">${partes.join('')}</div>`;
}

function carregarTelaConsultas() {
  const container = document.getElementById('appointments-container');
  if (!container) return;
  container.innerHTML = '';

  const ativos = consultasPaciente.filter(c => c.status !== 'Cancelado');

  if (ativos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h2>Nenhuma consulta encontrada</h2>
        <p>Você ainda não possui nenhum agendamento.</p>
        <a href="../agendamento/index.html" class="btn-empty">Agendar Agora</a>
      </div>`;
    return;
  }

  ativos.forEach(c => {
    const sessao = c.status === 'Finalizado' ? getSessaoDaConsulta(c.id_agendamento) : null;
    const detalhesHTML = renderizarSessaoDetalhes(sessao);
    const isPendente = c.status === 'Pendente';

    const row = document.createElement('div');
    row.classList.add('appointment-row');
    if (detalhesHTML) row.classList.add('com-sessao');
    if (isPendente) row.classList.add('row-pendente-ajuste');

    let pendenteBtn = '';
    if (isPendente) {
      pendenteBtn = `<button class="btn-ajuste-pendente">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">edit_note</span>
        Responder
      </button>`;
    }

    row.innerHTML = `
      <div class="row-main">
        <span>${formatarDataBR(c.data_consulta)}</span>
        <span>${formatarHorario(c.horario)}</span>
        <span style="font-weight:500;color:#1F2937;">${c.observacoes || '—'}</span>
        <div>—</div>
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;" title="${c.observacoes || ''}">${c.observacoes || 'Nenhuma'}</span>
        <span class="status-text ${statusClass(c.status)}">${statusLabel(c.status)}</span>
        ${sessao ? `<span style="font-size:0.72rem;color:#046C4E;font-weight:600;">Sessão #${sessao.numero_sessao || 1}</span>` : '<span></span>'}
      </div>
      ${isPendente ? `<div class="pendente-aviso">
        <span class="material-symbols-outlined" style="font-size:18px;flex-shrink:0;">warning</span>
        <span><strong>Ação necessária:</strong> ${c.motivo_pendencia || 'A profissional solicitou informações adicionais.'}</span>
        ${pendenteBtn}
      </div>` : ''}
      ${detalhesHTML}`;

    if (isPendente) {
      row.querySelector('.btn-ajuste-pendente')?.addEventListener('click', () => abrirModalPendente(c));
    }

    container.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacaoPaciente()) return;
  gerenciarMenuMobile();

  try {
    [consultasPaciente, sessoesPaciente] = await Promise.all([
      listarAgendamentosPaciente().catch(() => []),
      listarSessoesPaciente().catch(() => []),
    ]);
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar consultas.', 'error');
    consultasPaciente = [];
    sessoesPaciente = [];
  }

  carregarTelaConsultas();
  carregarNotificacoes();

  // Modal de pendente
  document.getElementById('close-modal-pendente')?.addEventListener('click', fecharModalPendente);
  document.getElementById('btn-fechar-pendente')?.addEventListener('click', fecharModalPendente);

  document.getElementById('modal-pendente')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-pendente')) fecharModalPendente();
  });

  // Atualizar label do arquivo quando paciente selecionar
  document.getElementById('pendente-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const fileText = document.getElementById('pendente-file-text');
    const fileErro = document.getElementById('pendente-file-erro');
    if (!file) {
      if (fileText) fileText.textContent = 'Clique para selecionar um arquivo';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = '';
      if (fileText) fileText.textContent = 'Clique para selecionar um arquivo';
      if (fileErro) fileErro.style.display = 'block';
      return;
    }
    if (fileErro) fileErro.style.display = 'none';
    if (fileText) fileText.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
  });

  document.getElementById('btn-reenviar-solicitacao')?.addEventListener('click', async () => {
    if (!consultaPendenteSelecionada) return;
    const obs = document.getElementById('pendente-obs-input')?.value?.trim();
    if (!obs) { showNotification('Escreva sua resposta antes de reenviar.', 'error'); return; }

    const btn = document.getElementById('btn-reenviar-solicitacao');
    const fileInput = document.getElementById('pendente-file-input');
    const arquivo = fileInput?.files?.[0] || null;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">sync</span> Enviando...';

    try {
      await reenviarSolicitacaoPaciente(consultaPendenteSelecionada.id_agendamento, obs);

      if (arquivo) {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const base64 = ev.target.result.split(',')[1];
              await uploadDocumentoPaciente({
                id_agendamento: consultaPendenteSelecionada.id_agendamento,
                nome_arquivo: arquivo.name,
                tipo_arquivo: arquivo.type || 'application/octet-stream',
                tamanho_bytes: arquivo.size,
                conteudo_base64: base64,
              });
              resolve();
            } catch (err) { reject(err); }
          };
          reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
          reader.readAsDataURL(arquivo);
        });
      }

      // Atualiza localmente
      const idx = consultasPaciente.findIndex(c => c.id_agendamento === consultaPendenteSelecionada.id_agendamento);
      if (idx >= 0) {
        consultasPaciente[idx].status = 'Agendado';
        consultasPaciente[idx].motivo_pendencia = null;
        consultasPaciente[idx].observacoes = obs;
      }

      fecharModalPendente();
      carregarTelaConsultas();
      carregarNotificacoes();
      showNotification(arquivo ? 'Solicitação e documento reenviados com sucesso!' : 'Solicitação reenviada! Aguarde a confirmação da profissional.');
    } catch (err) {
      showNotification(err.message || 'Erro ao reenviar.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">send</span> Reenviar Solicitação';
    }
  });
});
