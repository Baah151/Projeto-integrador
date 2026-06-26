let historicoConsultas = [];

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

function renderizarHistorico(filtroData = '') {
  const container = document.getElementById('history-container');
  if (!container) return;
  container.innerHTML = '';

  const filtrado = historicoConsultas.filter(item => {
    if (!filtroData) return true;
    const dataConsulta = String(item.data_consulta || '').substring(0, 7);
    return dataConsulta === filtroData;
  });

  if (filtrado.length === 0) {
    container.innerHTML = `
      <div class="empty-history">
        <span class="material-symbols-outlined">folder_open</span>
        <h2>Nenhum registro encontrado</h2>
        <p>Suas evoluções e histórico de atendimentos aparecerão aqui após as sessões.</p>
      </div>`;
    return;
  }

  filtrado.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `
      <span>${formatarDataBR(item.data_consulta)}</span>
      <span>${formatarHorario(item.horario)}</span>
      <span style="font-weight:500;color:#1F2937;">${item.descricao || item.diagnostico || '—'}</span>
      <div>—</div>
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;" title="${item.obs_consulta || ''}">${item.obs_consulta || 'Nenhuma'}</span>
      <span style="font-weight:600;color:#1F2937;">R$ ${parseFloat(item.valor || 0).toFixed(2).replace('.', ',')}</span>`;
    container.appendChild(row);
  });
}

function filtrarHistorico() {
  const filterInput = document.getElementById('history-filter');
  if (filterInput) renderizarHistorico(filterInput.value);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacaoPaciente()) return;
  gerenciarMenuMobile();

  try {
    historicoConsultas = await obterHistoricoPaciente() || [];
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar histórico.', 'error');
    historicoConsultas = [];
  }

  renderizarHistorico();

  const filterInput = document.getElementById('history-filter');
  if (filterInput) filterInput.addEventListener('change', filtrarHistorico);
});
