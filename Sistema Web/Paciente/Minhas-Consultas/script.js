let consultasPaciente = [];
let sessoesPaciente = [];
let consultaPendenteSelecionada = null;
let filtroMesAno = '';

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

function chipBorderClass(status) {
  const map = {
    'Agendado':   'chip-aguardando',
    'Pendente':   'chip-pendente-ajuste',
    'Confirmado': 'chip-confirmado',
    'Finalizado': 'chip-finalizado',
    'Cancelado':  'chip-cancelado',
  };
  return map[status] || '';
}

function badgeClass(status) {
  const map = {
    'Agendado':   'badge-aguardando',
    'Pendente':   'badge-pendente-ajuste',
    'Confirmado': 'badge-confirmado',
    'Finalizado': 'badge-finalizado',
    'Cancelado':  'badge-cancelado',
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

function buildSessaoDetailsHTML(sessao) {
  const partes = [];
  if (sessao?.orientacoes_paciente) partes.push(`
    <div class="chip-detail-block">
      <span class="chip-detail-label">Orientações para você</span>
      <p class="chip-detail-text">${sessao.orientacoes_paciente.replace(/\n/g, '<br>')}</p>
    </div>`);
  if (sessao?.prescricao_texto) partes.push(`
    <div class="chip-detail-block">
      <span class="chip-detail-label">Prescrição</span>
      <p class="chip-detail-text">${sessao.prescricao_texto.replace(/\n/g, '<br>')}</p>
    </div>`);
  if (sessao?.medicamentos) partes.push(`
    <div class="chip-detail-block">
      <span class="chip-detail-label">Medicamentos / Suplementos</span>
      <p class="chip-detail-text">${sessao.medicamentos.replace(/\n/g, '<br>')}</p>
    </div>`);
  if (sessao?.proxima_sessao_data) partes.push(`
    <div class="chip-proxima">
      📅 Próxima sessão: <strong>${formatarDataBR(sessao.proxima_sessao_data)}</strong>${sessao.proxima_sessao_hora ? ` às ${formatarHorario(sessao.proxima_sessao_hora)}` : ''}
    </div>`);
  return partes.join('');
}

function carregarTelaConsultas() {
  const container = document.getElementById('appointments-container');
  if (!container) return;
  container.innerHTML = '';

  let ativos = consultasPaciente.filter(c => c.status !== 'Cancelado');

  if (filtroMesAno) {
    ativos = ativos.filter(c => String(c.data_consulta).substring(0, 7) === filtroMesAno);
  }

  const resultadoEl = document.getElementById('filtro-resultado');
  if (resultadoEl) {
    resultadoEl.textContent = filtroMesAno
      ? `${ativos.length} consulta${ativos.length !== 1 ? 's' : ''} encontrada${ativos.length !== 1 ? 's' : ''}`
      : '';
  }

  if (ativos.length === 0) {
    if (filtroMesAno) {
      const [ano, mes] = filtroMesAno.split('-');
      const nomeMes = new Date(Number(ano), Number(mes) - 1).toLocaleString('pt-BR', { month: 'long' });
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>Nenhuma consulta em ${nomeMes} de ${ano}</h2>
          <p>Tente selecionar outro mês ou limpe o filtro.</p>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h2>Nenhuma consulta encontrada</h2>
          <p>Você ainda não possui nenhum agendamento.</p>
          <a href="../agendamento/index.html" class="btn-empty">Agendar Agora</a>
        </div>`;
    }
    return;
  }

  ativos.forEach(c => {
    const sessao = c.status === 'Finalizado' ? getSessaoDaConsulta(c.id_agendamento) : null;
    const sessaoDetailsInner = sessao ? buildSessaoDetailsHTML(sessao) : '';
    const hasSessaoData = !!sessaoDetailsInner;
    const isPendente = c.status === 'Pendente';

    const chip = document.createElement('div');
    chip.classList.add('consulta-chip', chipBorderClass(c.status));

    const sessaoNumHTML = sessao
      ? `<span class="chip-sessao-num">Sessão #${sessao.numero_sessao || 1}</span>`
      : '';

    const obsHTML = c.observacoes
      ? `<p class="chip-obs-text">${c.observacoes}</p>`
      : '';

    const pendenteHTML = isPendente ? `
      <div class="chip-pendente-box">
        <strong>Ação necessária:</strong> ${c.motivo_pendencia || 'A profissional solicitou informações adicionais.'}
      </div>
      <button class="btn-chip-responder">
        <span class="material-symbols-outlined">edit_note</span> Responder
      </button>` : '';

    let expandHTML = '';
    if (c.status === 'Finalizado') {
      expandHTML = hasSessaoData
        ? `<button class="chip-expand-btn">
             <span class="material-symbols-outlined">expand_more</span>
             Ver informações clínicas
           </button>
           <div class="chip-details">${sessaoDetailsInner}</div>`
        : `<span class="chip-sem-dados">Nenhuma orientação registrada.</span>`;
    }

    chip.innerHTML = `
      <div class="chip-header">
        <span class="chip-date">${formatarDataBR(c.data_consulta)}</span>
        ${sessaoNumHTML}
      </div>
      <div class="chip-time">
        <span class="material-symbols-outlined">schedule</span>
        ${formatarHorario(c.horario)}
      </div>
      <span class="chip-status-badge ${badgeClass(c.status)}">${statusLabel(c.status)}</span>
      ${obsHTML}
      ${pendenteHTML}
      ${expandHTML}`;

    if (isPendente) {
      chip.querySelector('.btn-chip-responder')?.addEventListener('click', () => abrirModalPendente(c));
    }

    if (hasSessaoData) {
      const expandBtn = chip.querySelector('.chip-expand-btn');
      const details = chip.querySelector('.chip-details');
      expandBtn?.addEventListener('click', () => {
        const aberto = details.classList.toggle('expanded');
        expandBtn.innerHTML = aberto
          ? '<span class="material-symbols-outlined">expand_less</span> Ocultar informações'
          : '<span class="material-symbols-outlined">expand_more</span> Ver informações clínicas';
      });
    }

    container.appendChild(chip);
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

  // Filtro por mês/ano
  const filtroInput = document.getElementById('filtro-mes-ano');
  const btnLimpar = document.getElementById('btn-limpar-filtro');

  filtroInput?.addEventListener('change', () => {
    filtroMesAno = filtroInput.value;
    if (btnLimpar) btnLimpar.style.display = filtroMesAno ? 'flex' : 'none';
    carregarTelaConsultas();
  });

  btnLimpar?.addEventListener('click', () => {
    filtroMesAno = '';
    if (filtroInput) filtroInput.value = '';
    btnLimpar.style.display = 'none';
    carregarTelaConsultas();
  });

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
