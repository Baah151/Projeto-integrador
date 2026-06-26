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

function formatarBRL(valor) {
  return `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
}

function formatarDataBR(dataString) {
  if (!dataString) return '--/--/----';
  const p = String(dataString).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

let sessoesLista = [];

function badgeStatus(s) {
  if (s.status_pagamento === 'Pago') return '<span class="badge-pago">Pago</span>';
  return '<span class="badge-pendente-fin">Pendente</span>';
}

function rowClass(s) {
  if (s.status_pagamento === 'Pago') return 'row-pago';
  return 'row-pendente';
}

function renderizarSessoes(lista) {
  const tbody = document.getElementById('finance-rows');
  const empty = document.getElementById('finance-empty');
  const wrapper = document.getElementById('finance-table-wrapper');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!lista || lista.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (wrapper) wrapper.style.display = 'block';
  if (empty) empty.style.display = 'none';

  lista.forEach(s => {
    const pago = s.status_pagamento === 'Pago';
    const tr = document.createElement('tr');
    tr.className = rowClass(s);
    tr.innerHTML = `
      <td><strong>${s.nome_paciente || '--'}</strong></td>
      <td>${formatarDataBR(s.data_sessao)}</td>
      <td style="text-align:center;font-weight:600;">#${s.numero_sessao || 1}</td>
      <td style="font-weight:700;color:#046C4E;">${formatarBRL(s.valor_sessao)}</td>
      <td style="color:#6B7280;font-size:0.82rem;">${s.forma_pagamento || '—'}</td>
      <td style="text-align:center;">${badgeStatus(s)}</td>
      <td style="text-align:center;">
        ${!pago ? `<button class="btn-confirmar-pag" data-id="${s.id_sessao}">Confirmar Pag.</button>` : '<span style="font-size:0.72rem;color:#10B981;font-weight:700;">✓ Pago</span>'}
      </td>
    `;
    if (!pago) {
      tr.querySelector('.btn-confirmar-pag').addEventListener('click', async (ev) => {
        const btn = ev.currentTarget;
        btn.disabled = true;
        try {
          await confirmarPagamentoSessao(s.id_sessao, { forma_pagamento: s.forma_pagamento });
          s.status_pagamento = 'Pago';
          s.pago_na_sessao = true;
          renderizarSessoes(sessoesLista);
          atualizarDashboard();
          showNotification('Pagamento confirmado!');
        } catch (err) {
          showNotification(err.message || 'Erro ao confirmar pagamento.', 'error');
          btn.disabled = false;
        }
      });
    }
    tbody.appendChild(tr);
  });
}

function atualizarDashboard() {
  const pago = sessoesLista.filter(s => s.status_pagamento === 'Pago');
  const pendente = sessoesLista.filter(s => s.status_pagamento !== 'Pago');

  const somaBRL = (arr) => arr.reduce((acc, s) => acc + parseFloat(s.valor_sessao || 0), 0);
  const el = (id) => document.getElementById(id);

  if (el('total-pago')) el('total-pago').textContent = formatarBRL(somaBRL(pago));
  if (el('cnt-pago')) el('cnt-pago').textContent = `${pago.length} sessão(ões)`;
  if (el('total-pendente')) el('total-pendente').textContent = formatarBRL(somaBRL(pendente));
  if (el('cnt-pendente')) el('cnt-pendente').textContent = `${pendente.length} sessão(ões)`;
  if (el('total-faturamento')) el('total-faturamento').textContent = formatarBRL(somaBRL(sessoesLista));
  if (el('total-sessoes')) el('total-sessoes').textContent = `${sessoesLista.length} sessão(ões)`;
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

  const filterMes = document.getElementById('filter-mes');
  if (filterMes) {
    const hoje = new Date();
    filterMes.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }

  async function carregarSessoes() {
    try {
      const params = {};
      if (filterMes && filterMes.value) params.mes = filterMes.value;
      sessoesLista = await listarSessoesProfissional(params);
      renderizarSessoes(sessoesLista);
      atualizarDashboard();
    } catch (err) {
      showNotification(err.message || 'Erro ao carregar sessões.', 'error');
    }
  }

  await carregarSessoes();

  if (filterMes) filterMes.addEventListener('change', carregarSessoes);

  document.getElementById('btn-exportar')?.addEventListener('click', () => {
    const printTxt = document.getElementById('print-data-txt');
    if (printTxt) printTxt.textContent = `Emitido em: ${new Date().toLocaleDateString('pt-BR')}`;
    window.print();
  });
});
