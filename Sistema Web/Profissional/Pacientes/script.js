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

let pacientesLista = [];

function formatarDataBR(dataString) {
  if (!dataString) return '--/--/----';
  const p = String(dataString).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function renderizarTabela(lista) {
  const rowsContainer = document.getElementById('patients-rows');
  const emptyRow = document.getElementById('empty-row');
  if (!rowsContainer) return;

  const rows = rowsContainer.querySelectorAll('tr:not(.empty-row)');
  rows.forEach(r => r.remove());

  if (!lista || lista.length === 0) {
    if (emptyRow) emptyRow.style.display = 'table-row';
    return;
  }
  if (emptyRow) emptyRow.style.display = 'none';

  const sorted = [...lista].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  sorted.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.nome || '--'}</strong></td>
      <td>${formatarTelefone(p.telefone)}</td>
      <td>${formatarDataBR(p.nascimento)}</td>
      <td style="text-align:right;"><button class="btn-details" data-id="${p.id_paciente}">Ver Detalhes</button></td>
    `;
    tr.querySelector('.btn-details').addEventListener('click', () => {
      localStorage.setItem('pacienteId', p.id_paciente);
      window.location.href = '../ver-detalhes/index.html';
    });
    rowsContainer.appendChild(tr);
  });
}

async function carregarPacientes() {
  try {
    pacientesLista = await listarPacientes();
    renderizarTabela(pacientesLista);
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar pacientes.', 'error');
  }
}

async function limparPacientesTeste() {
  if (!confirm('⚠️ ATENÇÃO!\n\nIsso vai DELETAR TODOS os pacientes cadastrados.\nEsta ação NÃO pode ser desfeita!\n\nTem certeza?')) return;
  if (!confirm('⚠️ ÚLTIMA CONFIRMAÇÃO!\n\nVocê REALMENTE quer deletar TODOS os pacientes?')) return;

  const btn = document.getElementById('btn-limpar-pacientes');
  if (btn) { btn.textContent = 'Deletando...'; btn.disabled = true; }

  try {
    const lista = await listarPacientes();
    for (const p of lista) {
      await deletarPaciente(p.id_paciente);
    }
    showNotification(`${lista.length} paciente(s) deletado(s) com sucesso!`);
    pacientesLista = [];
    renderizarTabela([]);
  } catch (err) {
    showNotification(err.message || 'Erro ao deletar pacientes.', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined">delete_sweep</span> Limpar Dados de Teste';
      btn.disabled = false;
    }
  }
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

  const searchInput = document.getElementById('search-input');
  const btnBuscar = document.getElementById('btn-buscar');

  function executarBusca() {
    const termo = (searchInput?.value || '').trim().toLowerCase();
    if (!termo) { renderizarTabela(pacientesLista); return; }
    const filtrados = pacientesLista.filter(p =>
      (p.nome || '').toLowerCase().includes(termo) ||
      (p.cpf || '').replace(/\D/g, '').includes(termo.replace(/\D/g, '')) ||
      (p.telefone || '').replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
    );
    renderizarTabela(filtrados);
  }

  if (btnBuscar) btnBuscar.addEventListener('click', executarBusca);
  if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') executarBusca(); });

  await carregarPacientes();

  document.getElementById('btn-limpar-pacientes')?.addEventListener('click', limparPacientesTeste);
});
