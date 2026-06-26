let dadosFinanceiros = [];

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

function renderizarFinanceiro(filtroData = '') {
  const listContainer = document.getElementById('finance-list');
  const totalPagasElement = document.getElementById('total-pagas');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const filtrado = dadosFinanceiros.filter(item => {
    if (!filtroData) return true;
    const dataPag = String(item.data_pagamento || item.data_consulta || '').substring(0, 7);
    return dataPag === filtroData;
  });

  if (totalPagasElement) totalPagasElement.textContent = filtrado.length;

  if (filtrado.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-finance">
        <span class="material-symbols-outlined">account_balance_wallet</span>
        <p>Nenhum lançamento financeiro encontrado.</p>
      </div>`;
    return;
  }

  filtrado.forEach(item => {
    const row = document.createElement('div');
    row.className = 'finance-item';
    row.innerHTML = `
      <span>${formatarDataBR(item.data_pagamento || item.data_consulta)}</span>
      <span>${item.diagnostico || 'Consulta'}</span>
      <span>R$ ${parseFloat(item.valor || 0).toFixed(2).replace('.', ',')}</span>
      <span class="status-pago">${item.status_pagamento || 'Pago'}</span>
      <div class="action-check">
        <span class="material-symbols-outlined" style="font-size:20px;">check</span>
      </div>`;
    listContainer.appendChild(row);
  });
}

function filtrarFinanceiro() {
  const filterInput = document.getElementById('finance-filter');
  if (filterInput) renderizarFinanceiro(filterInput.value);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacaoPaciente()) return;
  gerenciarMenuMobile();

  try {
    dadosFinanceiros = await obterFinanceiroPaciente() || [];
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar financeiro.', 'error');
    dadosFinanceiros = [];
  }

  renderizarFinanceiro();

  const filterInput = document.getElementById('finance-filter');
  if (filterInput) filterInput.addEventListener('change', filtrarFinanceiro);
});
