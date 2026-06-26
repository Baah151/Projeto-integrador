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

  const el = (id) => document.getElementById(id);

  try {
    const [relAg, relPac] = await Promise.all([relatorioAgendamentos(), relatorioPacientes()]);

    if (relAg) {
      if (el('stat-total-agendados')) el('stat-total-agendados').textContent = relAg.total_agendados ?? 0;
      if (el('stat-finalizados')) el('stat-finalizados').textContent = relAg.finalizados ?? 0;
      if (el('stat-cancelados')) el('stat-cancelados').textContent = relAg.cancelados ?? 0;
      if (el('stat-receita')) el('stat-receita').textContent = formatarBRL(relAg.receita_total);
      if (el('stat-ticket-medio')) el('stat-ticket-medio').textContent = formatarBRL(relAg.ticket_medio);
    }

    if (relPac) {
      if (el('stat-total-pacientes')) el('stat-total-pacientes').textContent = relPac.total_pacientes ?? 0;
      if (el('stat-novos-mes')) el('stat-novos-mes').textContent = relPac.novos_mes ?? 0;
      if (el('stat-recorrentes')) el('stat-recorrentes').textContent = relPac.recorrentes ?? 0;
    }
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar relatórios.', 'error');
  }
});
