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

function setupNotificacoes() {
  const bell = document.getElementById('bell-button');
  const dropdown = document.getElementById('noti-dropdown');
  if (bell && dropdown) {
    bell.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }
}

function formatarDataBR(dataString) {
  if (!dataString) return '--/--/----';
  const p = dataString.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;
  gerenciarMenuMobile();
  setupNotificacoes();

  const usuario = getUsuario();
  const profissionalId = usuario?.id;

  const dropdownBody = document.getElementById('dropdown-body');
  if (dropdownBody) dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center;color:#9ca3af;">Nenhuma notificação.</div>';

  try {
    const dash = await obterDashboard(profissionalId);
    if (dash) {
      const el = (id) => document.getElementById(id);
      if (el('count-pacientes')) el('count-pacientes').textContent = dash.total_pacientes ?? 0;
      if (el('count-consultas')) el('count-consultas').textContent = dash.consultas_hoje ?? 0;
      if (el('count-solicitacoes')) el('count-solicitacoes').textContent = dash.solicitacoes_pendentes ?? 0;
    }
  } catch { /* dashboard é adicional, não crítico */ }

  const agendaEmpty = document.getElementById('agenda-empty');
  const agendaTable = document.getElementById('agenda-table-wrapper');
  const agendaRows = document.getElementById('agenda-rows');

  try {
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentos = await listarAgendamentos({ data: hoje, status: 'Agendado' });

    if (!agendamentos || agendamentos.length === 0) {
      if (agendaTable) agendaTable.style.display = 'none';
      if (agendaEmpty) agendaEmpty.style.display = 'block';
    } else {
      if (agendaTable) agendaTable.style.display = 'block';
      if (agendaEmpty) agendaEmpty.style.display = 'none';
      if (agendaRows) {
        agendaRows.innerHTML = '';
        agendamentos.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${item.horario ? item.horario.substring(0,5) : '--'}</strong></td>
            <td><span class="servico-badge">Consulta</span></td>
            <td>${item.nome_paciente || '--'}</td>
          `;
          agendaRows.appendChild(tr);
        });
      }
    }
  } catch {
    if (agendaTable) agendaTable.style.display = 'none';
    if (agendaEmpty) agendaEmpty.style.display = 'block';
  }
});
