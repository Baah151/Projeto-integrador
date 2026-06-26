function formatarDataBR(dataISO) {
  if (!dataISO) return '--/--/----';
  const p = String(dataISO).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function adicionarDias(dataISO, dias) {
  const d = new Date(dataISO + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().substring(0, 10);
}

let agendamento = null;

function carregarInfoPaciente() {
  try {
    agendamento = JSON.parse(localStorage.getItem('sessao_agendamento') || 'null');
  } catch { /* ignore */ }

  if (!agendamento) {
    showNotification('Dados do agendamento não encontrados. Voltando...', 'error');
    setTimeout(() => { window.location.href = '../agendados/index.html'; }, 1500);
    return false;
  }

  const nome = agendamento.nome_paciente || '—';
  const data = formatarDataBR(agendamento.data_consulta);
  const hora = agendamento.horario ? String(agendamento.horario).substring(0, 5) : '—';

  document.getElementById('info-nome').textContent = nome;
  document.getElementById('info-meta').textContent = `${data} às ${hora}`;
  return true;
}

async function carregarNumeroSessao() {
  try {
    const sessoes = await listarSessoesPaciente(agendamento.id_paciente);
    const num = (Array.isArray(sessoes) ? sessoes.length : 0) + 1;
    document.getElementById('info-sessao-num').textContent = `Sessão #${num}`;
  } catch {
    document.getElementById('info-sessao-num').textContent = 'Sessão #—';
  }
}

function atualizarPreview() {
  const data = document.getElementById('reagendar_data')?.value;
  const hora = document.getElementById('reagendar_hora')?.value;
  const preview = document.getElementById('reagendar-preview');
  const previewTexto = document.getElementById('reagendar-preview-texto');

  if (data && hora && preview && previewTexto) {
    previewTexto.textContent = `Próxima sessão: ${formatarDataBR(data)} às ${hora.substring(0, 5)}`;
    preview.style.display = 'flex';
  } else if (preview) {
    preview.style.display = 'none';
  }
}

async function carregarSlots(data) {
  const container = document.getElementById('reagendar-slots-container');
  const horaInput = document.getElementById('reagendar_hora');
  if (!container || !horaInput) return;

  horaInput.value = '';
  atualizarPreview();

  container.innerHTML = '<span class="slots-loading"><span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">sync</span> Carregando...</span>';

  try {
    const slots = await getSlotsReagendar(data);

    if (!slots || slots.length === 0) {
      container.innerHTML = `
        <p class="slots-hint" style="text-align:left;">
          Nenhum horário configurado para este dia.<br>
          <small>Configure na <a href="../gerenciamento-agenda/index.html" style="color:#046C4E;">Agenda</a> ou use a seta abaixo.</small>
        </p>`;
      return;
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'slots-grid';

    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `slot-pill ${slot.ocupado ? 'slot-ocupado' : 'slot-livre'}`;
      btn.textContent = slot.horario;
      btn.disabled = slot.ocupado;
      btn.title = slot.ocupado ? 'Horário ocupado' : `Disponível`;

      if (!slot.ocupado) {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.slot-pill').forEach(b => b.classList.remove('slot-selecionado'));
          btn.classList.add('slot-selecionado');
          horaInput.value = slot.horario;
          atualizarPreview();
        });
      }
      grid.appendChild(btn);
    });

    container.appendChild(grid);
  } catch (err) {
    container.innerHTML = '<p class="slots-erro">Erro ao carregar horários.</p>';
  }
}

async function ativarProximaSemana() {
  const dataBase = agendamento?.data_consulta?.substring(0, 10);
  const horaBase = agendamento?.horario ? String(agendamento.horario).substring(0, 5) : null;
  if (!dataBase || !horaBase) {
    showNotification('Dados da sessão atual não encontrados.', 'error');
    return;
  }

  const proxData = adicionarDias(dataBase, 7);
  const dataInput = document.getElementById('reagendar_data');
  const horaInput = document.getElementById('reagendar_hora');

  dataInput.value = proxData;
  await carregarSlots(proxData);

  // Auto-selecionar o mesmo horário se disponível
  await new Promise(r => setTimeout(r, 100));
  const container = document.getElementById('reagendar-slots-container');
  const btnHora = Array.from(container?.querySelectorAll('.slot-livre') || [])
    .find(b => b.textContent.trim() === horaBase);

  if (btnHora) {
    btnHora.click();
  } else {
    // Se o horário não estiver na lista, preenche hidden direto
    horaInput.value = horaBase;
    atualizarPreview();
    showNotification(`Horário ${horaBase} não encontrado na agenda de ${formatarDataBR(proxData)}. Será agendado assim mesmo.`, 'warning');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;
  if (!carregarInfoPaciente()) return;

  await carregarNumeroSessao();

  // ── Toggle reagendamento ──────────────────────────────────
  const toggleReagendar = document.getElementById('reagendar-toggle');
  const painel = document.getElementById('reagendar-panel');

  // Se veio do botão Reagendar em Agendados, pré-ativa o toggle
  const modoReagendar = localStorage.getItem('sessao_modo');
  if (modoReagendar === 'reagendar' && toggleReagendar && painel) {
    localStorage.removeItem('sessao_modo');
    toggleReagendar.checked = true;
    painel.style.display = 'block';
  }

  toggleReagendar?.addEventListener('change', () => {
    if (!painel) return;
    painel.style.display = toggleReagendar.checked ? 'block' : 'none';
    if (!toggleReagendar.checked) {
      document.getElementById('reagendar_data').value = '';
      document.getElementById('reagendar_hora').value = '';
      const container = document.getElementById('reagendar-slots-container');
      if (container) container.innerHTML = '<p class="slots-hint">Selecione uma data</p>';
      const preview = document.getElementById('reagendar-preview');
      if (preview) preview.style.display = 'none';
    }
  });

  // ── Carregar slots ao mudar data ──────────────────────────
  document.getElementById('reagendar_data')?.addEventListener('change', (e) => {
    const data = e.target.value;
    if (data) carregarSlots(data);
  });

  // ── Próxima semana ────────────────────────────────────────
  document.getElementById('btn-proxima-semana')?.addEventListener('click', ativarProximaSemana);

  // ── Navegação ─────────────────────────────────────────────
  document.getElementById('btn-voltar')?.addEventListener('click', () => {
    window.location.href = '../agendados/index.html';
  });

  document.getElementById('btn-cancelar-form')?.addEventListener('click', () => {
    if (confirm('Cancelar registro? As informações não serão salvas.')) {
      window.location.href = '../agendados/index.html';
    }
  });

  // ── Submit ────────────────────────────────────────────────
  document.getElementById('form-sessao')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const valor = parseFloat(document.getElementById('valor_sessao').value);
    if (!valor || valor <= 0) {
      showNotification('Informe o valor da sessão.', 'error');
      return;
    }

    const reagendarAtivo = toggleReagendar?.checked || false;
    const reagendarData = document.getElementById('reagendar_data')?.value || null;
    const reagendarHora = document.getElementById('reagendar_hora')?.value || null;

    if (reagendarAtivo && (!reagendarData || !reagendarHora)) {
      showNotification('Selecione a data e o horário para reagendar.', 'error');
      return;
    }

    const statusSelecionado = document.querySelector('input[name="pagamento_status"]:checked')?.value || 'pendente';
    const pago_na_sessao = statusSelecionado === 'pago';
    const pago_apos_sessao = statusSelecionado === 'apos';
    const status_pagamento = pago_na_sessao ? 'Pago' : 'Pendente';

    const payload = {
      id_agendamento: agendamento.id_agendamento,
      id_paciente: agendamento.id_paciente,
      data_sessao: agendamento.data_consulta?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      hora_sessao: agendamento.horario || null,
      descricao_realizada: document.getElementById('descricao_realizada').value.trim() || null,
      observacoes_internas: document.getElementById('observacoes_internas').value.trim() || null,
      prescricao_texto: document.getElementById('prescricao_texto').value.trim() || null,
      medicamentos: document.getElementById('medicamentos').value.trim() || null,
      orientacoes_paciente: document.getElementById('orientacoes_paciente').value.trim() || null,
      proxima_sessao_data: reagendarData,
      proxima_sessao_hora: reagendarHora,
      valor_sessao: valor,
      forma_pagamento: document.getElementById('forma_pagamento').value || null,
      status_pagamento,
      pago_na_sessao,
      pago_apos_sessao,
    };

    const btn = document.getElementById('btn-salvar');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">sync</span> Salvando...';

    try {
      await criarSessao(payload);

      if (reagendarAtivo && reagendarData && reagendarHora) {
        try {
          await reagendarConsulta({
            id_paciente: agendamento.id_paciente,
            data_consulta: reagendarData,
            horario: reagendarHora,
            observacoes: `Reagendado após sessão de ${formatarDataBR(agendamento.data_consulta)}`,
            id_agendamento_original: agendamento.id_agendamento,
          });
        } catch (reagErr) {
          showNotification(`Sessão registrada, mas não foi possível reagendar: ${reagErr.message}`, 'warning');
          localStorage.removeItem('sessao_agendamento');
          setTimeout(() => { window.location.href = '../Financeiro/index.html'; }, 2500);
          return;
        }
      }

      localStorage.removeItem('sessao_agendamento');
      showNotification(reagendarAtivo ? 'Sessão registrada e próxima consulta agendada!' : 'Sessão registrada com sucesso!');
      setTimeout(() => { window.location.href = '../Financeiro/index.html'; }, 1200);
    } catch (err) {
      showNotification(err.message || 'Erro ao registrar sessão.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">save</span> Registrar Sessão';
    }
  });
});
