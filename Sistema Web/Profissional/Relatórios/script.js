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
  const reportMonth = el('report-month');

  if (reportMonth) {
    const hoje = new Date();
    reportMonth.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }

  async function carregarRelatorio() {
    try {
      const mes = reportMonth?.value;
      const params = {};
      if (mes) {
        const [ano, m] = mes.split('-').map(Number);
        const ultimo = new Date(ano, m, 0).getDate();
        params.inicio = `${mes}-01`;
        params.fim = `${mes}-${String(ultimo).padStart(2, '0')}`;
      }

      const [relAg, relPac] = await Promise.all([
        relatorioAgendamentos(params),
        relatorioPacientes()
      ]);

      const finalizados = relAg?.por_status?.['Finalizado'] ?? 0;
      const agendados = relAg?.por_status?.['Agendado'] ?? 0;
      const totalAg = relAg?.total ?? 0;
      const totalPac = Array.isArray(relPac) ? relPac.length : 0;
      const presenca = totalAg > 0 ? Math.round((finalizados / totalAg) * 100) : 0;

      if (el('metric-atendimentos')) el('metric-atendimentos').textContent = finalizados;
      if (el('metric-pacientes')) el('metric-pacientes').textContent = totalPac;
      if (el('metric-presenca')) el('metric-presenca').textContent = `${presenca}%`;

      // Barras verticais: Fisioterapia = Finalizados, Pilates = Agendados
      const maxBar = Math.max(finalizados, agendados, 1);
      const fisioH = Math.round((finalizados / maxBar) * 100);
      const pilaH = Math.round((agendados / maxBar) * 100);

      const barFisio = el('bar-fisio-height');
      if (barFisio) {
        barFisio.style.height = `${fisioH}%`;
        const txt = el('bar-fisio-txt');
        if (txt) txt.textContent = finalizados;
      }

      const barPilates = el('bar-pilates-height');
      if (barPilates) {
        barPilates.style.height = `${pilaH}%`;
        const txt = el('bar-pilates-txt');
        if (txt) txt.textContent = agendados;
      }

      // Barras horizontais por semana
      const weeksContainer = el('weeks-bars-container');
      if (weeksContainer && relAg?.agendamentos) {
        const semanas = [0, 0, 0, 0];
        relAg.agendamentos.forEach(a => {
          const dia = new Date(a.data_consulta + 'T12:00:00').getDate();
          const idx = Math.min(Math.floor((dia - 1) / 7), 3);
          semanas[idx]++;
        });

        const maxW = Math.max(...semanas, 1);
        weeksContainer.innerHTML = '';
        semanas.forEach((count, i) => {
          const pct = Math.round((count / maxW) * 100);
          const div = document.createElement('div');
          div.className = 'week-row';
          div.innerHTML = `
            <span class="week-label">Sem ${i + 1}</span>
            <div class="week-bar-bg">
              <div class="week-bar-fill" style="width:${pct}%;"></div>
            </div>
            <span class="week-value">${count}</span>
          `;
          weeksContainer.appendChild(div);
        });
      }
    } catch (err) {
      showNotification(err.message || 'Erro ao carregar relatórios.', 'error');
    }
  }

  await carregarRelatorio();

  if (reportMonth) reportMonth.addEventListener('change', carregarRelatorio);

  el('btn-exportar-pdf')?.addEventListener('click', () => {
    const txt = el('print-txt-data');
    if (txt) txt.textContent = `Relatório Gerencial Emitido em: ${new Date().toLocaleDateString('pt-BR')}`;
    window.print();
  });
});
