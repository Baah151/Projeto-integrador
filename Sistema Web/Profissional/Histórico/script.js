window.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('history-rows');
    const tableWrapper = document.getElementById('table-wrapper');
    const emptyHistory = document.getElementById('empty-history');
    
    const searchInput = document.getElementById('search-input');
    const btnBuscar = document.getElementById('btn-buscar');
    const filterMes = document.getElementById('filter-mes');

    const bellButton = document.getElementById('bell-button');
    const notiDropdown = document.getElementById('noti-dropdown');
    const dropdownBody = document.getElementById('dropdown-body');

    if (bellButton) {
        bellButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (notiDropdown) notiDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', function() {
        if (notiDropdown) {
            notiDropdown.classList.remove('show');
        }
    });

    // LISTA PRINCIPAL ORIGINALMENTE LIMPA AGUARDANDO SUAS CHAMADAS DA API REST EM JAVA
    let historicoGlobalMock = [];

    function formatarDataBR(dataString) {
        if (!dataString) return "--/--/----";
        const partes = dataString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function renderizarTabela() {
        if (!rowsContainer) return;
        rowsContainer.innerHTML = '';
        
        const termoBusca = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const mesSelecionado = filterMes ? filterMes.value : ''; 

        const filtrados = historicoGlobalMock.filter(item => {
            const bateMes = !mesSelecionado || item.data.startsWith(mesSelecionado);
            const bateNome = item.nome.toLowerCase().includes(termoBusca);
            const bateServico = item.servico.toLowerCase().includes(termoBusca);
            
            return bateMes && (bateNome || bateServico);
        });

        if (filtrados.length === 0) {
            if (tableWrapper) tableWrapper.style.display = 'none';
            if (emptyHistory) emptyHistory.style.display = 'block';
            return;
        }

        if (tableWrapper) tableWrapper.style.display = 'block';
        if (emptyHistory) emptyHistory.style.display = 'none';

        filtrados.sort((a, b) => b.data.localeCompare(a.data));

        filtrados.forEach(item => {
            const tr = document.createElement('tr');
            
            let statusHTML = '';
            let acaoHTML = '';

            if (item.preenchido) {
                statusHTML = `<span class="status-badge preenchido">Preenchido</span>`;
                acaoHTML = `<span class="material-symbols-outlined icon-success-check">check_circle</span>`;
            } else {
                statusHTML = `<span class="status-badge pendente">Pendente</span>`;
                acaoHTML = `<button class="btn-go-details" data-id="${item.id}">Ver Detalhes</button>`;
            }

            tr.innerHTML = `
                <td><strong>${item.nome}</strong></td>
                <td>${formatarDataBR(item.data)}</td>
                <td>${item.servico}</td>
                <td>${statusHTML}</td>
                <td style="text-align: right;">${acaoHTML}</td>
            `;

            const btnAcao = tr.querySelector('.btn-go-details');
            if (btnAcao) {
                btnAcao.addEventListener('click', () => {
                    window.location.href = "../ver-detalhes/index.html";
                });
            }

            rowsContainer.appendChild(tr);
        });
    }

    function renderizacoesIniciais() {
        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
        }
        renderizarTabela();
    }

    if (btnBuscar) btnBuscar.addEventListener('click', renderizarTabela);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') renderizarTabela();
        });
    }
    
    if (filterMes) {
        filterMes.addEventListener('change', renderizarTabela);
    }

    renderizacoesIniciais();
});