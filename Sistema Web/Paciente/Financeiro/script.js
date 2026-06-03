const bancoFinanceiro = [];

function renderizarFinanceiro(filtroData = "") {
    const listContainer = document.getElementById('finance-list');
    const totalPagasElement = document.getElementById('total-pagas');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const dadosFiltrados = bancoFinanceiro.filter(item => {
        if (!filtroData) return true;
        if (!item.data) return false;
        const partesFiltro = filtroData.split('-');
        const anoFiltro = partesFiltro[0];
        const mesFiltro = partesFiltro[1];
        
        const partesDoc = item.data.split('/');
        const mesDoc = partesDoc[1];
        const anoDoc = partesDoc[2];
        return mesDoc === mesFiltro && anoDoc === anoFiltro;
    });

    if (totalPagasElement) {
        totalPagasElement.textContent = dadosFiltrados.length;
    }

    if (dadosFiltrados.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-finance">
                <span class="material-symbols-outlined">account_balance_wallet</span>
                <p>Nenhum lançamento financeiro encontrado.</p>
            </div>
        `;
        return;
    }

    dadosFiltrados.forEach(item => {
        const row = document.createElement('div');
        row.className = 'finance-item';
        row.innerHTML = `
            <span>${item.data || ''}</span>
            <span>${item.servico || ''}</span>
            <span>R$ ${typeof item.valor === 'number' ? item.valor.toFixed(2).replace('.', ',') : '0,00'}</span>
            <span class="status-pago">Pago</span>
            <div class="action-check">
                <span class="material-symbols-outlined" style="font-size: 20px;">check</span>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

function filtrarFinanceiro() {
    const filterInput = document.getElementById('finance-filter');
    if (filterInput) renderizarFinanceiro(filterInput.value);
}

function gerenciarMenuMobile() {
    const openBtn = document.getElementById('open-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const sidebar = document.getElementById('mobile-sidebar');
    const backdrop = document.getElementById('menu-backdrop');

    if (!openBtn || !sidebar || !backdrop) return;

    openBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    });

    const fecharMenu = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', fecharMenu);
    backdrop.addEventListener('click', fecharMenu);
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarFinanceiro();
    gerenciarMenuMobile();
});