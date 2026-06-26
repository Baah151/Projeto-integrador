const HORARIOS_PREDEFINIDOS = [
  '07:00','07:30','08:00','08:30','09:00','09:30',
  '10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30'
];

let horariosSelecionados = new Set();
let slotsPublicados = [];

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

function formatarDataBR(dataString) {
  if (!dataString) return '--/--/----';
  const p = String(dataString).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatarHorario(h) {
  return h ? String(h).substring(0, 5) : '';
}

function atualizarPreview() {
  const preview = document.getElementById('selected-preview');
  const count = document.getElementById('count-selected');
  if (!preview || !count) return;
  if (horariosSelecionados.size > 0) {
    preview.style.display = 'flex';
    count.textContent = horariosSelecionados.size;
  } else {
    preview.style.display = 'none';
  }
}

function construirGrade(dataSelecionada) {
  const grid = document.getElementById('time-slots-grid');
  const hint = document.getElementById('slots-hint');
  if (!grid) return;
  grid.innerHTML = '';
  horariosSelecionados.clear();
  atualizarPreview();

  if (!dataSelecionada) {
    if (hint) { hint.style.display = 'block'; hint.textContent = 'Selecione uma data para ver os horários.'; }
    return;
  }
  if (hint) hint.style.display = 'none';

  // Horários já publicados para essa data
  const jaPublicados = new Set(
    slotsPublicados
      .filter(s => String(s.data_disponivel).substring(0, 10) === dataSelecionada)
      .map(s => formatarHorario(s.horario))
  );

  HORARIOS_PREDEFINIDOS.forEach(hora => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot-btn';
    btn.textContent = hora;
    btn.dataset.hora = hora;

    if (jaPublicados.has(hora)) {
      btn.classList.add('ocupado');
      btn.title = 'Já publicado';
    } else {
      btn.addEventListener('click', () => {
        if (horariosSelecionados.has(hora)) {
          horariosSelecionados.delete(hora);
          btn.classList.remove('selected');
        } else {
          horariosSelecionados.add(hora);
          btn.classList.add('selected');
        }
        atualizarPreview();
      });
    }

    grid.appendChild(btn);
  });
}

async function carregarSlots() {
  const container = document.getElementById('agenda-publicada-container') || document.getElementById('published-slots-container');
  const emptyState = document.getElementById('slots-empty-state');

  try {
    slotsPublicados = await apiRequest('GET', '/agendamentos/disponibilidade') || [];
  } catch {
    slotsPublicados = [];
  }

  if (!container) return;
  container.innerHTML = '';

  if (slotsPublicados.length === 0) {
    container.innerHTML = `
      <div class="empty-list">
        <span class="material-symbols-outlined" style="font-size:2.5rem;color:#D1FAE5;margin-bottom:10px;display:block;">event_busy</span>
        <p>Nenhum horário publicado ainda.</p>
      </div>`;
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  // Agrupar por data
  const porData = {};
  slotsPublicados.forEach(s => {
    const data = String(s.data_disponivel).substring(0, 10);
    if (!porData[data]) porData[data] = [];
    porData[data].push(s);
  });

  Object.keys(porData).sort().forEach(data => {
    const slots = porData[data].sort((a, b) => String(a.horario).localeCompare(String(b.horario)));
    const total = slots.length;

    const block = document.createElement('div');
    block.className = 'published-day-block accordion-block';

    // Cabeçalho clicável (começa fechado)
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
      <div class="accordion-header-left">
        <span class="material-symbols-outlined accordion-date-icon">calendar_today</span>
        <span class="accordion-date-label">${formatarDataBR(data)}</span>
        <span class="accordion-count">${total} horário${total !== 1 ? 's' : ''}</span>
      </div>
      <span class="material-symbols-outlined accordion-chevron">chevron_right</span>
    `;

    // Corpo (oculto por padrão)
    const body = document.createElement('div');
    body.className = 'accordion-body';

    slots.forEach(s => {
      const item = document.createElement('div');
      item.className = 'published-item';
      item.innerHTML = `
        <span><strong>${formatarHorario(s.horario)}</strong> — ${s.vagas} vaga(s)</span>
        <button class="btn-remove-published btn-remover-slot" data-id="${s.id_disponibilidade}" title="Remover">×</button>
      `;
      item.querySelector('.btn-remover-slot').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await apiRequest('DELETE', `/agendamentos/disponibilidade/${s.id_disponibilidade}`);
          showNotification('Horário removido.');
          await carregarSlots();
          const dataInput = document.getElementById('data-disponivel');
          if (dataInput?.value) construirGrade(dataInput.value);
        } catch (err) {
          showNotification(err.message || 'Erro ao remover.', 'error');
        }
      });
      body.appendChild(item);
    });

    header.addEventListener('click', () => {
      const aberto = block.classList.contains('accordion-aberto');
      block.classList.toggle('accordion-aberto', !aberto);
    });

    block.appendChild(header);
    block.appendChild(body);
    container.appendChild(block);
  });
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

  await carregarSlots();

  // Reagir à mudança de data
  const dataInput = document.getElementById('data-disponivel');
  if (dataInput) {
    dataInput.addEventListener('change', () => construirGrade(dataInput.value));
    // Definir mínimo como hoje
    const hoje = new Date().toISOString().split('T')[0];
    dataInput.min = hoje;
  }

  // Publicar horários selecionados
  const btnLiberar = document.getElementById('btn-liberar');
  if (btnLiberar) {
    btnLiberar.addEventListener('click', async () => {
      const data = dataInput?.value;
      const vagas = parseInt(document.getElementById('vagas-input')?.value || '1');

      if (!data) { showNotification('Selecione uma data.', 'error'); return; }
      if (horariosSelecionados.size === 0) { showNotification('Selecione pelo menos um horário.', 'error'); return; }

      btnLiberar.textContent = 'Publicando...';
      btnLiberar.disabled = true;

      let erros = 0;
      for (const horario of [...horariosSelecionados].sort()) {
        try {
          await apiRequest('POST', '/agendamentos/disponibilidade', { data, horario: horario + ':00', vagas });
        } catch {
          erros++;
        }
      }

      btnLiberar.textContent = 'Liberar Horários na Agenda';
      btnLiberar.disabled = false;

      if (erros === 0) {
        showNotification(`${horariosSelecionados.size} horário(s) publicado(s) com sucesso!`);
      } else {
        showNotification(`${erros} horário(s) com erro. Verifique conflitos.`, 'warning');
      }

      await carregarSlots();
      construirGrade(data);
    });
  }
});
