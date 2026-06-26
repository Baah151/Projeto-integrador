let slotsDisponibilidade = [];
let horarioSelecionado = null;
let dataAtualSelecionada = null;

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

function formatarHorario(horarioRaw) {
  if (!horarioRaw) return '';
  return String(horarioRaw).substring(0, 5);
}

async function carregarDisponibilidade() {
  try {
    const slots = await obterDisponibilidade();
    slotsDisponibilidade = slots || [];
  } catch {
    slotsDisponibilidade = [];
  }
}

function carregarDatas() {
  const servicoElem = document.getElementById('servico');
  const dateSelect = document.getElementById('date-select');
  const timeSection = document.getElementById('time-section');
  if (!servicoElem || !dateSelect) return;

  dateSelect.innerHTML = '<option value="" disabled selected>Selecione uma data</option>';
  if (timeSection) timeSection.style.display = 'none';
  horarioSelecionado = null;
  dataAtualSelecionada = null;

  if (!servicoElem.value) return;

  const datasUnicas = [...new Set(slotsDisponibilidade.map(s => String(s.data_disponivel).substring(0, 10)))].sort();

  if (datasUnicas.length === 0) {
    dateSelect.disabled = true;
    dateSelect.innerHTML = '<option value="" disabled selected>Nenhuma data disponível</option>';
    return;
  }

  dateSelect.disabled = false;
  datasUnicas.forEach(data => {
    const slotsDoDia = slotsDisponibilidade.filter(s => String(s.data_disponivel).substring(0, 10) === data);
    const livres = slotsDoDia.filter(s => !s.ocupado).length;
    const option = document.createElement('option');
    option.value = data;
    option.textContent = `${formatarDataBR(data)} — ${livres} horário(s) livre(s)`;
    dateSelect.appendChild(option);
  });
}

function showTimes() {
  const dateSelect = document.getElementById('date-select');
  const timeSection = document.getElementById('time-section');
  const timeGrid = document.getElementById('time-grid');
  if (!dateSelect || !timeGrid) return;

  dataAtualSelecionada = dateSelect.value;
  timeGrid.innerHTML = '';
  horarioSelecionado = null;
  if (timeSection) timeSection.style.display = 'none';

  if (!dataAtualSelecionada) return;

  const slotsDoDia = slotsDisponibilidade
    .filter(s => String(s.data_disponivel).substring(0, 10) === dataAtualSelecionada)
    .sort((a, b) => String(a.horario).localeCompare(String(b.horario)));

  if (slotsDoDia.length === 0) {
    timeGrid.innerHTML = '<p style="color:#9CA3AF;font-size:0.85rem;">Nenhum horário disponível para esta data.</p>';
    if (timeSection) timeSection.style.display = 'block';
    return;
  }

  if (timeSection) timeSection.style.display = 'block';

  slotsDoDia.forEach(slot => {
    const hora = formatarHorario(slot.horario);
    const ocupado = slot.ocupado === true || slot.ocupado === 'true';
    const div = document.createElement('div');

    if (ocupado) {
      div.classList.add('time-slot', 'time-slot-ocupado');
      div.innerHTML = `<span class="slot-hora">${hora}</span><span class="slot-x">✕</span><span class="slot-label">Ocupado</span>`;
      div.title = 'Este horário já está reservado';
    } else {
      div.classList.add('time-slot');
      div.textContent = hora;
      div.addEventListener('click', () => {
        document.querySelectorAll('.time-slot:not(.time-slot-ocupado)').forEach(s => s.classList.remove('selected'));
        div.classList.add('selected');
        horarioSelecionado = hora;
      });
    }

    timeGrid.appendChild(div);
  });
}

function updateFileName() {
  const input = document.getElementById('exam-file');
  const text = document.getElementById('file-text');
  if (input && text && input.files.length > 0) {
    text.innerText = '✅ ' + input.files[0].name;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacaoPaciente()) return;
  gerenciarMenuMobile();

  await carregarDisponibilidade();

  const formSol = document.getElementById('form-solicitacao');
  if (formSol) {
    formSol.addEventListener('submit', async (e) => {
      e.preventDefault();

      const servico = document.getElementById('servico')?.value || '';
      const obs = document.getElementById('observacoes')?.value || '';

      if (!servico) { showNotification('Selecione o tipo de atendimento.', 'error'); return; }
      if (!dataAtualSelecionada) { showNotification('Selecione uma data disponível.', 'error'); return; }
      if (!horarioSelecionado) { showNotification('Selecione um horário disponível.', 'error'); return; }

      const btnSubmit = document.getElementById('btn-submit');
      if (btnSubmit) { btnSubmit.textContent = 'Enviando...'; btnSubmit.disabled = true; }

      const observacoesCompletas = `[Serviço: ${servico === 'fisioterapia' ? 'Fisioterapia' : 'Pilates'}]${obs ? ' ' + obs : ''}`;

      try {
        const agendamento = await criarAgendamentoPaciente({
          data_consulta: dataAtualSelecionada,
          horario: horarioSelecionado + ':00',
          observacoes: observacoesCompletas
        });

        // Upload do arquivo se houver
        const fileInput = document.getElementById('exam-file');
        const file = fileInput?.files?.[0];
        if (file && agendamento?.id_agendamento) {
          if (file.size > 5 * 1024 * 1024) {
            showNotification('Arquivo maior que 5MB não foi enviado. Agendamento realizado.', 'warning');
          } else {
            try {
              const reader = new FileReader();
              await new Promise((resolve, reject) => {
                reader.onload = async () => {
                  try {
                    const base64 = reader.result.split(',')[1];
                    await uploadDocumentoPaciente({
                      id_agendamento: agendamento.id_agendamento,
                      nome_arquivo: file.name,
                      tipo_arquivo: file.type || 'application/octet-stream',
                      tamanho_bytes: file.size,
                      conteudo_base64: base64
                    });
                    resolve();
                  } catch (err) { reject(err); }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            } catch {
              showNotification('Agendamento feito. Não foi possível enviar o arquivo.', 'warning');
            }
          }
        }

        const modal = document.getElementById('modal-sucesso');
        if (modal) modal.classList.add('active');
      } catch (err) {
        showNotification(err.message || 'Erro ao enviar solicitação.', 'error');
      } finally {
        if (btnSubmit) { btnSubmit.textContent = 'Solicitar Agendamento'; btnSubmit.disabled = false; }
      }
    });
  }
});
