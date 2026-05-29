window.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('patients-rows');
    const emptyRow = document.getElementById('empty-row');
    const searchInput = document.getElementById('search-input');
    const btnBuscar = document.getElementById('btn-buscar');

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

    // ARRAY ORIGINAL INICIALIZA VAZIO AGUARDANDO CONSUMO DA API REST DO JAVA
    let pacientesMock = [];

    function renderizarTabela(lista = pacientesMock) {
        if (!rowsContainer) return;
        
        const rows = rowsContainer.querySelectorAll('tr:not(.empty-row)');
        rows.forEach(r => r.remove());

        if (lista.length === 0) {
            if (emptyRow) emptyRow.style.display = 'table-row';
            return;
        }

        if (emptyRow) emptyRow.style.display = 'none';

        const listaOrdenada = [...lista].sort((a, b) => a.nome.localeCompare(b.nome));

        listaOrdenada.forEach(paciente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${paciente.nome}</strong></td>
                <td>${paciente.cpf}</td>
                <td>${paciente.telefone}</td>
                <td>${paciente.cadastro}</td>
                <td style="text-align: right;"><button class="btn-details">Ver Detalhes</button></td>
            `;

            tr.querySelector('.btn-details').addEventListener('click', () => {
                window.location.href = "../ver-detalhes/index.html";
            });

            rowsContainer.appendChild(tr);
        });
    }

    function apenasNumeros(string) {
        return string.replace(/\D/g, '');
    }

    function executarBusca() {
        if (!searchInput) return;
        const termoOriginal = searchInput.value.trim().toLowerCase();
        const termoApenasNumeros = apenasNumeros(termoOriginal);

        if (!termoOriginal) {
            renderizarTabela(pacientesMock);
            return;
        }

        const filtrados = pacientesMock.filter(p => {
            const bateNome = p.nome.toLowerCase().includes(termoOriginal);
            
            const pCpfLimpo = apenasNumeros(p.cpf);
            const pTelefoneLimpo = apenasNumeros(p.telefone);
            
            const bateCpf = termoApenasNumeros && pCpfLimpo.includes(termoApenasNumeros);
            const bateTelefone = termoApenasNumeros && pTelefoneLimpo.includes(termoApenasNumeros);

            return bateNome || bateCpf || bateTelefone;
        });

        renderizarTabela(filtrados);
    }

    function renderizacoesIniciais() {
        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
        }
        renderizarTabela();
    }

    if (btnBuscar) btnBuscar.addEventListener('click', executarBusca);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') executarBusca();
        });
    }

    renderizacoesIniciais();
});