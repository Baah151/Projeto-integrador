// ARRAY ORIGINAL INICIALIZA VAZIO AGUARDANDO CONSUMO DA API REST DO JAVA
const historicoConsultas = [];

function renderizarHistorico(filtroData = "") {
    const container = document.getElementById('history-container');
    if (!container) return;
    container.innerHTML = '';

    const dadosFiltrados = historicoConsultas.filter(item => {
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
        row.className = 'history-item';

        if (item.hasOwnProperty('lido') && !item.lido) {
            row.classList.add('new-history');
        }

        let docConteudo = 'Nenhum';
        if (item.documento) {
            row.addEventListener('click', () => { 
                item.lido = true; 
                const filterInput = document.getElementById('history-filter');
                renderizarHistorico(filterInput ? filterInput.value : ""); 
            });
            docConteudo = `
                <a href="#" class="btn-download-table" onclick="alert('Simulação: Baixando documento do histórico...')">
                    <span class="material-symbols-outlined" style="font-size: 16px;">download</span> Baixar
                </a>
            `;
        }

        row.innerHTML = `
            <span>${item.data || ''}</span>
            <span>${item.horario || ''}</span>
            <span style="font-weight: 500; color: #1F2937;">${item.servico || ''}</span>
            <div>${docConteudo}</div>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;" title="${item.observacoes || ''}">${item.observacoes || 'Nenhuma'}</span>
            <span style="font-weight: 600; color: #1F2937;">R$ ${typeof item.valor === 'number' ? item.valor.toFixed(2).replace('.', ',') : '0,00'}</span>
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
    historicoConsultas.forEach(item => {
        if (item.hasOwnProperty('lido')) item.lido = true;
    });
    const filterInput = document.getElementById('history-filter');
    renderizarHistorico(filterInput ? filterInput.value : "");
}

function filtrarHistorico() {
    const filterInput = document.getElementById('history-filter');
    if (filterInput) renderizarHistorico(filterInput.value);
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarHistorico();
});