const bancoFinanceiro = [];

function renderizarFinanceiro(filtroData = "") {
    const listContainer = document.getElementById('finance-list');
    const totalPagasElement = document.getElementById('total-pagas');
    listContainer.innerHTML = '';

    const dadosFiltrados = bancoFinanceiro.filter(item => {
        if (!filtroData) return true;
        const [anoFiltro, mesFiltro] = filtroData.split('-');
        const [diaDoc, mesDoc, anoDoc] = item.data.split('/');
        return mesDoc === mesFiltro && anoDoc === anoFiltro;
    });

    totalPagasElement.textContent = dadosFiltrados.length;

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
        row.classList.add('finance-item');
        row.innerHTML = `
            <span>${item.data}</span>
            <span>${item.servico}</span>
            <span>R$ ${item.valor.toFixed(2).replace('.', ',')}</span>
            <span class="status-pago">Pago</span>
            <div class="action-check">
                <span class="material-symbols-outlined">check</span>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

function filtrarFinanceiro() {
    const valor = document.getElementById('finance-filter').value;
    renderizarFinanceiro(valor);
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarFinanceiro();
});