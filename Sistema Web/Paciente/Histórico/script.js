const historicoConsultas = [];

function renderizarHistorico(filtroData = "") {
    const container = document.getElementById('history-container');
    container.innerHTML = '';

    const dadosFiltrados = historicoConsultas.filter(item => {
        if (!filtroData) return true;
        const [anoFiltro, mesFiltro] = filtroData.split('-');
        const [diaDoc, mesDoc, anoDoc] = item.data.split('/');
        return mesDoc === mesFiltro && anoDoc === anoFiltro;
    });

    if (dadosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-history">
                <span class="material-symbols-outlined">folder_open</span>
                <h2>Nenhum registro encontrado</h2>
                <p>Suas evoluções e histórico de atendimentos aparecerão aqui após as sessões.</p>
            </div>
        `;
        atualizarSininho();
        return;
    }

    dadosFiltrados.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('history-item');

        // Se a sessão acabou de ser finalizada e não foi vista, destaca a linha
        if (item.hasOwnProperty('lido') && !item.lido) {
            row.classList.add('new-history');
        }

        let docConteudo = 'Nenhum';
        if (item.documento) {
            row.addEventListener('click', () => { item.lido = true; renderizarHistorico(filtroData); });
            docConteudo = `
                <a href="#" class="btn-download-table" onclick="alert('Simulação: Baixando documento do histórico...')">
                    <span class="material-symbols-outlined" style="font-size: 16px;">download</span> Baixar
                </a>
            `;
        }

        row.innerHTML = `
            <span>${item.data}</span>
            <span>${item.horario}</span>
            <span style="font-weight: 500; color: #1F2937;">${item.servico}</span>
            <div>${docConteudo}</div>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;" title="${item.observacoes || ''}">${item.observacoes || 'Nenhuma'}</span>
            <span style="font-weight: 600; color: #1F2937;">R$ ${item.valor.toFixed(2).replace('.', ',')}</span>
        `;
        container.appendChild(row);
    });

    atualizarSininho();
}

function atualizarSininho() {
    const badgeSininho = document.getElementById('notif-badge');
    const badgeMenuHistorico = document.getElementById('history-notif-badge');
    
    const naoLidos = historicoConsultas.filter(item => item.hasOwnProperty('lido') && !item.lido).length;

    if (badgeSininho) {
        if (naoLidos > 0) {
            badgeSininho.innerText = naoLidos;
            badgeSininho.style.display = 'flex';
        } else {
            badgeSininho.style.display = 'none';
        }
    }

    if (badgeMenuHistorico) {
        if (naoLidos > 0) {
            badgeMenuHistorico.innerText = naoLidos;
            badgeMenuHistorico.style.display = 'flex';
        } else {
            badgeMenuHistorico.style.display = 'none';
        }
    }
}

function limparNotificacoes() {
    // Quando clica no sininho, marca todos os itens do histórico como lidos
    historicoConsultas.forEach(item => {
        if (item.hasOwnProperty('lido')) item.lido = true;
    });
    renderizarHistorico(document.getElementById('history-filter').value);
}

function filtrarHistorico() {
    const valor = document.getElementById('history-filter').value;
    renderizarHistorico(valor);
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarHistorico();
});